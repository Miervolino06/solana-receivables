# Verification status

Snapshot: Receivables, 23/09/2026. No real payment is claimed yet.

## Public introduction and wallet entry — 23/09/2026

The public `/` now explains the product in Portuguese or English before wallet connection. `/app` opens the wallet entry screen until a wallet is connected; `/verify` and shared `?r=` request/receipt links remain public. This is a frontend entry flow, not account authentication. Dark graphite is the primary appearance, with the workspace honoring an explicitly saved light preference.

- 29 tests across 4 files pass, including public-route and wallet-entry cases; production TypeScript/Vite build and server dependency import guard pass locally.
- Browser inspection covered desktop 1440px, 934px and mobile 390px. The landing and connection gate have no horizontal page overflow at the inspected widths. On mobile, the wallet connection button is visible in the first 844px viewport.
- The illustrative payment stack advances by real horizontal pointer drag, labeled step buttons and keyboard range control. PT/EN labels and example amount formatting change together. No illustration is presented as chain evidence.
- Browser-emulated `prefers-reduced-motion: reduce` removes perspective and shows exactly one flat sheet with negligible transition duration. This is browser emulation, not a physical-device test.
- Wallet selection opens the standard selector, focuses its labeled close button and returns focus on Escape. Landing/entry/back transitions focus the new heading. No wallet connection or signature was approved by the agent.
- Public verification, invalid-link rejection and `/verify` refresh behavior were inspected. A separate source reviewer found the public Verify URL and route-focus defects; both were fixed, independently rechecked in source and confirmed in browser.
- README and the Portuguese guide explain use, costs, local-browser storage and Devnet limitations. Existing payment programs, signature flow and Action endpoint are unchanged.

A separate substitute visual reviewer inspected 934×1000 and 390×844 screenshots in an isolated Chrome tab, plus mobile control dimensions; no material visual blocker was found. This review did not include real wallet approval.

Production code commit `f46e798` is Vercel READY (`dpl_MUc1N4Thd98Y6z2uYRnGmMMBE9y7`), aliased to https://solana-receivables.vercel.app/. Both GitHub CI checks passed; [push run](https://github.com/Miervolino06/solana-receivables/actions/runs/35860320952). Anonymous `/`, `/app`, `/app/`, `/verify`, `/verify/` and invalid-link requests returned HTTP 200 with the new frontend; deployed JavaScript and CSS also returned 200. The production landing and wallet-entry route were confirmed in browser. Live Action smoke at 09:26 BRT returned OPTIONS 204, metadata 200, invalid-payer POST 400, icon 200 and discovery 200. The fee quote was 0.000005 SOL for the 0.001 SOL test request; no transaction was submitted.

These checks do not replace the real-wallet payment and video still listed below. The older verification sections retain the history of the initial payment-workspace release.

## Automated evidence

- Production build and TypeScript check passed locally and in GitHub CI; latest code commit tested: `46403d3`.
- 25 tests passed in 3 files, Vitest 4.1.11: exact transfer/Memo proofs, tampering, duplicate/expiry/pending guards, synchronous persistence before broadcast, Action metadata/unsigned transaction/CORS and workspace/CSV integer accounting.
- These tests use explicit offline fixtures; fixtures never enter the user interface or establish real onchain evidence.
- Dependency audit: 4 moderate transitive findings in web3.js/jayson/uuid/stream-json; no high or critical findings. No forced downgrade applied.
- First public Action probe caught a CommonJS/ESM incompatibility in rpc-websockets 9.3.9 / UUID 14. It was reproduced with Node's ESM-require interop disabled. The dependency is pinned to 9.3.8 / UUID 11; CI now runs the same import guard before tests. Vercel and CI target Node 22. Action tests live outside `api/` so they are not deployed as functions.

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

- [x] Public deployment is Vercel READY on `46403d3`: https://solana-receivables.vercel.app/.
- [x] Anonymous frontend HTTP 200; live Action smoke at 23/09/2026 01:20 BRT: OPTIONS 204, GET 200 with real Devnet fee quote, invalid-payer POST 400, icon 200, actions.json 200 and correct mapping. No transaction was submitted by the smoke script.
- [x] GitHub CI passed on Linux / Node 22, including the server dependency import guard, 25 tests and production build. [Run](https://github.com/Miervolino06/solana-receivables/actions/runs/35817868974).
- [ ] Complete one real standard-wallet payment; preserve its signature and verified receipt.
- [ ] Record and upload the required video of at most 3 minutes, including review, wallet signing and confirmation.

Public source: https://github.com/Miervolino06/solana-receivables. The supplied payer wallet still had zero Devnet SOL at 01:19 BRT; the official RPC faucet returned 429 earlier. The user has been asked to use the official web faucet. A successful funded unsigned POST is covered by an explicit test fixture, not yet by a funded live wallet in production.

Local signatures are hints, never proof. RPC errors remain unknown, never paid or unpaid. Cross-device/native transfers cannot guarantee exactly-once settlement. External Blink registry approval and automatic social rendering remain unverified.
