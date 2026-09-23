# Submission package

Product: **Receivables**. Network: **Solana Devnet**. Package: `solana-receivables`.

Deadline recorded from the [official event page](https://www.hackalaunch.com/h/proof-of-taste): **23/09/2026, 21:28 America/Sao_Paulo**, or 24/09/2026 00:28 UTC.

- Repository: https://github.com/Miervolino06/solana-receivables
- FALTA: verified public production URL.
- FALTA: real-wallet payment signature and public verified receipt.
- FALTA: uploaded demo video, at most three minutes.

The public BEFORE prototype is historical; its URLs are not Receivables deployment evidence.

## Short description

Receivables helps creators and small teams request SOL payments and reconcile what was actually received. Share a payment link, review the exact amount and network fee before signing, then verify the transfer against the request. A local workspace checks requests against chain evidence and exports readable receipts and CSV.

## Why

A screenshot or a matching transaction reference should not be enough to mark a request paid. Receivables checks the recipient, amount, signed Memo and actual balance changes.

## Design choice

We make “paid” explainable: every verified payment can be compared with what was requested, while the signing screen states the cost and risks in plain language.

## Scope and provenance

System Program transfer plus signed Memo, on Devnet. No mint, custody, delegated authority or platform fee. Payee names are self-declared, request data is public, and these documents are not fiscal invoices. Concurrent duplicate payments remain possible.

BEFORE application/wallet scaffolding was reused. The user chronology places this work during the hackathon. Payment requests, proof verification, Actions, reconciliation and CSV belong to this pivot. The user's own Órbita CRM (fdz-crm origin/master `3fdef60`) supplied visual reference only; no source, assets or business data were copied. No organizer opening date is asserted.

## Final checks

- [ ] Public repo includes setup, program IDs, dependencies and public-only environment example.
- [ ] Production link works with a standard Solana wallet.
- [ ] Real Devnet transfer, signature and verified receipt inspected.
- [ ] Video <=3 minutes shows request, pre-sign disclosure, wallet approval and confirmation.
- [ ] Description, design sentence and provenance included.
- [ ] Team size <=4, one submission per person and actual submission confirmed.

Eligibility in principle does not imply organizer approval. See [VERIFICATION.md](VERIFICATION.md).
