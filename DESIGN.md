---
name: Receivables
description: A graphite-first public landing and practical workspace for payment requests and verified receipts.
colors:
  sapphire: "#93b1ff"
  graphite: "#101317"
  graphite-raised: "#181c21"
  graphite-surface: "#20262d"
  graphite-line: "#303741"
  landing-ink: "#eef0f3"
  landing-muted: "#a4afbd"
  landing-paper: "#ffffff"
  cool-white: "#ffffff"
  cool-ground: "#f5f6f8"
  cool-surface: "#f0f2f5"
  ink: "#202631"
  muted-ink: "#555f6d"
  line: "#e0e4e9"
  verified: "#21704c"
  pending: "#8b5a14"
  error: "#b83141"
typography:
  body:
    fontFamily: "Manrope Variable, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.45
  title:
    fontFamily: "Manrope Variable, sans-serif"
    fontSize: "26px"
    fontWeight: 750
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  label:
    fontFamily: "Geist Mono Variable, monospace"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  control: "12px"
  landing-button: "10–11px"
  landing-demo: "19px"
  card: "16px"
  workspace: "18px"
spacing:
  compact: "8px"
  standard: "16px"
  spacious: "24px"
components:
  button-primary:
    backgroundColor: "{colors.sapphire}"
    textColor: "{colors.graphite}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  request-row:
    backgroundColor: "{colors.cool-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "70px"
---

# Design System: Receivables

## Overview

**Creative North Star: "The Evidence Workspace"**

Receivables is a practical workspace where a payment request becomes an operational record and a verified chain transaction becomes evidence. Its visual lineage comes from the user's current Órbita CRM: Manrope, Geist Mono, restrained sapphire actions, compact operational hierarchy and the graphite dark mode. Órbita is a visual reference only; no CRM code, assets or business data were copied. The public `/` landing presents the product to freelancers and small businesses already receiving crypto; entering `/app` leads to the wallet-connection gate and workspace. The workspace may offer a saved light preference, while graphite remains the default visual direction.

The workspace favors clear labels, dense useful rows and calm surfaces. The public landing uses a larger editorial scale to explain the request → payer review → match flow before entry. Payment review and transaction proof receive the strongest hierarchy because a payer must understand destination, amount, fee and public details before signing. Receivables is a neutral working name; no logo or brand mark is implied.

**Key Characteristics:**
- Graphite dark mode is the default for the public landing and workspace; a saved light preference may be available in the workspace.
- The public landing addresses freelancers and small businesses already receiving crypto and routes entry through `/app` wallet connection.
- An illustrative CSS 3D paper stack explains request, review and match; drag, range and labeled buttons provide equivalent navigation.
- Sapphire marks actions and links; status colors carry verified, pending and error meaning.
- Manrope carries interface text; Geist Mono distinguishes addresses and exact amounts.
- The request and its evidence remain the visual center.

## Colors

Graphite (`#101317`) is the default page ground, with raised graphite (`#181c21`) and surface graphite (`#20262d`) organizing public and workspace regions. Sapphire (`#93b1ff`) is the action accent. The landing illustration retains light paper sheets for contrast; status colors remain semantic and restrained.

### Primary
- **Sapphire** (`{colors.sapphire}`): primary actions, links and focus indication. The landing uses the lighter graphite-compatible sapphire; the workspace may retain the original sapphire when its light preference is active.
- **Graphite** (`{colors.graphite}`, `{colors.graphite-raised}`, `{colors.graphite-surface}`): default public and workspace surfaces; `{colors.graphite-line}` marks their boundaries.
- **Landing text** (`{colors.landing-ink}`, `{colors.landing-muted}`): primary and supporting copy on dark surfaces.
- **Paper** (`{colors.landing-paper}`): illustrative request sheets, deliberately distinct from the surrounding dark scene.

### Workspace light preference
The original cool-white, pale blue-gray and ink tokens remain the optional saved light appearance for the workspace. They are not the public landing or product default. Use the landing graphite tokens above for default public surfaces.

### Semantic
- **Verified green** (`{colors.verified}`): chain-confirmed payment and receipt states.
- **Pending amber** (`{colors.pending}`): submitted or unresolved checks.
- **Error red** (`{colors.error}`): failed checks and actionable errors.

**The Evidence Color Rule.** Sapphire denotes an available action or focus; green denotes verified chain evidence. A self-declared name or a saved local record must never receive verified styling by itself.

## Typography

**Display Font:** Manrope Variable (with system sans-serif fallbacks)
**Body Font:** Manrope Variable (with system sans-serif fallbacks)
**Label/Mono Font:** Geist Mono Variable (with monospace fallback)

**Character:** Manrope keeps the workspace direct and legible. Geist Mono gives wallet addresses, signatures and tabular amounts a distinct, inspectable shape.

### Hierarchy
- **Landing hero** (Manrope, weight 780, 58–89px responsive, line-height 1.045): public page headline.
- **Landing section headings** (Manrope, weight 760, 34–48px responsive, line-height 1.17): landing sections.
- **Headline** (weight 750, 26px, line-height 1.2): workspace page titles.
- **Title** (weight 700, 20px): request detail and form section titles.
- **Body** (weight 500, 13px, line-height 1.45): explanatory and operational text.
- **Label** (weight 500, 12px): exact amounts, addresses and transaction identifiers; use tabular numerals where values align.
- **Micro-label** (weight 700, 10–11px): table headers and compact status labels; uppercase only for column/category labels.

**The Exact-Value Rule.** Wallet addresses, signatures and amounts use Geist Mono; explanatory copy remains in Manrope.

## Layout

