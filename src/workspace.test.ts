import { describe, expect, it, vi } from 'vitest';
import { Keypair } from '@solana/web3.js';
import { createRequest, encodeRequest, type PaymentReceipt } from './payments';
import { readWorkspace, reconcileRequests, saveWorkspace, summarizeWorkspace, workspaceCsv, type WorkspaceEntry } from './workspace';

const request = createRequest({ recipient: Keypair.generate().publicKey.toBase58(), label: '=IMPORTXML("bad")', amount: '0.000000001', description: 'A "quoted", description' });
const entry: WorkspaceEntry = { encoded: encodeRequest(request) };
const receipt: PaymentReceipt = { request, signature: '3'.repeat(88), payer: Keypair.generate().publicKey.toBase58(), recipient: request.recipient, amountLamports: 1n, feeLamports: 5000n, slot: 123, blockTime: 1700000000 };

describe('local reconciliation workspace', () => {
  it('treats storage signatures as hints and rejects corrupt records', () => {
    const storage = { getItem: () => JSON.stringify([{ ...entry, pendingSignature: receipt.signature }, entry, { encoded: 'bad' }]), setItem: vi.fn() };
    const loaded = readWorkspace(storage);
    expect(loaded.items).toEqual([{ ...entry, pendingSignature: receipt.signature }]);
    expect(loaded.error).not.toBe('');
    expect(summarizeWorkspace(loaded.items, {})).toEqual({ requested: 1n, received: 0n, open: 0n, unverified: 1, count: 1 });
  });
  it('does not label an RPC failure unpaid and checks pending signatures first', async () => {
    const find = vi.fn().mockResolvedValue(null), fetch = vi.fn().mockRejectedValue(Error('RPC unavailable')), onResult = vi.fn();
    await reconcileRequests([{ ...entry, pendingSignature: receipt.signature }], onResult, { find, fetch });
    expect(find).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith(receipt.signature, request);
    expect(onResult.mock.calls[0][0]).toMatchObject({ status: 'pending', error: 'RPC unavailable' });
  });
  it('reconciles verified receipts with exact lamport totals and supports abort', async () => {
    const results: any[] = [], find = vi.fn().mockResolvedValue(receipt);
    await reconcileRequests([entry], value => results.push(value), { find });
    expect(summarizeWorkspace([entry], { [entry.encoded]: results[0] }).received).toBe(1n);
    const controller = new AbortController(); controller.abort();
    await reconcileRequests([entry], vi.fn(), { signal: controller.signal, find });
    expect(find).toHaveBeenCalledTimes(1);
  });
  it('exports exact amounts and neutralizes spreadsheet formulas', () => {
    const csv = workspaceCsv([entry], {});
    expect(csv).toContain('"\'=IMPORTXML(""bad"")"');
    expect(csv).toContain('"0.000000001"');
    expect(csv).toContain('"Not verified"');
    expect(csv).toContain('A ""quoted"", description');
  });
  it('returns a useful storage error instead of losing a signature silently', () => {
    expect(saveWorkspace([entry], { getItem: () => null, setItem: () => { throw Error('quota'); } })).toContain('submitted signature');
  });
});
