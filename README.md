# Receivables

SOL payment links, a local request workspace, and receipts verified against the exact on-chain payment. Create a request without signing, share its link or QR, then reconcile requests against Solana Devnet and export the results.

## Run

Node.js 22 and npm:

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Vite includes working local Action middleware for `/api/pay`. On Vercel, `api/pay.ts` runs as a serverless function. Static preview serves the frontend, not that production function.

Use a standard Solana wallet on Devnet and two distinct payer/recipient wallets. Test SOL is available from the [Solana faucet](https://faucet.solana.com/), subject to availability. No wallet seed or private key is requested.

## Configuration

`.env.example` contains the public frontend RPC setting. `VITE_SOLANA_RPC_URL` defaults to `https://api.devnet.solana.com`. All `VITE_` variables are public in the bundle; never put credentials there.

The Action uses server-side `SOLANA_RPC_URL` and `SITE_ORIGIN`. Configure the actual deployed origin for icon and Action links; Vercel URL variables supply a fallback. Default hostnames in source are not proof of deployment. Both RPC endpoints must be Devnet.

## Network and on-chain footprint

| Program | Address | Purpose |
| --- | --- | --- |
| System Program | `11111111111111111111111111111111` | Native SOL transfer |
| Memo v3 | `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr` | Payer-signed canonical request |

No token mint addresses, custom deployed programs, custody, escrow, spending approvals or platform fees. Recipient and reference addresses vary by request. The reference is read-only and receives no SOL. Infrastructure: Solana RPC, Solana Explorer and Vercel Functions. Actions discovery is provided by `public/actions.json`.

Before signing, the app prepares the exact transfer, estimates its network fee, simulates it and checks the payer balance. Total cost is amount plus network fee. A receipt checks success, exact recipient/amount/reference/Memo, signature and balance changes. See [CHAIN.md](docs/CHAIN.md).

## Reconcile and export

The browser stores up to 40 requests and signature hints. Reconciliation reads chain evidence serially; a stored signature never means paid by itself. Requested, verified received and checked-open totals use integer lamports. Unchecked, pending and RPC-error records remain unverified rather than being counted as received or open.

CSV includes request details, status, check time, available transaction/fee/confirmation evidence and reference. Cells are quoted and formula-leading input is neutralized for spreadsheet use. Keep payment links and signatures: local storage is not a backup, account system or cross-device database.

## Actions

`GET /api/pay?r=<encoded-request>` returns Action metadata and fee/risk disclosure. `POST` with `{"account":"<payer-wallet>"}` prepares an unsigned transaction. `OPTIONS` handles CORS. Root payment links map to this Action endpoint with their query preserved. It does not sign or submit on the user's behalf. Automatic X rendering, registry verification and compatibility with every external Blink client are not claimed.

## Limits

All request fields are public in the link and paid Memo. The payee label is self-declared; payment proves a transfer, not identity or delivery. This is not a fiscal invoice. Request creation time is not chain confirmation time.

Devnet SOL has no economic value and Devnet can reset. Native transfers are irreversible; failed on-chain transactions may incur fees. Duplicate checks and persistent pending hints reduce accidental retries, but concurrent payments across devices can still both succeed.

## Provenance and shipping status

The earlier BEFORE prototype is separate. Its application/wallet scaffolding was reused during this hackathon according to the user chronology; payment, reconciliation and Actions work belongs to this pivot. The UI follows the user's own Órbita CRM (fdz-crm, origin/master `3fdef60`) as a visual reference: Manrope, Geist Mono, light surfaces and sapphire accents. No CRM source, assets or business data were copied. No organizer opening date is invented.

Source: [GitHub](https://github.com/Miervolino06/solana-receivables). FALTA: verified production deployment, real-wallet payment evidence and demo video. Track these in [VERIFICATION.md](docs/VERIFICATION.md) and [SUBMISSION.md](docs/SUBMISSION.md).

Code retains its MIT license. The UI fonts, Manrope and Geist Mono, use OFL-1.1. React is MIT and Lucide is ISC. Retain upstream notices.
