import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  PaymentHistoryLimitError, buildPaymentTransaction, decodeRequest, encodeRequest, findPayment,
  formatSol, preparePayment, type PaymentRequest,
} from '../src/payments.js';

type Request = { method?: string; url?: string; body?: unknown };
type Response = {
  setHeader(name: string, value: string): void;
  status(code: number): Response;
  json(value: unknown): void;
  end(): void;
};

const DEVNET = 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG';
const ORIGIN = process.env.SITE_ORIGIN || `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || 'solana-receivables.vercel.app'}`;
const RPC = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const ACTION_HISTORY_LIMIT = 10;
const ACTION_CONCURRENCY_LIMIT = 4;
const ACTION_RATE_LIMIT = 30;
const ACTION_RATE_WINDOW_MS = 60_000;
const ACTION_RPC_DEADLINE_MS = 15_000;
export const ACTION_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Content-Encoding, Accept-Encoding',
  'Access-Control-Expose-Headers': 'X-Blockchain-Ids, X-Action-Version',
  'X-Blockchain-Ids': `solana:${DEVNET.slice(0, 32)}`,
  'X-Action-Version': '2.4',
  'Cache-Control': 'no-store',
};

export function disclosure(request: PaymentRequest, fee: bigint): string {
  return `DEVNET ONLY. Send ${formatSol(BigInt(request.amountLamports))} SOL to ${request.recipient}. `
    + `Network fee: ${formatSol(fee)} SOL; total: ${formatSol(BigInt(request.amountLamports) + fee)} SOL. `
    + `Platform fee: 0 SOL. You receive a verifiable payment record, not a token or guarantee of delivery. `
    + `Payee label is self-declared. Payment details are public in a Memo. Transfers cannot be reversed; `
    + `a failed onchain transaction may still charge a fee. Concurrent payments may duplicate this request. `
    + `Devnet SOL has no monetary value and Devnet can reset.`;
}

