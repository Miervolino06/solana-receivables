---
name: Receivables
description: A compact light workspace for payment requests and verified receipts.
colors:
  sapphire: "#345ed3"
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
  card: "16px"
  workspace: "18px"
spacing:
  compact: "8px"
  standard: "16px"
  spacious: "24px"
components:
  button-primary:
    backgroundColor: "{colors.sapphire}"
    textColor: "{colors.cool-white}"
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

Receivables is a practical workspace where a payment request becomes an operational record and a verified chain transaction becomes evidence. Its visual authority is the user's current Órbita CRM: Manrope, Geist Mono, cool light surfaces, sapphire actions, a compact navigation rail and a floating work area. Órbita is a visual reference only; no CRM code, assets or business data were copied.

The interface favors clear labels, dense useful rows and calm surfaces over a promotional hero. Payment review and transaction proof receive the strongest hierarchy because a payer must understand destination, amount, fee and public details before signing. Receivables is a neutral working name; no logo or brand mark is implied.

**Key Characteristics:**
- Compact operational hierarchy with a persistent navigation rail.
- Sapphire marks actions and links; status colors carry verified, pending and error meaning.
- Manrope carries interface text; Geist Mono distinguishes addresses and exact amounts.
- The request and its evidence remain the visual center.

## Colors

Cool white and pale blue-gray surfaces hold the workspace; sapphire is the single strong action accent. Status colors remain semantic and restrained.

### Primary
- **Sapphire** (`{colors.sapphire}`): primary actions, links, focus indication and selected navigation accents.

### Neutral
- **Cool white** (`{colors.cool-white}`): main work surface and controls.
- **Cool ground** (`{colors.cool-ground}`): page background around the floating workspace.
- **Cool surface** (`{colors.cool-surface}`): navigation rail and secondary surfaces.
- **Ink** (`{colors.ink}`): headings and primary content.
- **Muted ink** (`{colors.muted-ink}`): supporting labels and secondary content.
- **Quiet line** (`{colors.line}`): component boundaries and row separators.

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
- **Headline** (weight 750, 26px, line-height 1.2): page titles.
- **Title** (weight 700, 20px): request detail and form section titles.
- **Body** (weight 500, 13px, line-height 1.45): explanatory and operational text.
- **Label** (weight 500, 12px): exact amounts, addresses and transaction identifiers; use tabular numerals where values align.
- **Micro-label** (weight 700, 10–11px): table headers and compact status labels; uppercase only for column/category labels.

**The Exact-Value Rule.** Wallet addresses, signatures and amounts use Geist Mono; explanatory copy remains in Manrope.

## Layout

At desktop widths, a 184px rail anchors the workspace beside a floating main panel with 10px outer breathing room. The header is compact, and the main content uses a compact 24px page gutter. Requests use a searchable, filterable table with a contextual detail panel; payment review is a focused overlay. The typical request row is 70px high, with 57px detail headers and compact controls.

At widths below 960px, an open detail replaces the list in the available content area and the rail narrows. At 700px and below, navigation becomes a horizontal top strip, the main panel loses its outer radius and shadow, and request rows become a reduced two-column composition that preserves payee, amount and status. At 460px, header and amount details tighten further. Shared request review uses a centered, narrow reading column on desktop and a full-width mobile flow. The layout was visually reviewed at 1440×934 and 390px widths.

## Elevation & Depth

Depth is tonal with a restrained ambient shadow: the page ground separates the floating white workspace, while quiet borders organize tables and panels. Buttons and selected navigation can lift slightly through a soft shadow. Avoid dramatic card stacks or shadows that compete with payment evidence.

**The One-Workspace Rule.** Reserve the strongest elevation for the main work surface and transient payment review; ordinary rows stay flat.

## Shapes

Controls use gently rounded corners (12px), request containers use 16px, and the floating workspace uses 18px. Compact chips and navigation items may use 7–12px rounding according to their role. Borders stay thin and low contrast; status is conveyed with text and a small marker as well as color.

## Components

### Buttons
- **Character:** compact and task-oriented, with clear contrast and minimal label length.
- **Primary:** sapphire fill with white text, 12px corners and 12px horizontal padding; use for create, verify and payment continuation.
- **Secondary:** white or tonal surface, quiet border and ink text; use for supporting actions.
- **Hover / Focus:** deepen the primary surface slightly; retain a visible 2px sapphire keyboard focus outline with 2px offset.
- **Active / Reduced motion:** a subtle 1px press may be used; remove movement when reduced motion is requested.

### Chips
- **Style:** compact bordered pill with a small status dot and readable state text.
- **State:** green is verified paid, amber is pending/check needed, red is a failed check, and neutral is open or unchecked. Never rely on dot color alone.

### Cards / Containers
- **Corner Style:** 16px for request work areas and receipt containers; 18px for the outer workspace.
- **Background:** cool white over cool ground, with pale blue-gray for secondary regions.
- **Shadow Strategy:** one restrained ambient shadow on the outer work surface; use borders and tonal shifts inside.
- **Internal Padding:** generally 16–24px, tightening to 12–19px on narrow screens.

### Inputs / Fields
- **Style:** white or theme surface, quiet border, 12px corners and comfortable internal padding.
- **Focus:** sapphire border and a restrained outer focus halo; global keyboard focus stays clearly visible.
- **Error / Disabled:** show explicit error text and semantic red; disabled actions visibly lose emphasis and cannot imply progress.

### Navigation
- **Style:** compact rail with grouped labels and icon-led links; active location uses a soft raised white surface and sapphire icon accent.
- **Mobile:** becomes a horizontally scrollable top strip with a clear active underline. The rail can collapse on desktop.

### Payment Review and Match Proof
Payment review is a focused dialog. Lead with the SOL amount, then show payer, full receiving address, self-declared payee label, public description, live network fee, platform fee, total and wallet balance before the signature action. Place irreversible/public/Devnet cautions before signing. The “Why this matches” proof uses concise recipient, amount, request binding and confirmed-success rows, followed by transaction details. Do not describe the receipt as identity, delivery or invoice proof.

## Do's and Don'ts

### Do:
- **Do** use the current cool white, blue-gray and sapphire palette as the default light appearance.
- **Do** preserve Manrope for interface reading and Geist Mono for exact values.
- **Do** keep the payee label explicitly self-declared and show full wallet addresses where payment decisions require them.
- **Do** pair every status color with explicit status text.
- **Do** keep keyboard focus visible and honor reduced-motion preferences.

### Don't:
- **Don't** revive the rejected LINEITEM name, symbol or document-first visual direction.
- **Don't** invent a logo, customer data, activity, paid examples, token imagery or revenue counters.
- **Don't** style local records or submitted signatures as verified before successful chain checking.
- **Don't** use the CRM's code, assets or business data; it is a visual reference only.
- **Don't** let decoration outrank the recipient, exact amount, fee disclosure or match evidence.
