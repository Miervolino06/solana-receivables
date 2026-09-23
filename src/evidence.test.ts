import { describe, expect, it } from 'vitest';
import { Keypair } from '@solana/web3.js';
import { createEvidenceReport } from './evidence';
import { createRequest, decodeRequest, type PaymentReceipt } from './payments';

function receipt(): PaymentReceipt {
  const request = createRequest({ recipient: Keypair.generate().publicKey.toBase58(),
    amount: '100', label: 'Studio', description: 'Prototype delivery' });
  return {
    signature: '1'.repeat(64), request, payer: Keypair.generate().publicKey.toBase58(),
    recipient: request.recipient, amountLamports: 100_000_000_000n,
    feeLamports: 9_007_199_254_740_993n, slot: 42, blockTime: 1_700_000_000,
  };
}

describe('receipt evidence export', () => {
  it('serializes lamports losslessly and derives both links from the explicit page URL', () => {
    const paid = receipt();
    const report = createEvidenceReport(paid, 'https://example.test/pay/', '2026-09-23T12:00:00.000Z');
    const json = JSON.parse(JSON.stringify(report)) as typeof report;
    expect(json).toMatchObject({ schemaVersion: 1, network: 'devnet',
      checkedAt: '2026-09-23T12:00:00.000Z', amountLamports: '100000000000',
      feeLamports: '9007199254740993', actualRecipient: paid.recipient,
      blockTimeIso: '2023-11-14T22:13:20.000Z' });
    const requestLink = new URL(json.requestLink);
    const proofLink = new URL(json.proofLink);
    expect(requestLink.origin).toBe('https://example.test');
    expect(requestLink.pathname).toBe('/pay/');
    expect(requestLink.searchParams.has('tx')).toBe(false);
    expect(decodeRequest(requestLink.searchParams.get('r')!)).toEqual(paid.request);
    expect(proofLink.searchParams.get('tx')).toBe(paid.signature);
    expect(decodeRequest(proofLink.searchParams.get('r')!)).toEqual(paid.request);
    expect(JSON.stringify(json)).not.toContain('rpc');
  });

  it('rejects inconsistent receipts, invalid check time, and query-bearing page URLs', () => {
    const paid = receipt();
    expect(() => createEvidenceReport({ ...paid, amountLamports: 1n }, 'https://example.test')).toThrow(/does not match/i);
    expect(() => createEvidenceReport(paid, 'https://example.test', 'yesterday')).toThrow(/check time/i);
    expect(() => createEvidenceReport(paid, 'https://example.test/?key=secret')).toThrow(/clean/i);
  });
});