At desktop widths, the workspace uses a 184px rail beside a floating main panel with 10px outer breathing room. The public landing uses a wide two-column hero, with copy and entry actions alongside the interactive paper-stack illustration, then explains the workflow, audience, limits and FAQs. The header is compact, and the main content uses a compact 24px page gutter. Requests use a searchable, filterable table with a contextual detail panel; payment review is a focused overlay. The typical request row is 70px high, with 57px detail headers and compact controls.

Workspace breakpoints adapt the list/detail view and navigation for narrow screens. The landing shifts from a two-column hero to a single-column composition below 850px, then tightens spacing and type at 640px and 370px. These are implementation breakpoints, not a claim of independent device QA.

## Elevation & Depth

Depth is tonal with a restrained ambient shadow: graphite separates the default workspace regions, while quiet borders organize tables and panels. On the landing, the paper stack has perspective and a cast shadow to explain sequence; this illustration is intentionally confined to the public page. Buttons and selected navigation can lift slightly through a soft shadow. Avoid dramatic card stacks or shadows that compete with payment evidence.

**The One-Workspace Rule.** Reserve the strongest elevation for the main work surface and transient payment review; ordinary rows stay flat.

## Shapes

Workspace controls use gently rounded corners (12px), request containers use 16px, and the floating workspace uses 18px. Landing-specific authored radii include 10–11px CTAs, a 19px demo frame, and 16px paper sheets; smaller status and step controls use compact 7–9px corners. Compact chips and navigation items may use 7–12px rounding according to their role. Borders stay thin and low contrast; status is conveyed with text and a small marker as well as color.

## Components

### Buttons
- **Character:** compact and task-oriented in the workspace; landing CTAs use larger touch targets and concise entry language.
- **Primary:** theme-aware sapphire fill; on graphite, use `#93b1ff` with dark text. Workspace buttons follow the selected appearance. Landing CTAs use 10–11px corners; workspace controls use 12px.
- **Secondary:** white or tonal surface, quiet border and ink text; use for supporting actions.
- **Hover / Focus:** deepen the primary surface slightly; retain a visible 2px sapphire keyboard focus outline with 2px offset.
- **Active / Reduced motion:** a subtle 1px press may be used; remove movement when reduced motion is requested.

### Chips
- **Style:** compact bordered pill with a small status dot and readable state text.
- **State:** green is verified paid, amber is pending/check needed, red is a failed check, and neutral is open or unchecked. Never rely on dot color alone.

### Cards / Containers
- **Corner Style:** 16px for request work areas and receipt containers; 18px for the outer workspace.
- **Background:** graphite by default; optional workspace light appearance uses cool white over cool ground with pale blue-gray secondary regions. The landing demo frame uses raised graphite, while paper sheets remain white.
- **Shadow Strategy:** one restrained ambient shadow on the outer work surface; use borders and tonal shifts inside.
- **Internal Padding:** generally 16–24px, tightening to 12–19px on narrow screens.

### Inputs / Fields
- **Style:** white or theme surface, quiet border, 12px corners and comfortable internal padding.
- **Focus:** sapphire border and a restrained outer focus halo; global keyboard focus stays clearly visible.
- **Error / Disabled:** show explicit error text and semantic red; disabled actions visibly lose emphasis and cannot imply progress.

### Navigation
- **Workspace:** compact rail with grouped labels and icon-led links; active location uses a raised theme surface and sapphire icon accent.
- **Landing:** public navigation anchors to how-it-works, audience and FAQ sections; entry actions lead through the `/app` wallet gate.
- **Mobile workspace:** becomes a horizontally scrollable top strip with a clear active underline. The rail can collapse on desktop.

### Public Landing and Paper-Stack Illustration
The public `/` surface is a persuasive product explanation for freelancers and small businesses already receiving crypto. It identifies the Devnet/test-SOL constraint, describes request, payer review and confirmed-payment matching, and offers entry through `/app`, where wallet connection gates the workspace. Connecting is described as distinct from signing or authorizing a payment.

The three CSS sheets are illustrative UI, not a transaction or evidence of customer activity. Horizontal dragging advances or reverses the sequence; a range input and labeled step buttons give keyboard-accessible equivalents. Reduced-motion preferences remove perspective and transitions and display one flat step at a time. Keep the sample amount explicitly illustrative and the Devnet limits visible.

### Payment Review and Match Proof
Payment review is a focused dialog. Lead with the SOL amount, then show payer, full receiving address, self-declared payee label, public description, live network fee, platform fee, total and wallet balance before the signature action. Place irreversible/public/Devnet cautions before signing. The “Why this matches” proof uses concise recipient, amount, request binding and confirmed-success rows, followed by transaction details. Do not describe the receipt as identity, delivery or invoice proof.

## Do's and Don'ts

### Do:
- **Do** use graphite dark mode as the default; honor a saved light appearance preference in the workspace if present. The public landing remains graphite-first.
- **Do** preserve the Órbita CRM reference lineage through Manrope, Geist Mono, restrained sapphire and compact operational hierarchy; treat the CRM as visual reference only.
- **Do** keep the payee label explicitly self-declared and show full wallet addresses where payment decisions require them.
- **Do** pair every status color with explicit status text.
- **Do** keep keyboard focus visible and honor reduced-motion preferences.

### Don't:
- **Don't** revive the rejected LINEITEM name, symbol or document-first visual direction.
- **Don't** invent a logo, customer data, activity, paid examples, token imagery or revenue counters.
- **Don't** style local records or submitted signatures as verified before successful chain checking.
- **Don't** use the CRM's code, assets or business data; it is a visual reference only.
- **Don't** let decoration outrank the recipient, exact amount, fee disclosure or match evidence.
