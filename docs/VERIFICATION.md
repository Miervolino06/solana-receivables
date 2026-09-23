# Verification status

Snapshot: Receivables, 23/09/2026. No real payment is claimed yet.

## Automated evidence

- Production build and TypeScript check passed at 01:04 BRT.
- 25 tests passed in 3 files, Vitest 4.1.11: exact transfer/Memo proofs, tampering, duplicate/expiry/pending guards, synchronous persistence before broadcast, Action metadata/unsigned transaction/CORS and workspace/CSV integer accounting.
- These tests use explicit offline fixtures; fixtures never enter the user interface or establish real onchain evidence.
- Dependency audit: 4 moderate transitive findings in web3.js/jayson/uuid/stream-json; no high or critical findings. No forced downgrade applied.

## Browser and live network evidence

Checked in the Codex browser at desktop 1440px, tablet 900px and mobile 390px:

- Create an unsigned request, store it, reload the shared link and generate its exact QR.
- Search, clear filters, navigate Activity and open New request.
- Check all against live Devnet; an unpaid draft correctly remains without a matching payment and received total stays zero.
- Reject malformed request links; expose errors without marking paid.
- Open the standard-wallet selector directly from the shared request at tablet width.
- Mobile rows show payee, status and exact SOL without horizontal page overflow; viewport 390px / scroll width 382px.
- Light/dark surfaces and Manrope font inspected. Keyboard panel focus/escape/return and reduced-motion behavior are implemented; actual wallet approval remains untested.
- Local Action GET returned HTTP 200 from live Devnet with fee 0.000005 SOL and total 0.010005 SOL for a 0.01 SOL request. This is a fee quote, not a payment.

Independent source review found and confirmed fixes for stale selection receipt association, a covered wallet button, Activity creation and panel focus. A separate substitute visual finish reviewer cleared the observed light desktop/tablet/mobile surfaces for shipping; real signing and paid receipt states remain outside that visual review.

## Required evidence still pending

- [ ] Verify public deployment, live Action GET/POST/OPTIONS, icon/origin and actions.json.
- [ ] Complete one real standard-wallet payment; preserve its signature and verified receipt.
- [ ] Record and upload the required video of at most 3 minutes, including review, wallet signing and confirmation.

Public source: https://github.com/Miervolino06/solana-receivables. The supplied payer wallet had zero Devnet SOL; the official RPC faucet returned 429. The user has been asked to use the official web faucet.

Local signatures are hints, never proof. RPC errors remain unknown, never paid or unpaid. Cross-device/native transfers cannot guarantee exactly-once settlement. External Blink registry approval and automatic social rendering remain unverified.
