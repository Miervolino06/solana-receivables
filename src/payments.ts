import { Buffer } from 'buffer/index.js';
import bs58 from 'bs58';
import {
  Connection, Keypair, LAMPORTS_PER_SOL, Message, PublicKey, SystemProgram,
  Transaction, TransactionInstruction, VersionedTransaction,
  type VersionedTransactionResponse,
} from '@solana/web3.js';

export type PaymentRequest = {
  version: 1; recipient: string; amountLamports: string; label: string;
  description: string; reference: string; createdAt: string;
};
export type PreparedPayment = {
  transaction: Transaction; request: PaymentRequest; payer: string;
  feeLamports: bigint; totalLamports: bigint; balanceLamports: bigint;
  blockhash: string; lastValidBlockHeight: number; preparedAt: number;
};
export type PaymentReceipt = {
  signature: string; request: PaymentRequest; payer: string; recipient: string;
  amountLamports: bigint; feeLamports: bigint; slot: number; blockTime: number | null;
};

export const NETWORK = 'devnet' as const;
export const RPC_URL = import.meta.env?.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
export const connection = new Connection(RPC_URL, 'confirmed');
export const DEVNET_GENESIS_HASH = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');
const MAX_SOL = 100n * BigInt(LAMPORTS_PER_SOL);
const MAX_ENCODED_LENGTH = 1024;
const MAX_PREPARED_AGE_MS = 60_000;
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const fields = ['version', 'recipient', 'amountLamports', 'label', 'description', 'reference', 'createdAt'];

type Guard = { message: Buffer; requestJson: string; payer: string; feeLamports: bigint;
  totalLamports: bigint; balanceLamports: bigint; blockhash: string;
  lastValidBlockHeight: number; preparedAt: number };
const guards = new WeakMap<PreparedPayment, Guard>();
const submitted = new WeakSet<PreparedPayment>();
const inFlightReferences = new Set<string>();
// Session-only safety net. The UI also saves pending signatures across reloads.
const submittedSignatures = new Map<string, string>();
class PaymentMismatchError extends Error {}

export class PendingPaymentError extends Error {
  constructor(message: string, public readonly signature: string) { super(message); this.name = 'PendingPaymentError'; }
}
export class FailedPaymentError extends Error {
  constructor(message: string, public readonly signature: string) { super(message); this.name = 'FailedPaymentError'; }
}

