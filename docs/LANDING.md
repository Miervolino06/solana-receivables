# Landing direction

**Mode:** Persuade. Audience: freelancers and small businesses already receiving crypto. The page explains a concrete job—request SOL, let the payer review, and compare a confirmed payment with the request—before asking anyone to enter the workspace.

**Visual world:** Receivables keeps the approved Órbita CRM typography (Manrope; Geist Mono for exact values) and its graphite dark mode (`#101317`, `#181c21`, `#20262d`) as the principal surface. Sapphire is a restrained action and focus accent; the interactive payment sheets stay light for legibility. The landing uses more space and type scale than the compact workspace. It has no new logo, customer claims, metrics, or fake chain activity.

**Authored interaction:** A perspectived, cast-shadow payment piece moves among request, payer review, and match proof. Drag horizontally, use the range control, or press a labeled step. The sample amount is explicitly illustrative, and no transaction is represented as real. Reduced-motion mode removes 3D and transitions and shows one flat step at a time. Controls are keyboard and touch accessible.

**Truth and conversion:** The hero identifies Devnet and test SOL; the trust section repeats the limits. Wallet connection is described as connecting, not payment authorization or account authentication. `onEnter` delegates the transition to the parent; the landing has no wallet transaction logic. The public site is presented in English. CSS is scoped to `.landing` / `.lp-`.