export function createActionHandler(rpc?: Connection, origin = ORIGIN) {
  // These limits protect one warm function instance; they are not a distributed rate limit.
  let active = 0;
  let windowStart = Date.now();
  let callsInWindow = 0;
  return async function handler(req: Request, res: Response) {
    for (const [name, value] of Object.entries(ACTION_HEADERS)) res.setHeader(name, value);
    if (req.method === 'OPTIONS') { res.status(204).end(); return; }
    if (req.method !== 'GET' && req.method !== 'POST') {
      res.setHeader('Allow', 'GET,POST,OPTIONS');
      res.status(405).json({ message: 'Use GET to review or POST to prepare a Devnet payment.' }); return;
    }
    let request: PaymentRequest;
    try {
      const url = new URL(req.url || '/', origin);
      const encoded = url.searchParams.get('r');
      if (!encoded || url.searchParams.getAll('r').length !== 1) throw new Error('A single payment request is required.');
      request = decodeRequest(encoded);
    } catch {
      res.status(400).json({ message: 'This payment link is incomplete or invalid. Ask the recipient for a new request link.' }); return;
    }
    let payer: PublicKey | null = null;
    if (req.method === 'POST') {
      let body: unknown = req.body;
      try {
        if (typeof body === 'string') {
          if (body.length > 512) throw new Error();
          body = JSON.parse(body);
        }
        if (!body || typeof body !== 'object' || Array.isArray(body) ||
            !Object.hasOwn(body, 'account') ||
            typeof (body as { account: unknown }).account !== 'string') throw new Error();
        const keys = Object.keys(body);
        if (keys.some(key => key !== 'account' && key !== 'data') ||
            (Object.hasOwn(body, 'data') &&
              (!(body as { data: unknown }).data || typeof (body as { data: unknown }).data !== 'object' ||
                Array.isArray((body as { data: unknown }).data) ||
                Object.keys((body as { data: object }).data).length !== 0))) throw new Error();
        const account = (body as { account: string }).account;
        if (account.length < 32 || account.length > 44) throw new Error();
        payer = new PublicKey(account);
        if (payer.toBase58() !== account || !PublicKey.isOnCurve(payer.toBytes())) throw new Error();
      } catch {
        res.status(400).json({ message: 'A valid payer wallet account is required.' }); return;
      }
    }
    const now = Date.now();
    if (now - windowStart >= ACTION_RATE_WINDOW_MS) { windowStart = now; callsInWindow = 0; }
    if (callsInWindow >= ACTION_RATE_LIMIT) {
      res.setHeader('Retry-After', '60');
      res.status(429).json({ message: 'Too many payment reviews. Try again shortly.' }); return;
    }
    if (active >= ACTION_CONCURRENCY_LIMIT) {
      res.status(503).json({ message: 'Payment review is busy. Try again shortly.' }); return;
    }
    callsInWindow++;
    active++;
    // One deadline covers all RPC calls for this Action, including history scans.
    const controller = new AbortController();
    const deadline = setTimeout(() => controller.abort(), ACTION_RPC_DEADLINE_MS);
    try {
      const requestRpc = rpc ?? new Connection(RPC, {
        commitment: 'confirmed', disableRetryOnRateLimit: true,
        fetch: (input, init) => fetch(input, { ...init, signal: controller.signal }),
      });
      if (await requestRpc.getGenesisHash() !== DEVNET) {
        res.status(400).json({ message: 'This endpoint must use Solana Devnet.' }); return;
      }
      if (req.method === 'GET') {
        const alreadyPaid = await findPayment(request, requestRpc, { maxSignatures: ACTION_HISTORY_LIMIT });
        // Fee estimation needs a signer count, not a funded or signing account.
        const previewPayer = Keypair.generate().publicKey;
        const { blockhash } = await requestRpc.getLatestBlockhash('confirmed');
        const transaction = buildPaymentTransaction(request, previewPayer, blockhash);
        const quote = await requestRpc.getFeeForMessage(transaction.compileMessage(), 'confirmed');
        if (quote.value === null) throw new Error('Network fee is temporarily unavailable. Try again.');
        res.status(200).json({
          type: 'action', icon: `${origin}/action-icon.svg`,
          title: `${request.label}: ${formatSol(BigInt(request.amountLamports))} SOL`,
          description: `${request.description}\n\n${disclosure(request, BigInt(quote.value))}`,
          label: alreadyPaid ? 'Payment already verified' : 'Review payment in wallet',
          disabled: Boolean(alreadyPaid),
          ...(alreadyPaid ? { error: { message: 'This request already has a verified payment. Open the request to inspect its receipt.' } } : {
            links: { actions: [{ type: 'transaction', label: `Pay ${formatSol(BigInt(request.amountLamports))} SOL`, href: `/api/pay?r=${encodeRequest(request)}` }] },
          }),
        }); return;
      }
      const prepared = await preparePayment(request, payer!, requestRpc, { maxSignatures: ACTION_HISTORY_LIMIT });
      res.status(200).json({
        type: 'transaction',
        transaction: prepared.transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64'),
        message: disclosure(request, prepared.feeLamports),
      });
    } catch (error) {
      if (controller.signal.aborted) {
        res.status(504).json({ message: 'Devnet review timed out. Try again shortly.' }); return;
      }
      if (error instanceof PaymentHistoryLimitError) {
        res.status(409).json({ message: error.message }); return;
      }
      if (error instanceof Error && error.message === 'This request already has a verified payment. Check its receipt before paying again.') {
        res.status(409).json({ message: error.message }); return;
      }
      if (error instanceof Error && (error.message === 'You cannot pay your own wallet.' ||
          error.message === 'Recipient wallet is owned by another program. Ask for a system wallet address.')) {
        res.status(400).json({ message: error.message }); return;
      }
      if (error instanceof Error && error.message.startsWith('Insufficient Devnet balance:')) {
        res.status(400).json({ message: 'Insufficient Devnet balance for this payment.' }); return;
      }
      // RPC providers may include arbitrary response text in thrown errors.
      res.status(502).json({ message: 'The Devnet payment could not be prepared. Try again shortly.' });
    } finally {
      clearTimeout(deadline);
      active--;
    }
  };
}

export default createActionHandler();
