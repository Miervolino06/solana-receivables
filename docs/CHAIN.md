# Receivables: payment and proof

## Request

Canonical version-1 JSON contains `recipient`, `amountLamports`, `label`, `description`, `reference` and `createdAt`. Amount is a positive integer lamport string, at most 100 SOL. Label allows 40 UTF-8 bytes; description allows 120. Links encode this JSON as canonical base64url with a maximum encoded size of 1,024 characters.

Recipient must be an on-curve wallet address. References are random public keys; no reference signing key is stored. Unknown fields, malformed addresses/dates and noncanonical encoding are rejected. Labels are self-declared. Every field is public.

## Instructions

Exactly two legacy transaction instructions:

1. System Program transfers the requested native SOL from payer to recipient. The reference is appended as a read-only nonsigner account.
2. Memo v3 contains canonical request JSON, with payer as signer.

System Program: `11111111111111111111111111111111`. Memo v3: `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`. No mint addresses or token program calls exist.

## Preparation and signing

The client validates Devnet genesis `EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG`, checks for an existing verified payment, rejects self-payment and checks the recipient account owner when it exists. It reads balance/blockhash, obtains `getFeeForMessage`, and simulates. The payer's total is transfer amount plus network fee; there is no platform fee or dedicated account-rent deposit.

An in-memory guard binds the displayed request/cost to the prepared message. Review expires after 60 seconds or blockhash expiry. Before sending, the app checks again for a verified payment and rejects changed message bytes or invalid wallet signatures. Ambiguous submission preserves the locally derived signature for lookup, rather than claiming failure or success.

## Receipt verification

A confirmed RPC response must prove a successful legacy transaction with exactly the expected message, one valid payer signature and the exact request. Recipient balance must increase by the amount, payer balance must decrease by amount plus fee, and other balances must not change. A transaction merely mentioning the reference does not prove payment.

Reference lookup examines at most 50 recent signatures. Missing transaction data remains uncertain. A full search window without a valid payment fails closed instead of asserting that no payment exists. Direct receipt lookup binds the signature to the supplied request.

## Limits

This is not on-chain exactly-once settlement: concurrent payers can still both transfer. The client has no escrow or refund mechanism. A valid receipt proves payment, not fulfillment or identity. Confirmation time may be unavailable; request creation time is not a substitute. Devnet resets and RPC history availability can prevent later retrieval.

## Actions

`api/pay.ts` exposes GET metadata/disclosure, POST unsigned transaction preparation from the payer account, and OPTIONS CORS. It uses the same transaction builder and preparation rules. External wallet/client behavior is outside the app's control. No automatic social rendering or verified registry listing is claimed.


## Workspace reconciliation

The browser workspace stores up to 40 canonical request links, known signatures and pending-signature hints. The historical storage key remains compatible with early pivot records; it is not the product name. Reads validate records and report malformed/duplicate entries or storage errors.

Batch reconciliation checks serially against live RPC to avoid a burst of requests. Stored signatures are reverified against the request; otherwise the reference is searched. Unknown/error results never become paid or checked-open totals. Received totals require a verified receipt bound to the same canonical request; all amounts use integer lamports. The workspace is not an accounting ledger or cross-device database, and records may have different check times.

CSV distinguishes verified-this-session, no-matching-payment-found and unverified states. It includes check time, recipient, amount, reference and available signature/fee/confirmation evidence. Text is quoted, quotes are escaped, and formula-leading cells are prefixed to prevent spreadsheet interpretation as formulas.

## Local and hosted Actions

Vite development middleware is implemented for /api/pay using the same Action handler. Its local GET was checked against live Devnet and returned HTTP 200 with the actual fee. POST construction and CORS are covered by deterministic tests. Production runs the Vercel serverless function. actions.json maps the root request page and /api/pay to the Action endpoint; the encoded request query is preserved. Static preview does not provide the serverless route. No external client rendering or registry verification is implied.

Production is live at https://solana-receivables.vercel.app. Vercel reports READY for commit `46403d3`; CI passed the build, 25 tests and dependency import guard (run [35817868974](https://github.com/Miervolino06/solana-receivables/actions/runs/35817868974)). At 01:20 BRT, production smoke checks returned OPTIONS 204, GET 200 with a 0.000005 SOL network fee and 0.001005 SOL total for a 0.001 SOL request, invalid-payer POST 400, icon 200 and actions.json 200. This verifies deployment routes and validation behavior, not a funded real-payer submission or signed payment. No external client rendering or verified registry listing is claimed.
