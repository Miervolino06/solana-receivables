# Receivables surface

The approved reference is the current Órbita CRM in the user's own fdz-crm, origin/master `3fdef60`: Manrope with Geist Mono; light surfaces `#f5f6f8`, `#ffffff`, `#f0f2f5`; sapphire `#345ed3` primary; a 184px rail; floating main panel with 18px radius; 12/7/16px component radii and compact request rows. This direction is implemented in the current interface. The earlier warm-neutral/Geist interpretation came from a stale checkout and is superseded. This is a visual reference; no CRM source, assets or data were copied. Receivables is a neutral working name. The earlier LINEITEM icon and document-led direction were rejected.

## Information hierarchy

The workspace answers: what was requested, what was verified received, what was checked and remains open, and what is still unverified. All values come from actual local requests and chain checks. Errors and pending results stay visible; neither becomes fabricated revenue or outstanding balance.

A request detail shows payee label as self-declared, full destination address, amount, public description and reference. Payment review adds live network fee, total, balance and risks before the wallet opens.

## Proof interaction

“Why this payment matches” presents requested versus verified recipient, SOL amount and request reference/Memo, followed by signature, fee and available chain time. Only successful verification permits a paid state. Request creation time must never substitute for confirmation time.

The user can share a receipt, inspect it without connecting a wallet, print/save it, or export reconciliation CSV. A receipt is proof of payment, not identity, delivery or a fiscal invoice.

## States and limits

Draft/shared → review → signing → pending → verified or visible failure. Pending signatures survive reload when local storage succeeds, but another device can still make a duplicate payment. Workspace is browser-only and capped at 40 requests.

Keep reduced motion, keyboard navigation and focus legible. No fake activity, invented paid examples, decorative tokens or implied external Blink verification. Final visual and browser evidence is tracked in VERIFICATION.md.

## Production status

The production app is live at https://solana-receivables.vercel.app. The 23/09/2026 01:20 BRT smoke passed for Action OPTIONS/GET, invalid-payer POST handling, icon and actions.json. The GET fee quote was 0.000005 SOL for a 0.001 SOL request (0.001005 SOL total). No funded production POST or real signed payment has been verified; the interface must continue to distinguish code paths and test fixtures from actual chain evidence.
