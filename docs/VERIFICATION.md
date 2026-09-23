# Verification status

Current snapshot: 23/09/2026. One user-reported Phantom payment has an independently verified Devnet receipt. An approved 92.76-second silent product-tour video has been recorded, but it does not show wallet approval; no hosted video URL or Hackalaunch submission is confirmed. Sections below this current update retain what was known at earlier checks on the same date.

## Verified demonstration payment — 23/09/2026

The user reports approving the demonstration payment in Phantom. A read-only Devnet lookup at 17:11:52 UTC independently verified signature `KQvP2y2F1RhyzhaU4YNNdhGkpixAUr42KTgWniqnRpnDvbcjYCci6yM4sVJH3GXrbXT1iPpz4qMTzx5iVTJFxwC`, confirmed in slot 503047831 at 17:10:35 UTC. The exact request matched a 1,000,000-lamport transfer from `8PQiZb87dzMynLPM3K4Ph6bVNDoFTfyg34rMsEjAHCeb` to `2Ga88akVcu85SpbRxCHQkdQyU1jbvve6cMaYWyW1YDh1`, with a 5,000-lamport network fee. A changed-amount request was rejected against the same signature.

The [public evidence JSON](../public/receipt-demo-v1.json) includes the request, check time, receipt URL and Explorer link; the short [demo receipt link](https://solana-receivables.vercel.app/demo) is for fresh verification. This is a Devnet test transfer and a timestamped RPC observation, not a portable certificate, customer adoption, proof of identity/delivery or Mainnet payment. The recorded video does not show wallet approval, no hosted video URL is available yet, and no Hackalaunch submission is confirmed.

## Phantom priority-fee compatibility — 23/09/2026

The phone retest reached the app's `Wallet changed the transaction` guard after wallet approval. Phantom [documents automatically inserting priority-fee instructions](https://docs.phantom.com/developer-powertools/solana-priority-fees) at signing when an unsigned transaction lacks them, including on mobile. The old builder met those conditions. This reproduces a supported cause of the mismatch; the actual phone's returned bytes were not captured, so it is not a forensic identification of that attempt.

New payments prepare a 400,000 compute-unit limit and zero compute-unit price before the fee quote, simulation and user review. The immutable-message check remains intact. The verifier accepts only the exact new four-instruction message or the exact historical two-instruction message; it does not ignore wallet-added instructions or fees.

Read-only live Devnet validation at 17:00:34 UTC returned four instructions, a zero priority price, a 5,000-lamport network fee and a 1,005,000-lamport total for the user's 1,000,000-lamport demonstration request. Simulation passed at 122,323 compute units. A request with the maximum allowed label and description byte lengths also simulated successfully at 151,100 units; its unsigned transaction was 722 bytes. These were unsigned construction and simulation checks, not payment evidence. At that point, physical Phantom approval and the actual receipt still required the user's retest; the later verified payment is recorded above.

Validation: 51 tests in six files, TypeScript/Vite build and server dependency import guard passed. A regression test first reproduced the mismatch by emulating Phantom's documented insertion policy, then passed with the budget specified before review. A serialization/signing roundtrip using only an ephemeral local test key preserved the old message exactly. Correctly re-signed alterations to compute limit, price, order and accounts are rejected, and historical receipts remain accepted. Independent source review found no actionable issue. Remaining mismatch errors now identify a safe field category without exporting signed bytes or weakening the guard.

## Mobile payment investigation — 23/09/2026

A user reported that Phantom on a phone showed a declined-payment message after approval, and that the review was almost unreadable. Two defects were reproduced locally: the app replaced any error containing `reject`, `declin` or `cancel` with a claim that the user declined; and the review's flex layout held its background to the viewport height while warnings, acknowledgement and the signing action overflowed below it. The close icon also inherited black on graphite.

The review now grows with its content inside its scroll container. At 390×844, its measured height grew from 844px to over 1,270px and contained the final action. The 320px check had no horizontal page overflow and a 48px signing control. Desktop at 1440×900 also kept the action within the review surface. Mobile body copy and full addresses are larger; the close icon and wallet-button hover retain contrast on graphite.

Browser checks used an ignored, local-only harness with a public paying address, live Devnet fee/simulation reads, and a signing callback that can only throw. No key was loaded, and no transaction could be signed or broadcast by that harness. Error feedback was verified beside the payment controls with focus and scroll recovery. These checks do not establish that physical Phantom mobile signing now succeeds.

Wallet Standard sign-only requests now carry `chain: 'solana:devnet'`, bind the selected account to the reviewed payer and require compatible legacy signing support. The response must contain exactly one signed transaction. The existing message/signature checks and persistence-before-broadcast barrier still run afterward. The ignored network option on the legacy Phantom adapter was removed; that fallback still requires the wallet's Devnet setting. No automatic fallback follows a Wallet Standard rejection.

Validation: 45 tests across six files, TypeScript/Vite build and the server dependency import guard passed. Regression cases include explicit chain/account binding, incompatible signing versions, multiple signing responses, wallet error codes, and uncertain broadcast results. A controlled `-32603` error appeared beside the payment control with keyboard focus and its actual detail. Independent review found the missing signing-version check; it was fixed, reproduced by negative tests and re-reviewed without further actionable findings. The design detector reported palette/type advisories, including its stale design sidecar; this pass preserves the approved identity rather than refreshing that catalog.

The known demonstration reference returned no confirmed signatures during this earlier investigation. The later verified transaction is recorded at the top of this document.

## Wallet selector refinement — 23/09/2026

Removed workspace button-style leakage into the portaled wallet selector, including the 145px mobile width cap. The selector has graphite rows, internal gutters, consistent provider icons and readable detection labels. Browser checks used detected Phantom and MetaMask at desktop and 390px: both rows fit without text overflow. Opening from the connection gate and the public Verify header focuses the labeled close button; Tab cycles within the selector and Escape returns focus to the actual opener. No wallet connection or transaction was approved during these checks.

## English-only update — 23/09/2026

The public website, wallet entry, loading/accessibility text, page metadata and user guide now use English only. The language selector and saved language preference logic were removed; dark appearance and the payment flow are preserved. Production build/TypeScript checks passed, and the English landing and wallet entry were inspected in browser. The earlier bilingual verification below is retained as release history.

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

At that stage, these checks did not replace a real-wallet payment or video. The older verification sections retain the history of the initial payment-workspace release.

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

## Earlier release checkpoint — 23/09/2026 01:20 BRT

- [x] Public deployment is Vercel READY on `46403d3`: https://solana-receivables.vercel.app/.
- [x] Anonymous frontend HTTP 200; live Action smoke at 23/09/2026 01:20 BRT: OPTIONS 204, GET 200 with real Devnet fee quote, invalid-payer POST 400, icon 200, actions.json 200 and correct mapping. No transaction was submitted by the smoke script.
- [x] GitHub CI passed on Linux / Node 22, including the server dependency import guard, 25 tests and production build. [Run](https://github.com/Miervolino06/solana-receivables/actions/runs/35817868974).
- [x] Verify the user-reported Phantom demonstration payment on Devnet; preserve its signature and exact receipt in [the public evidence JSON](../public/receipt-demo-v1.json).
- [ ] Record and upload the required video of at most 3 minutes, including review, wallet signing and confirmation.

Public source: https://github.com/Miervolino06/solana-receivables. The supplied payer wallet still had zero Devnet SOL at 01:19 BRT; the official RPC faucet returned 429 earlier. The user has been asked to use the official web faucet. A successful funded unsigned POST is covered by an explicit test fixture, not yet by a funded live wallet in production.

Local signatures are hints, never proof. RPC errors remain unknown, never paid or unpaid. Cross-device/native transfers cannot guarantee exactly-once settlement. External Blink registry approval and automatic social rendering remain unverified.

## Inspectable proof update — 23 September 2026

Implemented the public proof desk at /verify, a proof section on the landing, a live RPC network-identity/confirmed-slot observation, and timestamped receipt evidence JSON. A read-only CLI reuses the exact payment verifier. Network observations and illustrative landing values are not payment evidence.

Validation: 35 tests in 6 files passed; TypeScript/Vite production build and server import guard passed. Browser inspection covered the dark proof form on desktop and 390px mobile, public entry from the landing, a rejected malformed request link, and actual Devnet identity/slot retrieval. Independent source review found a stale-receipt issue during rechecks; the fix derives receipt and timestamp from one successful check and invalidates before querying. The reviewer rechecked the fix with no actionable finding. A regression test covers cleared, open, error, pending and mismatched results. The CLI rejected a well-formed request paired with an unavailable signature; this negative check is not a paid transaction.

At this earlier check, the payer wallet had Devnet test SOL according to a live confirmed balance lookup. The payment and receipt had not yet occurred; the later verified transfer is recorded at the top of this document. Browser receipt/download inspection and the real demo recording were still missing at this stage. No customer adoption or completed submission is claimed.
