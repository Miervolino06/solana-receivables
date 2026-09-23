import { afterEach, describe, expect, it, vi } from 'vitest';
import { Keypair, Transaction, type Connection, type Message, type VersionedTransactionResponse } from '@solana/web3.js';
import {
  buildPaymentTransaction, createRequest, decodeRequest, encodeRequest, findPayment,
  formatSol, parseSol, preparePayment, sendPayment, verifyPaymentTransaction,
  signWalletTransaction, WalletSigningError,
  type PaymentRequest,
} from './payments';

const GENESIS = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
afterEach(() => vi.restoreAllMocks());

function request(): PaymentRequest {
  return createRequest({ recipient: Keypair.generate().publicKey.toBase58(), amount: '1.25',
    label: 'Studio', description: 'Prototype delivery' });
}
function fixture() {
  const payer = Keypair.generate();
  const req = request();
  const tx = buildPaymentTransaction(req, payer.publicKey, Keypair.generate().publicKey.toBase58());
  tx.sign(payer);
  const message = tx.compileMessage();
  const actualSignature = tx.signatures[0].signature!;
  const base58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let numeric = 0n;
  for (const byte of actualSignature) numeric = numeric * 256n + BigInt(byte);
  let encoded = '';
  while (numeric > 0n) { encoded = base58[Number(numeric % 58n)] + encoded; numeric /= 58n; }
  for (const byte of actualSignature) { if (byte !== 0) break; encoded = `1${encoded}`; }
  const preBalances = message.accountKeys.map(() => 0);
  const postBalances = message.accountKeys.map(() => 0);
  const recipientIndex = message.accountKeys.findIndex(key => key.toBase58() === req.recipient);
  preBalances[0] = 3_000_000_000;
  postBalances[0] = 3_000_000_000 - 1_250_000_000 - 5_000;
  preBalances[recipientIndex] = 100_000;
  postBalances[recipientIndex] = 1_250_100_000;
  const response = {
    version: 'legacy', slot: 42, blockTime: 1_700_000_000,
    transaction: { message, signatures: [encoded] },
    meta: { err: null, fee: 5_000, preBalances, postBalances },
  } as VersionedTransactionResponse;
  return { payer, req, tx, signature: encoded, response };
}
function rpcMock(response?: VersionedTransactionResponse, signature?: string): Connection {
  return {
    getGenesisHash: vi.fn().mockResolvedValue(GENESIS),
    getSignaturesForAddress: vi.fn().mockResolvedValue(signature ? [{ signature, err: null }] : []),
    getTransaction: vi.fn().mockResolvedValue(response ?? null),
    getBalance: vi.fn().mockResolvedValue(3_000_000_000),
    getAccountInfo: vi.fn().mockResolvedValue(null),
    getLatestBlockhash: vi.fn().mockResolvedValue({ blockhash: Keypair.generate().publicKey.toBase58(), lastValidBlockHeight: 100 }),
    getFeeForMessage: vi.fn().mockResolvedValue({ value: 5_000 }),
    simulateTransaction: vi.fn().mockResolvedValue({ value: { err: null } }),
    getBlockHeight: vi.fn().mockResolvedValue(50),
    sendRawTransaction: vi.fn().mockResolvedValue(signature),
    confirmTransaction: vi.fn().mockResolvedValue({ value: { err: null } }),
  } as unknown as Connection;
}

describe('request encoding and money', () => {
  it('uses exact lamports and rejects malformed decimal input', () => {
    expect(parseSol('0.000000001')).toBe(1n);
    expect(parseSol('100')).toBe(100_000_000_000n);
    expect(formatSol(1_250_000_001n)).toBe('1.250000001');
    for (const value of ['0', '-1', '1e-3', '1.0000000001', '01', '1,2', '101']) {
      expect(() => parseSol(value)).toThrow();
    }
  });
  it('round trips only canonical request links with exact known fields', () => {
    const req = request();
    expect(decodeRequest(encodeRequest(req))).toEqual(req);
    expect(() => decodeRequest(`${encodeRequest(req)}=`)).toThrow();
    expect(() => decodeRequest('x'.repeat(1025))).toThrow();
    expect(() => encodeRequest({ ...req, extra: true } as PaymentRequest)).toThrow();
    expect(() => encodeRequest({ ...req, label: 'é'.repeat(21) })).toThrow();
  });
});

