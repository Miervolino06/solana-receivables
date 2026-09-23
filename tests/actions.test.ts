import { describe, expect, it, vi } from 'vitest';
import { ComputeBudgetInstruction, ComputeBudgetProgram, Connection, Keypair, Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import bs58 from 'bs58';
import { createRequest, encodeRequest } from '../src/payments';
import { ACTION_HEADERS, createActionHandler, disclosure } from '../api/pay';

function response() {
  const state = { status: 200, headers: {} as Record<string, string>, body: undefined as unknown };
  const res = {
    setHeader: (name: string, value: string) => { state.headers[name] = value; },
    status: (code: number) => { state.status = code; return res; },
    json: (value: unknown) => { state.body = value; },
    end: vi.fn(),
  };
  return { state, res };
}

describe('Solana Action surface', () => {
  it('handles preflight without any RPC access and declares Devnet', async () => {
    const rpc = { getGenesisHash: vi.fn() };
    const { state, res } = response();
    await createActionHandler(rpc as unknown as Connection)({ method: 'OPTIONS' }, res);
    expect(state.status).toBe(204);
    expect(rpc.getGenesisHash).not.toHaveBeenCalled();
    expect(state.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(ACTION_HEADERS['X-Blockchain-Ids']).toBe('solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1');
  });

  it('rejects invalid request data before network or transaction construction', async () => {
    const rpc = { getGenesisHash: vi.fn() };
    const { state, res } = response();
    await createActionHandler(rpc as unknown as Connection)({ method: 'POST', url: '/api/pay?r=garbage', body: { account: Keypair.generate().publicKey.toBase58() } }, res);
    expect(state.status).toBe(400);
    expect(rpc.getGenesisHash).not.toHaveBeenCalled();
  });

  it('rejects malformed POST bodies before any RPC call', async () => {
    const request = createRequest({ recipient: Keypair.generate().publicKey.toBase58(), amount: '0.01', label: 'Example', description: '' });
    const rpc = { getGenesisHash: vi.fn() };
    const handler = createActionHandler(rpc as unknown as Connection);
    const url = `/api/pay?r=${encodeRequest(request)}`;
    for (const body of [undefined, {}, { account: Keypair.generate().publicKey.toBase58(), extra: true },
      { account: Keypair.generate().publicKey.toBase58(), data: { unexpected: 'value' } }, 'x'.repeat(513)]) {
      const result = response();
      await handler({ method: 'POST', url, body }, result.res);
      expect(result.state.status).toBe(400);
    }
    expect(rpc.getGenesisHash).not.toHaveBeenCalled();
  });

  it('caps history work and fails closed for a busy reference', async () => {
    const request = createRequest({ recipient: Keypair.generate().publicKey.toBase58(), amount: '0.01', label: 'Example', description: '' });
    const rpc = {
      getGenesisHash: vi.fn().mockResolvedValue('EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG'),
      getSignaturesForAddress: vi.fn().mockImplementation(async (_reference, options) =>
        Array.from({ length: options.limit }, (_, index) => ({ signature: bs58.encode(new Uint8Array(64).fill(index + 1)), err: null }))),
      getTransaction: vi.fn().mockResolvedValue({ meta: { err: 'failed' } }),
    };
    const result = response();
    await createActionHandler(rpc as unknown as Connection)({ method: 'GET', url: `/api/pay?r=${encodeRequest(request)}` }, result.res);
    expect(result.state.status).toBe(409);
    expect(rpc.getSignaturesForAddress).toHaveBeenCalledWith(expect.anything(), { limit: 10 }, 'confirmed');
    expect(rpc.getTransaction).toHaveBeenCalledTimes(10);
    expect(JSON.stringify(result.state.body)).not.toContain('transaction');
  });

  it('limits each instance and does not reflect arbitrary RPC errors', async () => {
    const request = createRequest({ recipient: Keypair.generate().publicKey.toBase58(), amount: '0.01', label: 'Example', description: '' });
    const url = `/api/pay?r=${encodeRequest(request)}`;
    const rpc = { getGenesisHash: vi.fn().mockRejectedValue(new Error('provider response: private-marker')) };
    const handler = createActionHandler(rpc as unknown as Connection);
    for (let index = 0; index < 30; index++) {
      const result = response();
      await handler({ method: 'GET', url }, result.res);
      expect(result.state.status).toBe(502);
      expect(JSON.stringify(result.state.body)).not.toContain('private-marker');
    }
    const limited = response();
    await handler({ method: 'GET', url }, limited.res);
    expect(limited.state.status).toBe(429);
    expect(limited.state.headers['Retry-After']).toBe('60');
    expect(rpc.getGenesisHash).toHaveBeenCalledTimes(30);
  });

  it('rejects excess concurrent reviews on one instance', async () => {
    const request = createRequest({ recipient: Keypair.generate().publicKey.toBase58(), amount: '0.01', label: 'Example', description: '' });
    const url = `/api/pay?r=${encodeRequest(request)}`;
    let release!: (value: string) => void;
    const pending = new Promise<string>(resolve => { release = resolve; });
    const rpc = { getGenesisHash: vi.fn().mockReturnValue(pending) };
    const handler = createActionHandler(rpc as unknown as Connection);
    const responses = Array.from({ length: 4 }, () => response());
    const work = responses.map(result => handler({ method: 'GET', url }, result.res));
    const limited = response();
    await handler({ method: 'GET', url }, limited.res);
    expect(limited.state.status).toBe(503);
    expect(rpc.getGenesisHash).toHaveBeenCalledTimes(4);
    release('wrong-network');
    await Promise.all(work);
  });

  it('aborts a stalled default RPC instead of leaving network work running', async () => {
    vi.useFakeTimers();
    let observedSignal: AbortSignal | undefined;
    const fetchMock = vi.fn((_input: unknown, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      observedSignal = init?.signal ?? undefined;
      observedSignal?.addEventListener('abort', () => reject(new Error('upstream timeout detail')), { once: true });
    }));
    vi.stubGlobal('fetch', fetchMock);
    try {
      const request = createRequest({ recipient: Keypair.generate().publicKey.toBase58(), amount: '0.01', label: 'Example', description: '' });
      const result = response();
      const pending = createActionHandler()({ method: 'GET', url: `/api/pay?r=${encodeRequest(request)}` }, result.res);
      await vi.advanceTimersByTimeAsync(15_000);
      await pending;
      expect(result.state.status).toBe(504);
      expect(observedSignal?.aborted).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(JSON.stringify(result.state.body)).not.toContain('upstream timeout detail');
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });

  it('refuses a mainnet provider even with a valid request', async () => {
    const request = createRequest({ recipient: Keypair.generate().publicKey.toBase58(), amount: '0.01', label: 'Example', description: 'Demo payment' });
    const { state, res } = response();
    await createActionHandler({ getGenesisHash: async () => 'mainnet' } as unknown as Connection)({ method: 'GET', url: `/api/pay?r=${encodeRequest(request)}` }, res);
    expect(state.status).toBe(400);
    expect(JSON.stringify(state.body)).toContain('Devnet');
    expect(JSON.stringify(state.body)).not.toContain('transaction');
  });

  it('discloses exact amount, fee, total, recipient and material risks', () => {
    const request = createRequest({ recipient: Keypair.generate().publicKey.toBase58(), amount: '0.000000001', label: 'Example', description: '' });
    const text = disclosure(request, 5000n);
    expect(text).toContain('0.000000001 SOL');
    expect(text).toContain('total: 0.000005001 SOL');
    expect(text).toContain(request.recipient);
    expect(text).toContain('public');
    expect(text).toContain('cannot be reversed');
    expect(text).toContain('not a token or guarantee of delivery');
  });

  it('serves an unsigned payment with its zero priority fee fixed before wallet review', async () => {
    const payer = Keypair.generate().publicKey;
    const request = createRequest({ recipient: Keypair.generate().publicKey.toBase58(), amount: '0.01', label: 'Studio', description: 'Work delivered' });
    const rpc = {
      getGenesisHash: async () => 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG',
      getSignaturesForAddress: async () => [], getAccountInfo: async () => null,
      getBalance: async () => 100_000_000,
      getLatestBlockhash: async () => ({ blockhash: Keypair.generate().publicKey.toBase58(), lastValidBlockHeight: 100 }),
      getFeeForMessage: async () => ({ value: 5000 }),
      simulateTransaction: async () => ({ value: { err: null } }),
    } as unknown as Connection;
    const handler = createActionHandler(rpc, 'https://example.com');
    const url = `/api/pay?r=${encodeRequest(request)}`;
    const get = response(); await handler({ method: 'GET', url }, get.res);
    expect(get.state.status).toBe(200);
    expect(get.state.body).toMatchObject({ type: 'action', icon: 'https://example.com/action-icon.svg', disabled: false });
    expect((get.state.body as {description: string}).description).toContain('total: 0.010005 SOL');
    const post = response(); await handler({ method: 'POST', url, body: { account: payer.toBase58(), data: {} } }, post.res);
    expect(post.state.status).toBe(200);
    const body = post.state.body as { transaction: string; message: string };
    const transaction = Transaction.from(Buffer.from(body.transaction, 'base64'));
    expect(transaction.instructions).toHaveLength(4);
    const [limit, price] = transaction.instructions;
    expect(limit.programId.equals(ComputeBudgetProgram.programId)).toBe(true);
    expect(ComputeBudgetInstruction.decodeSetComputeUnitLimit(limit).units).toBe(400_000);
    expect(ComputeBudgetInstruction.decodeSetComputeUnitPrice(price).microLamports).toBe(0n);
    expect(transaction.feePayer?.toBase58()).toBe(payer.toBase58());
    expect(transaction.signatures.every(signature => signature.signature === null)).toBe(true);
    expect(body.message).toContain(request.recipient);
    expect(body.message).toContain('Platform fee: 0 SOL');
  });
});
