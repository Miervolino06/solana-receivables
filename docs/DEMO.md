# Three-minute demo script

**Recording status: pending.** The first real wallet payment is confirmed and available at [the public receipt](https://solana-receivables.vercel.app/demo). The user did not record that signature. A new unpaid request is prepared at [the recording link](https://solana-receivables.vercel.app/record): 0.001 Devnet SOL to the same recipient. Start the phone's screen recording **before** opening Review payment, then let the user approve in Phantom. Do not represent a replayed receipt, illustration, offline fixture or fee quote as a newly signed payment.

Use the deployed app, a funded payer wallet and a recipient wallet you control. Keep the actual receipt URL and transaction signature. Never show a seed phrase or private key.

For a quick phone recording, use a single continuous take under three minutes: open the recording link inside Phantom, explain the purpose, show the full review and total, approve the transfer, wait for its receipt, and open Explorer. Narration can be short: “Receivables turns a payment link into proof you can check. This is Devnet test SOL. Before signing, I can see the recipient, amount, fee and risks. After confirmation, anyone can verify the exact request against the transaction.” If a wallet security screen is omitted by the recorder, film the phone with another device so the actual approval is visible. Upload the real recording to YouTube, Loom, Vimeo or X and use that URL in the submission.

| Time | Show and say |
| --- | --- |
| 0:00–0:25 | Create a request for the recipient. “The link states exactly what is being requested; creating it does not sign or move funds.” |
| 0:25–0:55 | Open the link as payer. Read the exact recipient, amount, estimated network fee and total aloud. Point out that request fields and the Memo are public, the transfer is irreversible, and failed transactions may still cost a fee. This is Devnet SOL with no monetary value. |
| 0:55–1:25 | Choose the payer wallet, inspect the wallet’s transaction details and approve it. Show the wallet itself signing; do not imply the app signs for the payer. |
| 1:25–1:55 | Wait for confirmed status. Open the receipt’s match sheet and show exact recipient, amount, request binding, signature and balance evidence. |
| 1:55–2:25 | Open `/verify`, recheck the same real receipt, and download its JSON record. Change the request data while keeping the transaction signature and show that the altered request is rejected. |
| 2:25–2:50 | Open the transaction in Solana Explorer on Devnet. Compare the signature and transfer independently. Close: “The receipt is useful because its request and transaction can be checked.” |

Before submission, test that the public receipt link opens without a wallet and that the altered request fails. The displayed Devnet identity or sample slot is network context only; it must not stand in for a signature or receipt. Keep the actual receipt URL in project evidence and upload the final video URL only after the real recording exists.
