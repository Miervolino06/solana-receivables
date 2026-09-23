# Inspect and recheck a receipt

Receivables treats a receipt as a claim that can be checked. The request says what was asked for; the transaction and its payer-signed Memo say what was sent. A screenshot, request link, wallet address or Devnet slot by itself does not prove payment.

## Public check

1. Open the public [Proof desk](https://solana-receivables.vercel.app/verify) without connecting a wallet.
2. Paste a real receipt URL copied from a confirmed payment. It contains the canonical request (`r`) and transaction signature (`tx`). Ask the desk to recheck it on Devnet.
3. Inspect the match sheet: exact recipient and amount, request binding, confirmed status, signature and available balance evidence. Download the JSON record for retention.
4. Follow the transaction link to [Solana Explorer on Devnet](https://explorer.solana.com/?cluster=devnet) and compare the signature and transfer. The explorer is an independent presentation of chain data; it does not certify identity or delivery.

The public desk may show the live Devnet network identity and a sample slot to establish which network it is querying. Those are network context, not payment evidence. The [verified demonstration receipt](https://solana-receivables.vercel.app/demo) is a separate, real Devnet test transfer; recheck it rather than treating the page's network observation as proof.

## Challenge the request binding

Keep a genuine receipt's signature, but use a different request with changed data, such as a different amount. Submit that changed request for verification. It must be rejected: the transaction Memo and transfer must match the entire canonical request, not just mention a reference or show a similar amount. A mismatch is the expected result of this negative check.

## Read-only command-line check

From the repository root, use the URL copied from an actual receipt. Keep the URL quoted so the shell does not treat `&` as a separator:

```sh
npm run verify:receipt -- '<paste the actual receipt URL containing ?r=…&tx=…>'
```

The command performs a fresh read-only Devnet lookup and emits JSON when verification succeeds; invalid input or an RPC/verification failure exits with an error message. It has no signing key, does not connect a wallet and cannot submit a transfer. The text inside angle brackets is a template. For an actual check, use the `proofLink` in the [demonstration evidence record](../public/receipt-demo-v1.json) or copy the URL from the live receipt.

## What the check means

A valid match supports that the referenced payer signed and confirmed the native SOL transfer described by that exact request. Verification checks successful transaction metadata, transaction structure and signature, recipient/amount/reference/Memo, and payer/recipient balance changes including the network fee. The downloaded JSON is a timestamped report of that check, not a portable cryptographic certificate; requery Devnet to check again. The request label remains self-declared. A receipt does not prove who controls an address, that a service was delivered, or that an invoice exists.

The verifier depends on RPC data. RPC providers can fail, rate-limit, omit old transaction history or disagree about availability. “Unknown” or unavailable evidence must not be read as paid or unpaid. Devnet may reset, which can make old evidence unavailable. Transaction explorer pages and downloaded JSON are useful records, but neither prevents the underlying network from resetting. Devnet SOL has no economic value.

## Evidence currently available

The user reports approving a demonstration payment in Phantom. An independent read-only Devnet check at 23/09/2026 17:11:52 UTC verified signature `KQvP2y2F1RhyzhaU4YNNdhGkpixAUr42KTgWniqnRpnDvbcjYCci6yM4sVJH3GXrbXT1iPpz4qMTzx5iVTJFxwC` in slot 503047831. The exact request transferred 1,000,000 lamports (0.001 SOL) to `2Ga88akVcu85SpbRxCHQkdQyU1jbvve6cMaYWyW1YDh1`, with a 5,000-lamport network fee. [Inspect the transaction in Explorer](https://explorer.solana.com/tx/KQvP2y2F1RhyzhaU4YNNdhGkpixAUr42KTgWniqnRpnDvbcjYCci6yM4sVJH3GXrbXT1iPpz4qMTzx5iVTJFxwC?cluster=devnet) and use the report's `proofLink` to recheck the request binding.

The [JSON report](../public/receipt-demo-v1.json) is a timestamped RPC verification record, not a portable certificate. Devnet can reset, and a later lookup can become unavailable. The payment does not prove the wallets' real-world owners or service delivery. **Still missing:** the demonstration video and confirmed Hackalaunch submission. Track these in [SUBMISSION.md](SUBMISSION.md) and the dated [verification record](VERIFICATION.md).