function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}
function address(input: unknown, name: string, onCurve = false): PublicKey {
  if (typeof input !== 'string' || input.length < 32 || input.length > 44) throw new Error(`${name} must be a valid Solana address.`);
  try {
    const key = new PublicKey(input);
    if (key.toBase58() !== input || (onCurve && !PublicKey.isOnCurve(key.toBytes()))) throw new Error();
    return key;
  } catch { throw new Error(`${name} must be a valid ${onCurve ? 'wallet ' : ''}Solana address.`); }
}
function signatureKey(input: string): void {
  if (typeof input !== 'string' || input.length > 88 || input.length < 64) throw new Error('Enter a valid transaction signature.');
  try { if (bs58.decode(input).length !== 64 || bs58.encode(bs58.decode(input)) !== input) throw new Error(); }
  catch { throw new Error('Enter a valid transaction signature.'); }
}
function textField(input: unknown, name: string, max: number, required: boolean): string {
  if (typeof input !== 'string' || (required && !input) || input !== input.trim() ||
      /[\u0000-\u001f\u007f]/u.test(input) || encoder.encode(input).length > max) {
    throw new Error(`${name} must be ${required ? 'nonempty and ' : ''}at most ${max} UTF-8 bytes, with no surrounding spaces or line breaks.`);
  }
  return input;
}
export function formatSol(lamports: bigint): string {
  const negative = lamports < 0n;
  const absolute = negative ? -lamports : lamports;
  const fraction = (absolute % BigInt(LAMPORTS_PER_SOL)).toString().padStart(9, '0').replace(/0+$/, '');
  return `${negative ? '-' : ''}${absolute / BigInt(LAMPORTS_PER_SOL)}${fraction ? `.${fraction}` : ''}`;
}
export function parseSol(amount: string): bigint {
  if (typeof amount !== 'string' || amount.length > 13 || !/^(?:0|[1-9]\d*)(?:\.\d{1,9})?$/.test(amount)) {
    throw new Error('Enter a SOL amount with up to 9 decimal places.');
  }
  const [whole, fractional = ''] = amount.split('.');
  const lamports = BigInt(whole) * BigInt(LAMPORTS_PER_SOL) + BigInt(fractional.padEnd(9, '0') || '0');
  if (lamports <= 0n || lamports > MAX_SOL) throw new Error('Amount must be greater than 0 and no more than 100 SOL.');
  return lamports;
}
function canonicalJson(request: PaymentRequest): string {
  return JSON.stringify({ version: request.version, recipient: request.recipient,
    amountLamports: request.amountLamports, label: request.label,
    description: request.description, reference: request.reference, createdAt: request.createdAt });
}
export function validateRequest(value: unknown): PaymentRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Payment request is invalid.');
  const data = value as Record<string, unknown>;
  if (Object.keys(data).sort().join(',') !== [...fields].sort().join(',') || data.version !== 1) {
    throw new Error('Payment request has unknown or missing fields.');
  }
  const recipient = address(data.recipient, 'Recipient', true).toBase58();
  const reference = address(data.reference, 'Reference').toBase58();
  if (recipient === reference) throw new Error('Reference must differ from the recipient.');
  if (typeof data.amountLamports !== 'string' || data.amountLamports.length > 12 || !/^[1-9]\d*$/.test(data.amountLamports) ||
      BigInt(data.amountLamports) > MAX_SOL) throw new Error('Request amount is invalid.');
  const label = textField(data.label, 'Payee name', 40, true);
  const description = textField(data.description, 'Description', 120, false);
  if (typeof data.createdAt !== 'string' || data.createdAt.length !== 24 ||
      Number.isNaN(Date.parse(data.createdAt)) || new Date(data.createdAt).toISOString() !== data.createdAt) {
    throw new Error('Request creation date is invalid.');
  }
  return { version: 1, recipient, amountLamports: data.amountLamports, label,
    description, reference, createdAt: data.createdAt };
}
export function createRequest(input: { recipient: string; amount: string; label: string; description: string }): PaymentRequest {
  return validateRequest({ version: 1, recipient: input.recipient,
    amountLamports: parseSol(input.amount).toString(), label: input.label,
    description: input.description, reference: Keypair.generate().publicKey.toBase58(),
    createdAt: new Date().toISOString() });
}
export function encodeRequest(request: PaymentRequest): string {
  const encoded = Buffer.from(encoder.encode(canonicalJson(validateRequest(request)))).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  if (encoded.length > MAX_ENCODED_LENGTH) throw new Error('Payment request is too large to share.');
  return encoded;
}
export function decodeRequest(encoded: string): PaymentRequest {
  if (typeof encoded !== 'string' || encoded.length === 0 || encoded.length > MAX_ENCODED_LENGTH ||
      !/^[A-Za-z0-9_-]+$/.test(encoded)) throw new Error('Payment link is invalid or too large.');
  try {
    const bytes = Buffer.from(encoded.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const roundtrip = bytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    if (roundtrip !== encoded) throw new Error();
    const value: unknown = JSON.parse(decoder.decode(bytes));
    const request = validateRequest(value);
    if (canonicalJson(request) !== decoder.decode(bytes)) throw new Error();
    return request;
  } catch { throw new Error('Payment link has invalid or noncanonical request data.'); }
}
function urlBase(base?: string): URL {
  const actual = base ?? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  const url = new URL(actual);
  if (!['https:', 'http:'].includes(url.protocol)) throw new Error('Share URL must use HTTP or HTTPS.');
  url.hash = '';
  url.search = '';
  return url;
}
export function requestUrl(request: PaymentRequest, base?: string): string {
  const url = urlBase(base); url.searchParams.set('r', encodeRequest(request)); return url.toString();
}
export function receiptUrl(request: PaymentRequest, signature: string, base?: string): string {
  signatureKey(signature); const url = urlBase(base); url.searchParams.set('r', encodeRequest(request));
  url.searchParams.set('tx', signature); return url.toString();
}
export function shortAddress(value: string): string { return value.length > 12 ? `${value.slice(0, 5)}…${value.slice(-5)}` : value; }
export function explorerUrl(signature: string): string { signatureKey(signature); return `https://explorer.solana.com/tx/${encodeURIComponent(signature)}?cluster=devnet`; }

async function assertDevnet(rpc: Connection): Promise<void> {
  if (await rpc.getGenesisHash() !== DEVNET_GENESIS_HASH) throw new Error('RPC is connected to another network. Choose a Solana Devnet endpoint.');
}
function paymentInstructions(request: PaymentRequest, payer: PublicKey): TransactionInstruction[] {
  const recipient = new PublicKey(request.recipient);
  const reference = new PublicKey(request.reference);
  const transfer = SystemProgram.transfer({ fromPubkey: payer, toPubkey: recipient,
    lamports: BigInt(request.amountLamports) });
  transfer.keys.push({ pubkey: reference, isSigner: false, isWritable: false });
  return [transfer, new TransactionInstruction({ programId: MEMO_PROGRAM_ID,
    keys: [{ pubkey: payer, isSigner: true, isWritable: false }],
    // web3 types its byte payload as Node Buffer; this is the identical byte
    // interface from the browser polyfill (new Node-only methods are unused).
    data: Buffer.from(encoder.encode(canonicalJson(request))) as unknown as TransactionInstruction['data'] })];
}
export function buildPaymentTransaction(request: PaymentRequest, payer: PublicKey, blockhash: string): Transaction {
  const valid = validateRequest(request);
  if (!PublicKey.isOnCurve(payer.toBytes())) throw new Error('Payer must be a wallet address.');
  if (payer.toBase58() === valid.recipient) throw new Error('You cannot pay your own wallet.');
  if (payer.toBase58() === valid.reference) throw new Error('Payer cannot be the request reference.');
  address(blockhash, 'Blockhash');
  return new Transaction({ feePayer: payer, recentBlockhash: blockhash }).add(...paymentInstructions(valid, payer));
}

/** Pure chain proof, also used by offline tests. */
export function verifyPaymentTransaction(signature: string, request: PaymentRequest, response: VersionedTransactionResponse): PaymentReceipt {
  signatureKey(signature);
  const valid = validateRequest(request);
  if (response.version !== undefined && response.version !== 'legacy') throw new Error('Payment must use a legacy transaction.');
  if (!response.meta) throw new Error('Transaction metadata is unavailable.');
  if (response.meta.err) throw new FailedPaymentError('Transaction failed on Devnet.', signature);
  const meta = response.meta;
  if (!Number.isSafeInteger(response.slot) || response.slot < 0 ||
      (response.blockTime != null && (!Number.isSafeInteger(response.blockTime) || response.blockTime < 0)) ||
      !Number.isSafeInteger(meta.fee) || meta.fee < 0) throw new Error('Receipt metadata is invalid.');
  const message = response.transaction.message as Message;
  if (!message || !Array.isArray(message.accountKeys) || message.instructions?.length !== 2 ||
      message.header?.numRequiredSignatures !== 1) throw new Error('Payment instruction structure is invalid.');
  const payer = message.accountKeys[0];
  if (!payer || !PublicKey.isOnCurve(payer.toBytes()) || payer.toBase58() === valid.recipient) throw new Error('Invalid payer or self-payment.');
  const expected = buildPaymentTransaction(valid, payer, message.recentBlockhash).compileMessage();
  const signatures = response.transaction.signatures;
  if (signatures.length !== 1 || signatures[0] !== signature ||
      !Transaction.populate(message, signatures).verifySignatures()) throw new Error('Payment signature is invalid.');
  if (!equalBytes(message.serialize(), expected.serialize())) throw new PaymentMismatchError('Payment instructions, recipient, amount, reference or Memo do not match this request.');
  const payerIndex = message.accountKeys.findIndex(key => key.equals(payer));
  const recipientIndex = message.accountKeys.findIndex(key => key.toBase58() === valid.recipient);
  const referenceIndex = message.accountKeys.findIndex(key => key.toBase58() === valid.reference);
  const amount = BigInt(valid.amountLamports);
  const pre = meta.preBalances; const post = meta.postBalances;
  if (!Array.isArray(pre) || !Array.isArray(post) || pre.length !== message.accountKeys.length || post.length !== pre.length ||
      recipientIndex < 0 || referenceIndex < 0 || payerIndex !== 0 ||
      !pre.every(Number.isSafeInteger) || !post.every(Number.isSafeInteger) ||
      pre.some(balance => balance < 0) || post.some(balance => balance < 0)) throw new Error('Payment balance evidence is invalid.');
  if (BigInt(pre[payerIndex]) - BigInt(post[payerIndex]) !== amount + BigInt(meta.fee) ||
      BigInt(post[recipientIndex]) - BigInt(pre[recipientIndex]) !== amount ||
      pre.some((balance, index) => index !== payerIndex && index !== recipientIndex && post[index] !== balance)) {
    throw new Error('Payment balance changes do not prove the requested transfer.');
  }
  return { signature, request: valid, payer: payer.toBase58(), recipient: valid.recipient,
    amountLamports: amount, feeLamports: BigInt(meta.fee), slot: response.slot,
    blockTime: response.blockTime ?? null };
}

export async function fetchPaymentReceipt(signature: string, request: PaymentRequest, rpc: Connection = connection): Promise<PaymentReceipt> {
  signatureKey(signature); const valid = validateRequest(request); await assertDevnet(rpc);
  const response = await rpc.getTransaction(signature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
  if (!response) throw new PendingPaymentError('Transaction is not yet available. Check this signature before retrying.', signature);
  return verifyPaymentTransaction(signature, valid, response);
}
export async function findPayment(request: PaymentRequest, rpc: Connection = connection): Promise<PaymentReceipt | null> {
  const valid = validateRequest(request); await assertDevnet(rpc);
  const submittedSignature = submittedSignatures.get(valid.reference);
  if (submittedSignature) {
    try { return await fetchPaymentReceipt(submittedSignature, valid, rpc); }
    catch (error) {
      if (!(error instanceof FailedPaymentError)) throw error;
      submittedSignatures.delete(valid.reference);
    }
  }
  const entries = await rpc.getSignaturesForAddress(new PublicKey(valid.reference), { limit: 50 }, 'confirmed');
  let pending: string | null = null;
  for (const entry of entries) {
    if (entry.err) continue;
    const response = await rpc.getTransaction(entry.signature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
    if (!response) { pending = entry.signature; continue; }
    try { return verifyPaymentTransaction(entry.signature, valid, response); }
    catch (error) {
      if (error instanceof FailedPaymentError || error instanceof PaymentMismatchError) continue;
      // Missing/corrupt proof data is not evidence that this request is unpaid.
      throw error;
    }
  }
  if (pending) throw new PendingPaymentError('A transaction using this reference is still pending. Check its signature before paying again.', pending);
  if (entries.length === 50) throw new Error('This reference has more history than can be verified safely. Use a fresh request or inspect it in Explorer.');
  return null;
}
export async function preparePayment(request: PaymentRequest, payer: PublicKey, rpc: Connection = connection): Promise<PreparedPayment> {
  const valid = validateRequest(request);
  if (payer.toBase58() === valid.recipient) throw new Error('You cannot pay your own wallet.');
  await assertDevnet(rpc);
  if (await findPayment(valid, rpc)) throw new Error('This request already has a verified payment. Check its receipt before paying again.');
  const [recipientAccount, balance, latest] = await Promise.all([
    rpc.getAccountInfo(new PublicKey(valid.recipient), 'confirmed'),
    rpc.getBalance(payer, 'confirmed'), rpc.getLatestBlockhash('confirmed'),
  ]);
  if (recipientAccount && !recipientAccount.owner.equals(SystemProgram.programId)) {
    throw new Error('Recipient wallet is owned by another program. Ask for a system wallet address.');
  }
  if (!Number.isSafeInteger(balance) || balance < 0) throw new Error('Wallet balance is unavailable. Prepare again.');
  const transaction = buildPaymentTransaction(valid, payer, latest.blockhash);
  const fee = await rpc.getFeeForMessage(transaction.compileMessage(), 'confirmed');
  if (fee.value === null || !Number.isSafeInteger(fee.value) || fee.value < 0) throw new Error('Network fee is unavailable. Prepare again.');
  const feeLamports = BigInt(fee.value);
  const totalLamports = BigInt(valid.amountLamports) + feeLamports;
  if (BigInt(balance) < totalLamports) throw new Error(`Insufficient Devnet balance: ${formatSol(totalLamports)} SOL needed; wallet has ${formatSol(BigInt(balance))} SOL.`);
  const simulation = await rpc.simulateTransaction(new VersionedTransaction(transaction.compileMessage()),
    { sigVerify: false, replaceRecentBlockhash: false, commitment: 'confirmed' });
  if (simulation.value.err) throw new Error(`Devnet simulation failed: ${JSON.stringify(simulation.value.err)}.`);
  const prepared: PreparedPayment = { transaction, request: valid, payer: payer.toBase58(),
    feeLamports, totalLamports, balanceLamports: BigInt(balance), blockhash: latest.blockhash,
    lastValidBlockHeight: latest.lastValidBlockHeight, preparedAt: Date.now() };
  guards.set(prepared, { message: Buffer.from(transaction.serializeMessage()), requestJson: canonicalJson(valid),
    payer: prepared.payer, feeLamports, totalLamports, balanceLamports: prepared.balanceLamports,
    blockhash: prepared.blockhash, lastValidBlockHeight: prepared.lastValidBlockHeight,
    preparedAt: prepared.preparedAt });
  return prepared;
}
/** onSubmitted is a synchronous persistence barrier: throwing prevents broadcast. */
export async function sendPayment(prepared: PreparedPayment, signTransaction: (tx: Transaction) => Promise<Transaction>, rpc: Connection = connection, onSubmitted?: (signature: string) => void): Promise<PaymentReceipt> {
  const reference = validateRequest(prepared.request).reference;
  if (inFlightReferences.has(reference)) throw new Error('This request already has a payment in progress. Wait for its result.');
  inFlightReferences.add(reference);
  try { return await sendPreparedPayment(prepared, signTransaction, rpc, onSubmitted); }
  finally { inFlightReferences.delete(reference); }
}

async function sendPreparedPayment(prepared: PreparedPayment, signTransaction: (tx: Transaction) => Promise<Transaction>, rpc: Connection, onSubmitted?: (signature: string) => void): Promise<PaymentReceipt> {
  await assertDevnet(rpc);
  const guard = guards.get(prepared);
  if (!guard || submitted.has(prepared) || !equalBytes(guard.message, prepared.transaction.serializeMessage()) ||
      guard.requestJson !== canonicalJson(validateRequest(prepared.request)) || guard.payer !== prepared.payer ||
      guard.feeLamports !== prepared.feeLamports || guard.totalLamports !== prepared.totalLamports ||
      guard.balanceLamports !== prepared.balanceLamports || guard.blockhash !== prepared.blockhash ||
      guard.lastValidBlockHeight !== prepared.lastValidBlockHeight || guard.preparedAt !== prepared.preparedAt ||
      prepared.totalLamports !== BigInt(prepared.request.amountLamports) + prepared.feeLamports ||
      prepared.balanceLamports < prepared.totalLamports) throw new Error('Prepared payment changed or was already submitted. Review and prepare again.');
  if (Date.now() - guard.preparedAt > MAX_PREPARED_AGE_MS) throw new Error('Payment review expired. Prepare again.');
  if (await rpc.getBlockHeight('confirmed') > guard.lastValidBlockHeight) throw new Error('Blockhash expired. Prepare again.');
  const expected = buildPaymentTransaction(prepared.request, new PublicKey(guard.payer), guard.blockhash).serializeMessage();
  if (!equalBytes(expected, guard.message)) throw new Error('Prepared transaction changed. Prepare again.');
  if (await findPayment(prepared.request, rpc)) throw new Error('This request already has a verified payment. Check its receipt before paying again.');
  const signed = await signTransaction(prepared.transaction);
  if (!equalBytes(signed.serializeMessage(), guard.message)) throw new Error('Wallet changed the transaction. Request canceled.');
  if (!signed.verifySignatures()) throw new Error('Wallet signature is missing or invalid.');
  if (Date.now() - guard.preparedAt > MAX_PREPARED_AGE_MS) throw new Error('Payment review expired while the wallet was open. Prepare again.');
  if (await rpc.getBlockHeight('confirmed') > guard.lastValidBlockHeight) throw new Error('Blockhash expired while the wallet was open. Prepare again.');
  // Use the immutable request snapshot even if UI state changes while awaiting the wallet.
  const request = validateRequest(JSON.parse(guard.requestJson));
  if (await findPayment(request, rpc)) throw new Error('This request already has a verified payment. Check its receipt before paying again.');
  const payerSignature = signed.signatures.find(item => item.publicKey.toBase58() === guard.payer)?.signature;
  if (!payerSignature) throw new Error('Wallet signature is missing.');
  const knownSignature = bs58.encode(payerSignature);
  if (!equalBytes(signed.serializeMessage(), guard.message)) throw new Error('Wallet changed the transaction. Request canceled.');
  const raw = signed.serialize();
  // Persist the exact signed transaction identity before any network submission.
  // A storage failure leaves this preparation retryable and releases the send lock.
  onSubmitted?.(knownSignature);
  submitted.add(prepared);
  submittedSignatures.set(request.reference, knownSignature);
  let signature = knownSignature;
  try { signature = await rpc.sendRawTransaction(raw, { skipPreflight: false, preflightCommitment: 'confirmed' }); }
  catch { throw new PendingPaymentError('Submission is inconclusive. Check this signature before retrying.', knownSignature); }
  if (signature !== knownSignature) throw new PendingPaymentError('RPC returned another signature. Check the wallet signature before retrying.', knownSignature);
  try {
    const confirmation = await rpc.confirmTransaction({ signature, blockhash: guard.blockhash,
      lastValidBlockHeight: guard.lastValidBlockHeight }, 'confirmed');
    if (confirmation.value.err) throw new FailedPaymentError('Transaction failed on Devnet.', signature);
    return await fetchPaymentReceipt(signature, request, rpc);
  } catch (error) {
    if (error instanceof FailedPaymentError) { submittedSignatures.delete(request.reference); throw error; }
    throw new PendingPaymentError('Confirmation or receipt lookup is inconclusive. Check this signature before retrying.', signature);
  }
}
