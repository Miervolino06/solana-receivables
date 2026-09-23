# Receive SOL payments with a link and a verifiable receipt

Receivables turns a payment request into a link or QR code. The payer reviews the details and authorizes the transfer in their own wallet. The app then checks Solana to see whether that transfer matches the request.

**The currently published version is a Devnet demonstration.** Test SOL has no economic value. The app does not yet support commercial payments on Mainnet.

[Open the website](https://solana-receivables.vercel.app/) · [Open the workspace](https://solana-receivables.vercel.app/app) · [English technical README](../README.md)

## What it does

When you already accept crypto, the challenge is not learning what a wallet is. It is sending the right payment details to the right person and being able to check the payment afterward. A Receivables request brings the recipient, amount and reference together in a shareable link. The app checks the network for a transfer matching those details; the resulting receipt can be shared, and requests can be exported to CSV.

> **Illustrative example, not a real payment:** You agree to test a payment of **0.01 Devnet SOL** for a service. Create a request, send its link to the payer, and they open the review screen. The app shows the recipient, amount and estimated network fee before opening the wallet for approval. The wallet asks the payer to approve and sign the transfer. After signing, Receivables checks the transaction. If the details match, it creates a receipt that anyone can verify without connecting a wallet.

A clear link and an easy-to-check receipt may reduce back-and-forth messages about payment confirmation and help present a more professional workflow to clients. This is a possible product benefit, not one validated with clients.

## Try it out

1. Open the [workspace](https://solana-receivables.vercel.app/app) and connect a wallet set to **Solana Devnet**. Connecting is a convenience for accessing the interface. It does not prove your identity with a signature or transfer SOL.
2. Create a request with the receiving wallet address, a small amount such as **0.01 test SOL**, and a description that helps identify the request. The app prepares a link and QR code. Save the link: requests are stored in this browser's local storage, not in a cloud-synced account.
3. Use a second wallet as the payer. Open the link and check the address, amount and estimated fee. Simulation helps check the transaction before submission; only explicit approval in the wallet signs and sends the payment.
4. After submission, wait for the network check. The app marks a request as received only after verifying the signature and matching the recipient, amount, reference and Memo to the request. Open and share the receipt or export the activity to CSV.

To get test SOL, use the [official Solana faucet](https://faucet.solana.com/), if available. Do not enter your seed phrase or private key on the site. Keep testing on Devnet: test SOL must not be treated as money.

## Fees in plain language

- **Receivables fee:** This flow charges no platform fee.
- **Priority fee:** Fixed at zero for this Devnet demo before wallet review. The Solana base network fee still applies.
- **Solana network fee:** The network may charge a small transaction fee. The app queries an RPC service and shows the estimate separately from the requested amount, before opening the wallet for approval. The final fee may vary.
- **Total leaving the wallet:** The requested amount plus the displayed network fee. Check the total in your wallet before approving.

## What are SOL, a wallet and Devnet?

**SOL** is Solana's native asset and can be used to pay a transaction fee. A **wallet** holds the keys that authorize operations; Receivables never receives your private key. **Devnet** is a network separate from Mainnet, used to test apps with SOL that has no economic value.

## What the receipt proves

The receipt shows evidence checked on the blockchain: a valid signature and a confirmed transaction matching the request's recipient, amount, reference and Memo. Anyone with the link can check whether the indicated transfer matches the request.

This demonstrates a transfer on Devnet. It does not establish who is behind a wallet, that a service was delivered, that a fiscal invoice was issued, or that a commercial payment was made on Mainnet. The request creator supplies the displayed name, and the link and Memo details are public to anyone with access. Avoid including private information.

## Recheck and challenge a receipt

1. Copy the **actual receipt link** from a confirmed payment and open the public [Proof desk](https://solana-receivables.vercel.app/verify). Paste the link and run a fresh Devnet check. The page does not require wallet connection.
2. Review the match sheet and open the linked transaction in Solana Explorer on Devnet. Explorer is a separate view of the transaction; it does not certify the payee's identity or delivery.
3. Download the JSON evidence record and keep it with the actual receipt link. A displayed Devnet identity or sample slot identifies the network context; it is not evidence that your request was paid.
4. To challenge the match, create a different request (for example, a different amount), then submit that request with the original transaction signature. It must fail because the signed Memo binds the transaction to the original request. Do not edit a receipt into a success.

For an independent command-line recheck, from the project directory run this template with your own copied receipt link, keeping the URL in single quotes so `&` is passed literally:

```sh
npm run verify:receipt -- '<paste your actual receipt URL containing ?r=…&tx=…>'
```

The command is read-only: it queries Devnet and prints a JSON result; it does not connect a wallet, sign or submit a transaction. The example is a command template, not a verified receipt. No genuine receipt URL or wallet-approved signature exists for this project yet. RPC responses are the evidence source used by the verifier; an RPC provider can be unavailable or return incomplete history, and Devnet can reset. A later recheck can therefore be unavailable even when an earlier receipt was valid.

## Paying from Phantom on a phone

Open the payment link inside Phantom's browser. In Phantom, open your profile, then **Settings → Developer Settings → Testnet Mode**, and select **Solana Devnet**. Testnet mode applies to app connections as well as balances. See [Phantom's test-network instructions](https://help.phantom.com/articles/use-testnets-in-phantom-5997313271699).

Return to the payment link and connect the funded paying wallet. Choose **Review payment**, read the full recipient and total, then approve in the wallet. If the review expires while reading or switching apps, prepare a fresh review. Connecting the wallet and approving a transfer are separate actions.

If signing fails, the app shows the wallet's available error code and details next to the payment controls. An invalid-transaction error or internal wallet error is not evidence that you declined. If submission or confirmation is uncertain, check the saved signature before another payment; the first transfer could still confirm. A successful payment must end with a verified receipt, not just a wallet approval screen.

## Limits to know

- Requests and signature hints are stored locally in the browser, up to 40 per workspace. Clearing browser data, changing devices or using another browser profile may remove this history. Keep the links and export the CSV; this is not a backup.
- The app may show pending states or a lookup error. These do not mean a payment was received. A signature hint stored in the browser is not proof by itself.
- Devnet SOL has no economic value and Devnet may reset. Native transfers are irreversible, and failed transactions may incur a fee.
- Receivables is not a protected multi-user account, fiscal system, custodian or guarantee of delivery. Simultaneous payments for the same request from different devices can still occur.

## For service providers

If this flow becomes available for real payments, a payment link paired with verifiable evidence may make confirmation between provider and client easier. For now, use the published product only to explore the Devnet flow; do not send requests as commercial bills. A signed Devnet test and a demo video are still pending as project evidence.

For configuration, on-chain programs, local setup, provenance and verification status, see the [technical README](../README.md), [verification limits](VERIFICATION.md) and [submission notes](SUBMISSION.md).
