import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  buildPaymentTransaction, decodeRequest, encodeRequest, findPayment,
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

export function createActionHandler(rpc = new Connection(RPC, 'confirmed'), origin = ORIGIN) {
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
    try {
      if (await rpc.getGenesisHash() !== DEVNET) throw new Error('This endpoint must use Solana Devnet.');
      if (req.method === 'GET') {
        const alreadyPaid = await findPayment(request, rpc);
        // Fee estimation needs a signer count, not a funded or signing account.
        const previewPayer = Keypair.generate().publicKey;
        const { blockhash } = await rpc.getLatestBlockhash('confirmed');
        const transaction = buildPaymentTransaction(request, previewPayer, blockhash);
        const quote = await rpc.getFeeForMessage(transaction.compileMessage(), 'confirmed');
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
      let body: unknown = req.body;
      if (typeof body === 'string') {
        if (body.length > 4096) throw new Error('Payment request body is too large.');
        body = JSON.parse(body);
      }
      if (!body || typeof body !== 'object' || !('account' in body) || typeof body.account !== 'string') {
        res.status(400).json({ message: 'A payer wallet account is required.' }); return;
      }
      let payer: PublicKey;
      try { payer = new PublicKey(body.account); } catch { res.status(400).json({ message: 'Invalid payer wallet address.' }); return; }
      if (!PublicKey.isOnCurve(payer.toBytes())) { res.status(400).json({ message: 'Payer must be a wallet address.' }); return; }
      const prepared = await preparePayment(request, payer, rpc);
      res.status(200).json({
        type: 'transaction',
        transaction: prepared.transaction.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64'),
        message: disclosure(request, prepared.feeLamports),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'The Devnet payment could not be prepared. Open the request and retry.';
      res.status(400).json({ message });
    }
  };
}

export default createActionHandler();
