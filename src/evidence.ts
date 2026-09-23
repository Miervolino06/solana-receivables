import {
  NETWORK, explorerUrl, receiptUrl, requestUrl, validateRequest,
  type PaymentReceipt, type PaymentRequest,
} from './payments';

export type EvidenceReport = {
  schemaVersion: 1;
  network: typeof NETWORK;
  checkedAt: string;
  signature: string;
  request: PaymentRequest;
  actualRecipient: string;
  amountLamports: string;
  feeLamports: string;
  payer: string;
  slot: number;
  blockTime: number | null;
  blockTimeIso: string | null;
  requestLink: string;
  proofLink: string;
  explorerLink: string;
  limitations: string[];
};

const LIMITATIONS = [
  'This report records a payment verified from Solana Devnet RPC data at the stated check time. It is not a portable cryptographic certificate.',
  'Requery Solana Devnet to confirm the transaction remains available and valid.',
  'This report does not prove the payer or recipient\'s real-world identity, delivery of goods or services, or tax treatment.',
];

/** Serialize a receipt already returned by the shared payment verifier. */
export function createEvidenceReport(
  receipt: PaymentReceipt,
  pageUrl: string,
  checkedAt: string = new Date().toISOString(),
): EvidenceReport {
  const request = validateRequest(receipt.request);
  if (receipt.recipient !== request.recipient || receipt.amountLamports !== BigInt(request.amountLamports)) {
    throw new Error('Receipt does not match its payment request.');
  }
  if (typeof receipt.feeLamports !== 'bigint' || receipt.feeLamports < 0n ||
      !Number.isSafeInteger(receipt.slot) || receipt.slot < 0 ||
      (receipt.blockTime !== null && (!Number.isSafeInteger(receipt.blockTime) || receipt.blockTime < 0))) {
    throw new Error('Receipt metadata is invalid.');
  }
  if (typeof checkedAt !== 'string' || Number.isNaN(Date.parse(checkedAt)) ||
      new Date(checkedAt).toISOString() !== checkedAt) {
    throw new Error('Check time must be an ISO 8601 UTC timestamp.');
  }
  const page = new URL(pageUrl);
  if (!['https:', 'http:'].includes(page.protocol) || page.username || page.password || page.search || page.hash) {
    throw new Error('Page URL must be a clean HTTP or HTTPS URL.');
  }
  const base = page.toString();
  const blockTimeIso = receipt.blockTime === null ? null : new Date(receipt.blockTime * 1000).toISOString();
  return {
    schemaVersion: 1,
    network: NETWORK,
    checkedAt,
    signature: receipt.signature,
    request,
    actualRecipient: receipt.recipient,
    amountLamports: receipt.amountLamports.toString(),
    feeLamports: receipt.feeLamports.toString(),
    payer: receipt.payer,
    slot: receipt.slot,
    blockTime: receipt.blockTime,
    blockTimeIso,
    requestLink: requestUrl(request, base),
    proofLink: receiptUrl(request, receipt.signature, base),
    explorerLink: explorerUrl(receipt.signature),
    limitations: [...LIMITATIONS],
  };
}