describe('Devnet payment proof', () => {
  it('passes Devnet and the connected payer to a Wallet Standard sign-only feature', async () => {
    const { payer, req } = fixture();
    const tx = buildPaymentTransaction(req, payer.publicKey, Keypair.generate().publicKey.toBase58());
    const account = { address: payer.publicKey.toBase58(), chains: ['solana:devnet'], features: ['solana:signTransaction'] };
    const signTransaction = vi.fn(async (input: { account: typeof account; transaction: Uint8Array; chain: string }) => {
      const signed = Transaction.from(input.transaction);
      signed.sign(payer);
      return [{ signedTransaction: signed.serialize() }];
    });
    const adapter = { standard: true, wallet: { accounts: [account], chains: ['solana:devnet'], features: {
      'solana:signTransaction': { version: '1.0.0', supportedTransactionVersions: ['legacy'], signTransaction },
    } } };
    const fallback = vi.fn(async () => { throw new Error('Legacy signer must not run'); });
    const signed = await signWalletTransaction(tx, payer.publicKey, adapter, fallback);
    expect(signTransaction).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ account, chain: 'solana:devnet' }));
    expect(signed.verifySignatures()).toBe(true);
    expect(fallback).not.toHaveBeenCalled();
  });
  it('does not sign for another account or a Standard wallet without Devnet support', async () => {
    const { payer, req } = fixture();
    const tx = buildPaymentTransaction(req, payer.publicKey, Keypair.generate().publicKey.toBase58());
    const signTransaction = vi.fn();
    const fallback = vi.fn();
    const adapter = { standard: true, wallet: { accounts: [
      { address: Keypair.generate().publicKey.toBase58(), chains: ['solana:devnet'], features: ['solana:signTransaction'] },
    ], chains: ['solana:devnet'], features: { 'solana:signTransaction': { version: '1.0.0', supportedTransactionVersions: ['legacy'], signTransaction } } } };
    await expect(signWalletTransaction(tx, payer.publicKey, adapter, fallback)).rejects.toThrow(/payer/i);
    adapter.wallet.accounts[0].address = payer.publicKey.toBase58();
    adapter.wallet.chains = ['solana:mainnet'];
    await expect(signWalletTransaction(tx, payer.publicKey, adapter, fallback)).rejects.toThrow(/Devnet/i);
    expect(signTransaction).not.toHaveBeenCalled();
    expect(fallback).not.toHaveBeenCalled();
  });
  it('never falls back to another signer after a Standard wallet rejects', async () => {
    const { payer, req } = fixture();
    const tx = buildPaymentTransaction(req, payer.publicKey, Keypair.generate().publicKey.toBase58());
    const account = { address: payer.publicKey.toBase58(), chains: ['solana:devnet'], features: ['solana:signTransaction'] };
    const signTransaction = vi.fn().mockRejectedValue(new Error('Wallet refused'));
    const fallback = vi.fn();
    const adapter = { standard: true, wallet: { accounts: [account], chains: ['solana:devnet'], features: {
      'solana:signTransaction': { version: '1.0.0', supportedTransactionVersions: ['legacy'], signTransaction },
    } } };
    await expect(signWalletTransaction(tx, payer.publicKey, adapter, fallback)).rejects.toThrow('Wallet refused');
    expect(fallback).not.toHaveBeenCalled();
  });
  it('verifies a signed two-instruction transfer, memo and exact balance changes', () => {
    const { req, signature, response } = fixture();
    expect(verifyPaymentTransaction(signature, req, response)).toMatchObject({
      recipient: req.recipient, amountLamports: 1_250_000_000n, feeLamports: 5_000n, slot: 42,
    });
    expect((response.transaction.message as Message).instructions).toHaveLength(2);
  });
  it.each([
    { version: '1.0.0', supportedTransactionVersions: [0] },
    { version: '2.0.0', supportedTransactionVersions: ['legacy'] },
  ])('rejects incompatible signing capabilities before opening a wallet: %j', async capability => {
    const { payer, tx } = fixture();
    const signTransaction = vi.fn();
    const fallback = vi.fn();
    const account = { address: payer.publicKey.toBase58(), chains: ['solana:devnet'], features: ['solana:signTransaction'] };
    const adapter = { standard: true, wallet: { accounts: [account], chains: ['solana:devnet'], features: {
      'solana:signTransaction': { ...capability, signTransaction },
    } } };
    await expect(signWalletTransaction(tx, payer.publicKey, adapter, fallback)).rejects.toThrow(/legacy/i);
    expect(signTransaction).not.toHaveBeenCalled();
    expect(fallback).not.toHaveBeenCalled();
  });
  it('rejects multiple signing responses for one reviewed payment', async () => {
    const { payer, tx } = fixture();
    const signedTransaction = tx.serialize();
    const signTransaction = vi.fn().mockResolvedValue([{ signedTransaction }, { signedTransaction }]);
    const fallback = vi.fn();
    const account = { address: payer.publicKey.toBase58(), chains: ['solana:devnet'], features: ['solana:signTransaction'] };
    const adapter = { standard: true, wallet: { accounts: [account], chains: ['solana:devnet'], features: {
      'solana:signTransaction': { version: '1.0.0', supportedTransactionVersions: ['legacy'], signTransaction },
    } } };
    await expect(signWalletTransaction(tx, payer.publicKey, adapter, fallback)).rejects.toThrow(/exactly one/i);
    expect(fallback).not.toHaveBeenCalled();
  });
  it('rejects the wrong amount, recipient, memo, extra instruction, failure and balance mismatch', () => {
    const { req, signature, response } = fixture();
    const changed = (patch: object) => ({ ...response, ...patch }) as VersionedTransactionResponse;
    expect(() => verifyPaymentTransaction(signature, { ...req, amountLamports: '2' }, response)).toThrow();
    expect(() => verifyPaymentTransaction(signature, { ...req, recipient: Keypair.generate().publicKey.toBase58() }, response)).toThrow();
    expect(() => verifyPaymentTransaction(signature, { ...req, description: 'Other' }, response)).toThrow();
    expect(() => verifyPaymentTransaction(signature, req, changed({ meta: { ...response.meta!, err: { InstructionError: [0, 'Custom'] } } }))).toThrow();
    expect(() => verifyPaymentTransaction(signature, req, changed({ meta: {
      ...response.meta!, postBalances: response.meta!.postBalances.map((balance, index) => index === 0 ? balance + 1 : balance),
    } }))).toThrow(/balance/i);
    const extra = { ...response, transaction: { ...response.transaction,
      message: Object.assign(Object.create(Object.getPrototypeOf(response.transaction.message)), response.transaction.message) } } as VersionedTransactionResponse;
    (extra.transaction.message as Message).instructions =
      [...(response.transaction.message as Message).instructions, (response.transaction.message as Message).instructions[1]];
    expect(() => verifyPaymentTransaction(signature, req, extra)).toThrow(/structure/i);
  });
  it('rejects self-payment before constructing a transaction', () => {
    const payer = Keypair.generate();
    expect(() => buildPaymentTransaction({ ...request(), recipient: payer.publicKey.toBase58() }, payer.publicKey,
      Keypair.generate().publicKey.toBase58())).toThrow(/own wallet/i);
  });
  it('rejects edited preparation before signing, and a wallet edited message', async () => {
    const { payer, req } = fixture();
    const rpc = rpcMock();
    const prepared = await preparePayment(req, payer.publicKey, rpc);
    const sign = vi.fn(async (tx: Transaction) => { tx.sign(payer); return tx; });
    prepared.totalLamports += 1n;
    await expect(sendPayment(prepared, sign, rpc)).rejects.toThrow(/changed/i);
    expect(sign).not.toHaveBeenCalled();
    const prepared2 = await preparePayment(req, payer.publicKey, rpc);
    await expect(sendPayment(prepared2, async tx => {
      tx.instructions[0].data[4] ^= 1;
      tx.sign(payer);
      return tx;
    }, rpc)).rejects.toThrow(/changed/i);
  });
  it('sends one signed transaction and reconstructs its receipt from chain data', async () => {
    const { payer, req, tx, signature, response } = fixture();
    const rpc = rpcMock(response);
    vi.mocked(rpc.getLatestBlockhash).mockResolvedValue({ blockhash: tx.recentBlockhash!, lastValidBlockHeight: 100 });
    vi.mocked(rpc.sendRawTransaction).mockResolvedValue(signature);
    const prepared = await preparePayment(req, payer.publicKey, rpc);
    expect(prepared.totalLamports).toBe(1_250_005_000n);
    const persist = vi.fn((value: string) => {
      expect(value).toBe(signature);
      expect(rpc.sendRawTransaction).not.toHaveBeenCalled();
    });
    const receipt = await sendPayment(prepared, async unsigned => { unsigned.sign(payer); return unsigned; }, rpc, persist);
    expect(persist).toHaveBeenCalledExactlyOnceWith(signature);
    expect(receipt).toMatchObject({ signature, recipient: req.recipient, amountLamports: 1_250_000_000n });
    expect(rpc.sendRawTransaction).toHaveBeenCalledTimes(1);
    await expect(sendPayment(prepared, async unsigned => unsigned, rpc)).rejects.toThrow(/already submitted/i);
  });
  it('aborts before broadcast if signature persistence throws, and releases retry guards', async () => {
    const { payer, req, tx, signature, response } = fixture();
    const rpc = rpcMock(response);
    vi.mocked(rpc.getLatestBlockhash).mockResolvedValue({ blockhash: tx.recentBlockhash!, lastValidBlockHeight: 100 });
    vi.mocked(rpc.sendRawTransaction).mockResolvedValue(signature);
    const prepared = await preparePayment(req, payer.publicKey, rpc);
    const sign = async (unsigned: Transaction) => { unsigned.sign(payer); return unsigned; };
    await expect(sendPayment(prepared, sign, rpc, () => { throw new Error('Storage is full'); })).rejects.toThrow('Storage is full');
    expect(rpc.sendRawTransaction).not.toHaveBeenCalled();
    expect(await findPayment(req, rpc)).toBeNull();
    await expect(sendPayment(prepared, sign, rpc, () => {})).resolves.toMatchObject({ signature });
    expect(rpc.sendRawTransaction).toHaveBeenCalledTimes(1);
  });
  it('detects a verified duplicate reference and rejects a pending reference', async () => {
    const { payer, req, response, signature } = fixture();
    const rpc = rpcMock(response, signature);
    expect(await findPayment(req, rpc)).toMatchObject({ signature });
    await expect(preparePayment(req, payer.publicKey, rpc)).rejects.toThrow(/already/i);
    const pendingRpc = rpcMock(undefined, signature);
    await expect(findPayment(req, pendingRpc)).rejects.toMatchObject({ signature });
  });
  it('fails closed if the history RPC fails or recipient is program-owned', async () => {
    const { payer, req } = fixture();
    const rpc = rpcMock();
    vi.mocked(rpc.getSignaturesForAddress).mockRejectedValueOnce(new Error('RPC unavailable'));
    await expect(preparePayment(req, payer.publicKey, rpc)).rejects.toThrow(/RPC unavailable/);
    vi.mocked(rpc.getAccountInfo).mockResolvedValueOnce({ owner: Keypair.generate().publicKey } as never);
    await expect(preparePayment(req, payer.publicKey, rpc)).rejects.toThrow(/program/i);
  });
  it('retains an ambiguous signature even before reference indexing catches up', async () => {
    const { payer, req } = fixture();
    const rpc = rpcMock();
    vi.mocked(rpc.sendRawTransaction).mockRejectedValue(new Error('Connection lost'));
    const prepared = await preparePayment(req, payer.publicKey, rpc);
    const failure = await sendPayment(prepared, async tx => { tx.sign(payer); return tx; }, rpc).catch(error => error);
    expect(failure.name).toBe('PendingPaymentError');
    expect(failure.signature).toBeTruthy();
    await expect(preparePayment(req, payer.publicKey, rpc)).rejects.toMatchObject({ signature: failure.signature });
    expect(rpc.sendRawTransaction).toHaveBeenCalledTimes(1);
  });
  it('permits only one concurrent wallet operation for the same reference', async () => {
    const { payer, req } = fixture();
    const rpc = rpcMock();
    const first = await preparePayment(req, payer.publicKey, rpc);
    const second = await preparePayment(req, payer.publicKey, rpc);
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const sign = vi.fn(async (tx: Transaction) => { await gate; throw new Error('User canceled'); return tx; });
    const sending = sendPayment(first, sign, rpc).catch(error => error);
    await vi.waitFor(() => expect(sign).toHaveBeenCalledTimes(1));
    await expect(sendPayment(second, sign, rpc)).rejects.toThrow(/in progress/i);
    release();
    expect(await sending).toBeInstanceOf(WalletSigningError);
    expect((await sending).message).toContain('User canceled');
    expect(rpc.sendRawTransaction).not.toHaveBeenCalled();
  });
  it('reports a mobile wallet transaction rejection without claiming the payer declined', async () => {
    const { payer, req } = fixture();
    const rpc = rpcMock();
    const prepared = await preparePayment(req, payer.publicKey, rpc);
    const adapterError = new Error('Transaction rejected') as Error & { error?: { code: number } };
    adapterError.error = { code: -32003 };
    const failure = await sendPayment(prepared, async () => { throw adapterError; }, rpc).catch(error => error);
    expect(failure).toBeInstanceOf(WalletSigningError);
    expect(failure.message).toContain('-32003');
    expect(failure.message).not.toMatch(/wallet signature declined|payer declined|user declined/i);
    expect(rpc.sendRawTransaction).not.toHaveBeenCalled();
  });
  it('preserves an internal mobile wallet signing code and offers a Devnet check', async () => {
    const { payer, req } = fixture();
    const rpc = rpcMock();
    const prepared = await preparePayment(req, payer.publicKey, rpc);
    const adapterError = new Error('Something went wrong') as Error & { error?: { code: number } };
    adapterError.error = { code: -32603 };
    const failure = await sendPayment(prepared, async () => { throw adapterError; }, rpc).catch(error => error);
    expect(failure).toBeInstanceOf(WalletSigningError);
    expect(failure.message).toContain('code -32603');
    expect(failure.message).toContain('Testnet Mode and Solana Devnet');
    expect(failure.message).toContain('Something went wrong');
    expect(rpc.sendRawTransaction).not.toHaveBeenCalled();
  });
  it('distinguishes wallet code 4001 from an unclassified cancellation message', async () => {
    const { payer, req } = fixture();
    const rpc = rpcMock();
    const coded = await preparePayment(req, payer.publicKey, rpc);
    const walletRejection = new Error('Request rejected') as Error & { error?: { code: number } };
    walletRejection.error = { code: 4001 };
    const codedFailure = await sendPayment(coded, async () => { throw walletRejection; }, rpc).catch(error => error);
    expect(codedFailure.message).toContain('Wallet reported the signing request as rejected (code 4001)');
    const uncoded = await preparePayment(req, payer.publicKey, rpc);
    const uncodedFailure = await sendPayment(uncoded, async () => { throw new Error('canceled'); }, rpc).catch(error => error);
    expect(uncodedFailure.message).toContain('Wallet did not return a signed transaction');
    expect(uncodedFailure.message).not.toContain('code 4001');
    expect(rpc.sendRawTransaction).not.toHaveBeenCalled();
  });
  it('keeps a signed payment pending if RPC submission says transaction rejected', async () => {
    const { payer, req } = fixture();
    const rpc = rpcMock();
    vi.mocked(rpc.sendRawTransaction).mockRejectedValue(new Error('Transaction rejected by RPC'));
    const prepared = await preparePayment(req, payer.publicKey, rpc);
    const failure = await sendPayment(prepared, async tx => { tx.sign(payer); return tx; }, rpc).catch(error => error);
    expect(failure.name).toBe('PendingPaymentError');
    expect(failure.signature).toBeTruthy();
    await expect(preparePayment(req, payer.publicKey, rpc)).rejects.toMatchObject({ signature: failure.signature });
  });
  it('does not broadcast if the review expires while the wallet is open', async () => {
    const { payer, req } = fixture();
    const rpc = rpcMock();
    let now = 1_000_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const prepared = await preparePayment(req, payer.publicKey, rpc);
    await expect(sendPayment(prepared, async tx => {
      now += 60_001; tx.sign(payer); return tx;
    }, rpc)).rejects.toThrow(/expired while/i);
    expect(rpc.sendRawTransaction).not.toHaveBeenCalled();
  });
  it('does not treat incomplete receipt metadata as unpaid history', async () => {
    const { req, response, signature } = fixture();
    const rpc = rpcMock({ ...response, meta: null }, signature);
    await expect(findPayment(req, rpc)).rejects.toThrow(/metadata/i);
  });
  it('blocks simulation failures and exhausted reference history', async () => {
    const { payer, req, signature } = fixture();
    const rpc = rpcMock();
    vi.mocked(rpc.simulateTransaction).mockResolvedValueOnce({ value: { err: 'InsufficientFundsForRent' } } as never);
    await expect(preparePayment(req, payer.publicKey, rpc)).rejects.toThrow(/simulation failed/i);
    vi.mocked(rpc.getSignaturesForAddress).mockResolvedValue(Array.from({ length: 50 }, () => ({ signature, err: { InstructionError: [0, 'InvalidArgument'] } })) as never);
    await expect(findPayment(req, rpc)).rejects.toThrow(/more history/i);
  });
});
