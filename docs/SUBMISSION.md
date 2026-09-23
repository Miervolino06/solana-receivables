# Submission copy

Product: **Receivables** · Network: **Solana Devnet** · Package: `solana-receivables`

Deadline shown on the [official event page](https://www.hackalaunch.com/h/proof-of-taste) at 23/09/2026 17:15 UTC: **24/09/2026, 21:28 America/Sao_Paulo**, or 25/09/2026 00:28 UTC. Recheck the live page before submission.

- Repository: https://github.com/Miervolino06/solana-receivables
- Public product: https://solana-receivables.vercel.app/
- Public Proof desk: https://solana-receivables.vercel.app/verify
- Verified Devnet demonstration receipt: https://solana-receivables.vercel.app/demo
- Public evidence JSON: https://solana-receivables.vercel.app/receipt-demo-v1.json
- Demo video: https://x.com/NoMotionKol/status/2102829978316657060
- Hackalaunch public submissions: https://hackalaunch.com/h/proof-of-taste#submissions
- Submitted payout address: `GcMnAoMVpzoQM8fD87AYgduWEBuMn4XfekuAUmW852a2`
- Evidence instructions: [docs/PROOF.md](PROOF.md)
- **Status — 23 September 2026:** the 92.76-second silent product-tour video is published on X, and the submission appears on the public Hackalaunch submissions page as “Receivables — SOL payments with proof” by @NoMotionKol. The video does not show wallet approval, so the full video criterion is not met. No unique entry URL is visible; the public submissions page is the available listing link. Public listing does not confirm organizer eligibility, team-rule compliance, or an award.

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
- [x] The user reports approving a Phantom payment; read-only Devnet verification matched the exact 0.001 SOL request, 0.000005 SOL fee and payer signature `KQvP2y2F1RhyzhaU4YNNdhGkpixAUr42KTgWniqnRpnDvbcjYCci6yM4sVJH3GXrbXT1iPpz4qMTzx5iVTJFxwC` in slot 503047831. The public report includes the receipt URL and Explorer link.
- [x] An approved 92.76-second silent product-tour video is published at the X link above.
- [ ] Video shows wallet approval. The published video does not include that footage.
- [x] Hackalaunch submission appears on the public submissions page linked above.
- [ ] Team size and one-submission-per-person rule confirmed; organizer eligibility decision is not known.

The public BEFORE prototype is historical; its URLs are not Receivables deployment evidence. Eligibility in principle does not imply organizer approval. See [VERIFICATION.md](VERIFICATION.md) for the dated evidence record and [DEMO.md](DEMO.md) for the recording script.
