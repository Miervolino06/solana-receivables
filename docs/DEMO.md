# Three-minute demo script

**Recording status: pending.** No real-wallet end-to-end transfer, user-approved signature, paid receipt URL or demo video exists yet. Do not record the illustrative landing animation, an offline fixture, a fee quote, or a sample Devnet slot as if it were a payment. Make one small, real Devnet payment with two distinct wallets before recording.

Use the deployed app, a funded payer wallet and a recipient wallet you control. Keep the actual receipt URL and transaction signature. Never show a seed phrase or private key.

| Time | Show and say |
| --- | --- |
| 0:00–0:25 | Create a request for the recipient. “The link states exactly what is being requested; creating it does not sign or move funds.” |
| 0:25–0:55 | Open the link as payer. Read the exact recipient, amount, estimated network fee and total aloud. Point out that request fields and the Memo are public, the transfer is irreversible, and failed transactions may still cost a fee. This is Devnet SOL with no monetary value. |
| 0:55–1:25 | Choose the payer wallet, inspect the wallet’s transaction details and approve it. Show the wallet itself signing; do not imply the app signs for the payer. |
| 1:25–1:55 | Wait for confirmed status. Open the receipt’s match sheet and show exact recipient, amount, request binding, signature and balance evidence. |
| 1:55–2:25 | Open `/verify`, recheck the same real receipt, and download its JSON record. Change the request data while keeping the transaction signature and show that the altered request is rejected. |
| 2:25–2:50 | Open the transaction in Solana Explorer on Devnet. Compare the signature and transfer independently. Close: “The receipt is useful because its request and transaction can be checked.” |

Before submission, test that the public receipt link opens without a wallet and that the altered request fails. The displayed Devnet identity or sample slot is network context only; it must not stand in for a signature or receipt. Keep the actual receipt URL in project evidence and upload the final video URL only after the real recording exists.
