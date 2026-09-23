# Submission copy

Product: **Receivables** · Network: **Solana Devnet** · Package: `solana-receivables`

Deadline recorded from the [official event page](https://www.hackalaunch.com/h/proof-of-taste): **23/09/2026, 21:28 America/Sao_Paulo**, or 24/09/2026 00:28 UTC.

- Repository: https://github.com/Miervolino06/solana-receivables
- Public product: https://solana-receivables.vercel.app/
- Public Proof desk: https://solana-receivables.vercel.app/verify
- Evidence instructions: [docs/PROOF.md](PROOF.md)
- **Still pending:** a real-wallet Devnet payment, its signature and verified receipt URL, and a demo video no longer than three minutes.

## Short description

A screenshot does not settle a payment request. Receivables asks the payer to review and sign in their own wallet, then checks the confirmed Devnet transfer against the exact recipient, amount, reference and signed request Memo. Anyone can recheck the receipt and compare it with Solana Explorer.

## Why this design

“Paid” should be explainable. Receivables ties the transfer to the request and shows the match evidence, while disclosing amount, estimated network fee and risks before the wallet opens. This is a Devnet demonstration; test SOL has no economic value.

## Scope and provenance

The payment is a native SOL System Program transfer plus a payer-signed Memo. There is no mint, custody, escrow, delegated authority or platform fee. Names are self-declared; request data is public; receipts do not prove identity, service delivery or invoice issuance. Native transfers cannot prevent concurrent duplicate payments.

BEFORE application/wallet scaffolding was reused. The user chronology places this work during the hackathon. Payment requests, proof verification, Actions, reconciliation and CSV belong to this pivot. The user's own Órbita CRM (fdz-crm origin/master `3fdef60`) supplied visual reference only; no source, assets or business data were copied. No organizer opening date is asserted.

## Evidence state

- [x] Public repository includes setup instructions and a public-only environment example.
- [x] Production frontend and Action endpoint were publicly reachable and smoke-checked; those checks submitted no payment.
- [x] Automated offline fixtures cover transaction-match and tampering rules; fixtures are not chain proof.
- [ ] Real transfer signed in a standard wallet, with its signature and public receipt independently checked.
- [ ] Demo video of at most three minutes shows request, cost review, wallet approval, confirmation, proof and independent Explorer check.
- [ ] Team size, one-submission-per-person rule and actual submission confirmed.

The public BEFORE prototype is historical; its URLs are not Receivables deployment evidence. Eligibility in principle does not imply organizer approval. See [VERIFICATION.md](VERIFICATION.md) for the dated evidence record and [DEMO.md](DEMO.md) for the recording script.
