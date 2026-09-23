# Receivables

**A screenshot does not settle a payment request.** Receivables checks a confirmed SOL transfer against the exact request: recipient, amount, reference and payer-signed Memo. The payer reviews the cost and approves in their own wallet; anyone can recheck a receipt on Devnet and compare it with the transaction in Solana Explorer.

**This published version is a Devnet demonstration.** Devnet SOL is for testing and has no economic value. Mainnet commercial payments are not available here.

[Open the public website](https://solana-receivables.vercel.app/) · [Open the workspace](https://solana-receivables.vercel.app/app) · [Open the public Proof desk](https://solana-receivables.vercel.app/verify) · [Proof and recheck guide](docs/PROOF.md) · [User guide](docs/GUIDE.md)

## How it works

1. A recipient creates a request for an amount of SOL and shares its link or QR.
2. The payer opens it and reviews the recipient, amount and estimated Solana network fee in the app before opening their wallet to approve the transaction.
3. The wallet signs a native SOL transfer with a read-only reference and a Memo containing the canonical request. The app checks the confirmed transaction on Devnet and creates a receipt only when the recipient, amount, reference and Memo match, the signature verifies, and balance changes agree.
4. The workspace can recheck requests, show received/open/unverified states and export available evidence to CSV.

## Inspect a receipt

Open `/verify` and paste the **actual** receipt link (the request link plus its transaction signature). Recheck it against Devnet, save the downloadable JSON record, and open the transaction in Solana Explorer independently. For a negative check, create a different request and check it against that same signature; its request data must not match the signed Memo. A sample Devnet identity or slot is network context, not evidence that a payment occurred. See [PROOF.md](docs/PROOF.md) for the live recheck and command-line procedure.

**Evidence status:** the user reports approving the demonstration payment in Phantom. An independent read-only Devnet check at 23/09/2026 17:11:52 UTC verified its confirmed signature, exact request, 0.001 SOL transfer and 0.000005 SOL network fee in slot 503047831. [Open the public evidence JSON](public/receipt-demo-v1.json), use its `proofLink` for a fresh receipt check, or [inspect the transaction in Explorer](https://explorer.solana.com/tx/KQvP2y2F1RhyzhaU4YNNdhGkpixAUr42KTgWniqnRpnDvbcjYCci6yM4sVJH3GXrbXT1iPpz4qMTzx5iVTJFxwC?cluster=devnet). The video and actual Hackalaunch submission remain pending in [SUBMISSION.md](docs/SUBMISSION.md). This is test SOL on Devnet, not a commercial payment or proof of identity or delivery.

Creating a request does not require a wallet signature. Connecting a wallet to the workspace is a frontend access convenience; it is not cryptographic sign-in, does not request a sign-in message, and does not move funds. A payment happens only after the payer reviews and signs it in their wallet.

The workspace saves up to 40 requests in the current browser. This is not a secure multi-user account, hosted ledger or cloud sync. Payment links and their request details are public to anyone who receives the link. A shared receipt can be checked without connecting a wallet.

## Run locally

Node.js 22 and npm:

```sh
npm ci
npm run dev
npm test
npm run check:server-deps
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
| Compute Budget | `ComputeBudget111111111111111111111111111111` | Explicit compute limit and zero Devnet priority fee |

No token mint addresses, custom deployed programs, custody, escrow, spending approvals or platform fees. Recipient and reference addresses vary by request. The reference is read-only and receives no SOL. Infrastructure: Solana RPC, Solana Explorer and Vercel Functions. Actions discovery is provided by `public/actions.json`.

Before signing, the app prepares the exact transfer, estimates its network fee, simulates it and checks the payer balance. Total cost is amount plus network fee. A receipt checks success, exact recipient/amount/reference/Memo, signature and balance changes. See [CHAIN.md](docs/CHAIN.md).

The app displays the network fee estimate separately from the payment amount before opening the wallet for approval. The network fee is charged by Solana; Receivables charges no platform fee. The estimate comes from an RPC query and may differ from the final fee.

For this Devnet demo, transactions include a 400,000 compute-unit limit and a zero priority-fee price before simulation and fee review. This prevents Phantom's documented automatic priority-fee insertion from changing the message after review. The app still refuses any changed signed message. Existing two-instruction receipts remain verifiable; newly prepared transactions use the exact four-instruction format described in [CHAIN.md](docs/CHAIN.md).

## Reconcile and export

The browser stores up to 40 requests and signature hints. Reconciliation reads chain evidence serially; a stored signature never means paid by itself. Requested, verified received and checked-open totals use integer lamports. Unchecked, pending and RPC-error records remain unverified rather than being counted as received or open.

CSV includes request details, status, check time, available transaction/fee/confirmation evidence and reference. Cells are quoted and formula-leading input is neutralized for spreadsheet use. Keep payment links and signatures: local storage is not a backup, account system or cross-device database.

## Actions

`GET /api/pay?r=<encoded-request>` returns Action metadata and fee/risk disclosure. `POST` with `{"account":"<payer-wallet>"}` prepares an unsigned transaction. `OPTIONS` handles CORS. Root payment links map to this Action endpoint with their query preserved. It does not sign or submit on the user's behalf. Automatic X rendering, registry verification and compatibility with every external Blink client are not claimed.

## Limits

Security controls, private vulnerability reporting, deployment configuration and trust boundaries are documented in [SECURITY.md](SECURITY.md).

All request fields are public in the link and paid Memo. The payee label is self-declared; payment proves a transfer, not identity or delivery. This is not a fiscal invoice. Request creation time is not chain confirmation time.

Devnet SOL has no economic value and Devnet can reset. Native transfers are irreversible; failed on-chain transactions may incur fees. Duplicate checks and persistent pending hints reduce accidental retries, but concurrent payments across devices can still both succeed.

## Provenance and shipping status

The earlier BEFORE prototype is separate. Its application/wallet scaffolding was reused during this hackathon according to the user chronology; payment, reconciliation and Actions work belongs to this pivot. The UI follows the user's own Órbita CRM (fdz-crm, origin/master `3fdef60`) as a visual reference: Manrope, Geist Mono, graphite surfaces and sapphire accents. The public website explains the flow with a draggable, explicitly illustrative payment stack; the workspace defaults to dark and retains an optional saved light preference. No CRM source, assets or business data were copied. No organizer opening date is invented.

Source: [GitHub](https://github.com/Miervolino06/solana-receivables). Production and live read-only Action smoke checks passed on 23/09/2026; the later demonstration transfer has a verified Devnet receipt. The demo video and submission confirmation remain pending. Track these in [VERIFICATION.md](docs/VERIFICATION.md) and [SUBMISSION.md](docs/SUBMISSION.md).

Code retains its MIT license. The UI fonts, Manrope and Geist Mono, use OFL-1.1. React is MIT and Lucide is ISC. Retain upstream notices.
