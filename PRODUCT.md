# Receivables

## User and purpose

A freelancer, creator or small seller needs to request a SOL payment, know whether the exact request was paid, and keep evidence they can share or export. This audience is a product hypothesis, not a claim of customer validation.

## Product loop

Create request → share link/QR → payer reviews fee and risks → wallet signs → exact payment verified → workspace reconciled → receipt/CSV exported.

The core is a native SOL transfer with a reference and signed request Memo on Devnet. No mint, custody, escrow, delegated authority or platform fee.

## Workspace and proof

Up to 40 requests live in this browser. Pending signatures survive reload when storage succeeds. Every paid result is rechecked from chain; local records are hints. Batch reconciliation separates checked-open, paid, pending and error states, with integer totals and evidence-bearing CSV.

“Why this payment matches” compares the requested recipient, amount and reference with the verified transaction. A shared receipt can be checked without connecting a wallet.

## Design direction

Neutral working name: Receivables. The current visual reference is the user's own Órbita CRM (fdz-crm origin/master `3fdef60`): Manrope and Geist Mono, light surfaces, sapphire primary actions, a compact rail and floating main panel. The reference is visual only. No CRM code, assets or business data were copied. The previous LINEITEM name, icon and document-first visual direction were rejected.

Keep the payment review and proof especially clear. No fake counters, sample payments presented as real, or decorative token issuance.

## Truth boundaries

Names are self-declared, all link/Memo fields are public, receipts are not fiscal invoices or delivery guarantees. Request creation time comes from the browser; payment time uses chain evidence when available. Devnet can reset. Concurrent cross-device payment is not prevented by native transfers.

## Provenance

Payment pivot approved during this hackathon. BEFORE scaffolding was reused; payment, receipt, Actions and reconciliation are new pivot work. Earlier work is disclosed according to the user's chronology; organizer opening dates are not inferred. Before claiming completion, consult [verification](docs/VERIFICATION.md).
