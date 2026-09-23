# Remaining submission evidence

Receivables replaces the earlier statement/token prototype. Source repository: https://github.com/Miervolino06/solana-receivables.

The production deployment is live at https://solana-receivables.vercel.app (Vercel READY, commit `46403d3`). At 01:20 BRT, production smoke passed OPTIONS 204, GET 200 with fee quote 0.000005 SOL and total 0.001005 SOL for a 0.001 SOL request, invalid-payer POST 400, icon 200 and actions.json 200. CI passed build, 25 tests and the dependency import guard: https://github.com/Miervolino06/solana-receivables/actions/runs/35817868974.

The standard-wallet payment and demo video remain required. The supplied payer wallet had zero Devnet SOL at 01:19 BRT; the official RPC faucet had returned HTTP 429 earlier. The production POST smoke used an invalid payer, and deterministic fixtures do not prove funded transaction submission. No real signed payment has been verified. The user has been asked to use the official web faucet. No private key or seed is requested.

Do not describe the entry as complete until the real signed transaction and <=3-minute video have been verified. Public deployment and endpoint smoke evidence are recorded in docs/CHAIN.md and docs/SURFACE.md; see docs/VERIFICATION.md for remaining end-to-end evidence.
