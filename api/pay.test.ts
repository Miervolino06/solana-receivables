import { describe, expect, it, vi } from 'vitest';
import { Connection, Keypair, Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { createRequest, encodeRequest } from '../src/payments';
import { ACTION_HEADERS, createActionHandler, disclosure } from './pay';

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

  it('serves review metadata and an unsigned exact two-instruction payment', async () => {
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
    const post = response(); await handler({ method: 'POST', url, body: { account: payer.toBase58() } }, post.res);
    expect(post.state.status).toBe(200);
    const body = post.state.body as { transaction: string; message: string };
    const transaction = Transaction.from(Buffer.from(body.transaction, 'base64'));
    expect(transaction.instructions).toHaveLength(2);
    expect(transaction.feePayer?.toBase58()).toBe(payer.toBase58());
    expect(transaction.signatures.every(signature => signature.signature === null)).toBe(true);
    expect(body.message).toContain(request.recipient);
    expect(body.message).toContain('Platform fee: 0 SOL');
  });
});
