# Security

Receivables is a Solana Devnet prototype. Test SOL has no economic value. Do not use it for mainnet commercial payments or store private keys in this repository, browser workspace, issue tracker or payment description.

## Report a vulnerability

Use [GitHub private vulnerability reporting](https://github.com/Miervolino06/solana-receivables/security/advisories/new). Include reproduction steps and the affected version. Do not post credentials, private keys or an exploitable payment flaw in a public issue. Never test by taking another user's funds or disrupting the public service.

## Wallet and receipt boundaries

The app does not hold funds or ask for seeds, private keys, token approvals or delegated authority. A connected wallet is a UI convenience, not an authenticated server account. Requests and pending signatures are stored in the browser. Payment links and request Memo fields are public.

The payer reviews the destination, amount, network fee, total and risks. The app then verifies that the wallet signed the exact prepared transaction before broadcast. A receipt verifies the transaction's network, instructions, payer signature, recipient, exact lamports, reference, Memo and account balance changes. It does not establish identity, delivery or invoice issuance.

RPC responses remain a trust dependency. Devnet can reset, and a native transfer cannot prevent a concurrent duplicate payment from another client. A pending signature must be checked before trying another transfer.

## Deployment controls

- The site serves scripts and fonts from its own origin, disallows framing, objects, base-URL overrides and form submission, and permits RPC connections only to the configured Devnet origin in `vercel.json`.
- Inline styles are permitted for React animation and wallet UI; inline scripts and `eval` are not permitted. HTTPS images are permitted for wallet icons.
- If you change `VITE_SOLANA_RPC_URL`, explicitly update the CSP `connect-src` allowlist for that endpoint. Never put a server-only credential in a `VITE_` variable; those values are public browser configuration.
- The Action endpoint validates input before RPC work, bounds history queries, suppresses arbitrary upstream error text and limits each warm function instance. These instance limits are **not** a distributed WAF or global spending cap. Internet-scale abuse protection requires provider-level rate limits and a suitable distributed edge policy.
- CORS on Actions is intentionally public to support independent Action clients. The endpoint only constructs an unsigned Devnet transaction; it cannot sign for a payer.

## Dependency and CI checks

Run `npm ci`, `npm audit --audit-level=moderate`, `npm run check:server-deps`, `npm test` and `npm run build` before release. CI has read-only repository permissions, pins Actions to commit hashes, and does not persist checkout credentials. Dependabot checks npm and GitHub Actions updates weekly.

The repository's production branch requires a pull request and the GitHub Actions `check` job before merging. Force pushes and branch deletion are blocked. Secret scanning and push protection are enabled; dependency alerts and automated security-fix pull requests are enabled. GitHub Actions is restricted to GitHub-owned actions with commit-SHA pinning. These controls do not establish the security of the owner's account or devices.

The pinned `jayson` 5.0.0 override removes the legacy `uuid` and `stream-json` dependencies flagged by the September 2026 audit. Compatibility is checked by importing `@solana/web3.js`, running transaction tests and querying Devnet. The `rpc-websockets` 9.3.8 override preserves CommonJS server compatibility. Revalidate these overrides when upgrading the Solana SDK.

An automated dependency scan or source review is not a guarantee that no vulnerability exists. Keep alerts enabled and test the deployed application after every security change.
