# Receivables implementation contract

User approved pivot to payment requests and verifiable receipts on 23/09/2026. BEFORE remains preserved in its original worktree/deployment. User rejected the LINEITEM name, symbol and document-led design. Current neutral interface title: Receivables. Visual authority is the user's own FDZ CRM, studied read-only. English UI. Devnet only; no platform fee, custody, mint, investment, or tax invoice claims.

## Shared exports (src/payments.ts)

`PaymentRequest = { version: 1; recipient: string; amountLamports: string; label: string; description: string; reference: string; createdAt: string }`

All SOL math uses bigint lamports, serialized as decimal strings. Label is a self-declared payee display name (40 UTF-8 bytes); description 120 UTF-8 bytes. Positive amount up to 100 SOL. CreatedAt is request creation, never chain proof time. Reference is a fresh random public key (no signing key saved). Recipient must be an on-curve wallet public key. Request is untrusted; strict validate and reject excessive sizes, unknown fields, malformed reference/date/encoding.

- `createRequest({ recipient, amount, label, description }): PaymentRequest` (amount is SOL decimal input string).
- `validateRequest(value: unknown): PaymentRequest`
- `encodeRequest(request): string`, `decodeRequest(encoded: string): PaymentRequest` (base64url JSON, max encoded length enforced).
- `formatSol(lamports: bigint): string`, `parseSol(amount: string): bigint`.
- `requestUrl(request, base?: string): string` -> ?r=encoded; `receiptUrl(request, signature, base?: string): string` -> ?r=encoded&tx=signature.
- `shortAddress(address: string): string`, `explorerUrl(signature: string): string`.
- `RPC_URL`, `NETWORK`, `connection` (Devnet Connection).
- `buildPaymentTransaction(request, payer: PublicKey, blockhash: string): Transaction` pure for backend/verification.
- `preparePayment(request, payer: PublicKey, rpc?: Connection): Promise<PreparedPayment>`
- `sendPayment(prepared, signTransaction: (tx: Transaction) => Promise<Transaction>, rpc?: Connection, onSubmitted?: (signature: string) => void): Promise<PaymentReceipt>`; synchronous persistence callback runs before broadcast and may abort it.
- `fetchPaymentReceipt(signature, request, rpc?: Connection): Promise<PaymentReceipt>`
- `findPayment(request, rpc?: Connection): Promise<PaymentReceipt | null>` examines recent reference signatures, never marks pending/failed/mismatched transaction paid.
- `PendingPaymentError` and `FailedPaymentError`, both have signature:string.

`PreparedPayment = { transaction: Transaction; request: PaymentRequest; payer: string; feeLamports: bigint; totalLamports: bigint; balanceLamports: bigint; blockhash: string; lastValidBlockHeight: number; preparedAt: number }`

`PaymentReceipt = { signature: string; request: PaymentRequest; payer: string; recipient: string; amountLamports: bigint; feeLamports: bigint; slot: number; blockTime: number | null }`

Transaction: exactly native SOL transfer (with reference readonly nonsigner key) and payer-signed Memo containing canonical request. No additional approvals or authorities. User signs one transaction. Request description becomes public via Memo. Validate devnet genesis before prepare/send/read. Fee and balance from RPC, simulate before wallet, immutable disclosure/bytes guard, expire after 60sec and blockheight. Reject altered wallet transaction. Preserve ambiguous signature and block automatic duplicate retry. Receipt must validate exact message, success, signer, recipient, amount, memo/request binding and balance deltas, not merely match a reference. Reject self-payment. Detect existing verified payment before preparing; disclose duplicate risk/concurrency cannot be prevented by native transfer alone.

## Interface responsibilities

App has Create / local Requests / Verify modes. Main document is editable request; no giant marketing hero, decorative token, fake revenue/counters, or fake confirmed examples. Recipient wallet can be pasted or taken from connected wallet. Creating/copying request requires no signing. Share link and QR lead to in-app payment review, not a wallet bypass. Payer review shows exact recipient, SOL amount, live fee, total, balance, public description and irreversible/payment-not-delivery/Devnet risks. Full addresses available. Wallet address does not certify payee display name. Every confirmed receipt is reconstructed from chain. Verify accepts request link (with optional tx) and/or signature in current request. Saved requests and recent receipts are local, browser-only, with storage errors handled. Offline/RPC errors visible; no fake success.

## Direction contract

THESIS: a practical receivables workspace where confirmed blockchain evidence updates the operation.
OWN-WORLD: the user's latest CRM Órbita, origin/master 3fdef60, supersedes stale local styling: light #f5f6f8/white/#f0f2f5, sapphire #345ed3 primary, Manrope and tabular Geist Mono. 184px rail, white elevated 18px main surface, compact functional rows, selected record detail. No invented symbol or borrowed customer data. Default light/sapphire/compact; optional dark theme follows same structure.
STORY: create a request, share its payment link, reconcile against Solana, export exact records and keep verifiable proof.
FIRST VIEWPORT: navigation, useful heading and toolbar, searchable/filterable real local requests table, contextual detail; empty state guides first request without fabricated transactions or revenue.
FORM: replacement world pinned by explicit user correction to their CRM. Operate mode. Purposeful 160–220ms detail/state transitions with immediate reduced-motion alternative. Responsive navigation and detail composition. Signature review remains focused and comprehensive.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Reconciliation workspace

src/workspace.ts owns bounded validated local storage (40 requests), pending signatures across reloads, sequential RPC reconciliation, exact bigint aggregate amounts and formula-safe CSV export. Stored signatures are hints only. Paid status and received totals require a verified receipt in the current session. Network errors remain unknown/error, never unpaid. Opening a pending record must check its signature before offering another payment. Shared request metadata is public and self-declared; CRM contacts/private business data are not imported.
