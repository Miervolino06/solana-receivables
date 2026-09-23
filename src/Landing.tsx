import { useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { ArrowDown, ArrowUpRight, Check } from 'lucide-react';
import './landing.css';

type LandingProps = {
  onEnter: () => void;
  connected: boolean;
};

const copy = {
  navHow: 'How it works', navWho: 'The proof', navFaq: 'Questions', enter: 'Enter',
  devnet: 'Devnet prototype · test SOL has no economic value',
  titleA: 'Request SOL.', titleB: 'Verify it arrived.',
  intro: 'A payment link for your work. A receipt you can check against the chain. Keep track of what clients actually paid, with the exact amount and destination accounted for.',
  primary: 'Enter and connect wallet', primaryConnected: 'Open workspace', secondary: 'Inspect the evidence',
  heroNote: 'Connecting a wallet does not sign a transaction or authorize spending.',
  demoLabel: 'Interactive illustration · no payment was made', demoInstruction: 'Drag the piece or select a step',
  steps: ['Request', 'Review', 'Match'],
  sheet1Top: 'Payment request', sheet1Title: 'Design service', sheet1To: 'Destination', sheet1ToValue: 'Wallet you provide', sheet1Action: 'Link ready to share',
  sheet2Top: 'Before signing', sheet2Title: 'The payer checks', sheet2To: 'Destination wallet', sheet2ToValue: 'Full address in the product', sheet2Fee: 'Network fee', sheet2FeeValue: 'Shown before signing', sheet2Action: 'Wallet requests signature',
  sheet3Top: 'After payment', sheet3Title: 'Why does it match?', sheet3Rows: ['Destination matches', 'Amount matches', 'Reference matches'], sheet3Action: 'Receipt and evidence CSV',
  example: 'Illustrative amount',
  interludeA: 'A link organizes the request.', interludeB: 'A match organizes what follows.',
  interludeBody: 'Receiving a transfer is only half the work. Receivables ties each request to evidence found onchain so you know what to check and export.',
  howTitle: 'From request to record, without guesswork.',
  howIntro: 'The flow follows the payment while you remain in control of your wallet.',
  howRows: [
    { title: 'Create and share', body: 'Set the SOL amount, destination, and description. The app creates a reference; you send the link or QR to the payer. You provide the recipient name yourself.' },
    { title: 'The payer reviews', body: 'They see the destination, amount, and network fee before signing in their own wallet. The transfer goes directly between wallets.' },
    { title: 'Check the match', body: 'The workspace compares destination, amount, and reference with the confirmed transaction. Then open a verifiable receipt or export CSV.' },
  ],
  whoTitle: 'For people already receiving crypto who need to close the loop.',
  whoIntro: 'Built for freelancers and small businesses charging in SOL who want every request to stay traceable.',
  whoExamples: ['One completed job, one request for a set amount.', 'One sale, one link to share with the buyer.', 'Many requests, one list to check and export.'],
  whoCaveat: 'You need a Solana wallet. This version only uses Devnet and test SOL.',
  trustTitle: 'The limits are clear, too.',
  trustBody: 'This version runs on Solana Devnet. It can send and verify test SOL, which has no economic value. Mainnet commercial payments are not available, and Devnet history can reset.',
  trustList: ['No custody: the app does not hold your funds.', 'No conversion to fiat currency.', 'Receipts are not tax invoices or proof of delivery.', 'Names are self-declared; link and Memo data are public.'],
  faqTitle: 'Frequently asked questions',
  faqs: [
    { q: 'Do I need to connect a wallet to create a request?', a: 'The workspace uses your wallet to set the destination and run the flow. Connecting alone does not sign a payment or grant spending permission. Requests are saved in this browser; connecting a wallet does not create an account that syncs across devices.' },
    { q: 'How is a payment checked?', a: 'The app compares the recipient, exact amount, and request reference with a confirmed Solana Devnet transaction. A browser record alone is never treated as a confirmed payment.' },
    { q: 'Does the payer need a wallet?', a: 'Yes, to sign the transfer. Before that, the review screen shows the amount, destination, and network fee. A shared receipt can be viewed without connecting a wallet.' },
    { q: 'What does it cost?', a: 'The app charges no platform fee in this version. The payer sends the requested amount plus the network fee, estimated before signing. Everything runs on Devnet, with test SOL that has no monetary value.' },
    { q: 'Does this replace an invoice or bank account?', a: 'No. The receipt records evidence of a SOL transfer; it is not a tax invoice, does not prove delivery, and does not convert to fiat currency.' },
  ],
  finalTitle: 'Ready to organize your next test SOL request?', finalBody: 'Enter the workspace, connect your wallet, and create a request on Devnet.',
  footerNote: 'Public prototype · Solana Devnet', github: 'Code on GitHub', faucet: 'Get test SOL', verify: 'Check a receipt',
} as const;

function PaymentScene() {
  const [step, setStep] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const t = copy;
  const sampleAmount = '0.25';

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointerStart.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = pointerStart.current;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    setDragX(Math.abs(dx) > Math.abs(dy) * 1.1 ? Math.max(-74, Math.min(74, dx)) : 0);
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = pointerStart.current;
    pointerStart.current = null;
    setDragging(false);
    setDragX(0);
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
    setStep((current) => Math.max(0, Math.min(2, current + (dx < 0 ? 1 : -1))));
  }

  return (
    <div className="lp-demo" aria-label={t.demoLabel}>
      <div className="lp-demo-head"><span>{t.demoLabel}</span><span className="lp-demo-dots" aria-hidden="true"><i/><i/><i/></span></div>
      <div className="lp-scene" data-step={step} data-dragging={dragging} style={{ '--lp-drag-x': `${dragX}px` } as CSSProperties} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => { pointerStart.current = null; setDragging(false); setDragX(0); }}>
        <div className="lp-scene-floor" aria-hidden="true" />
        <div className="lp-sheet lp-sheet-request" aria-hidden={step !== 0}>
          <div className="lp-sheet-top"><span>{t.sheet1Top}</span><span>Devnet</span></div>
          <div className="lp-sheet-title">{t.sheet1Title}</div>
          <div className="lp-sheet-amount-label">{t.example}</div>
          <div className="lp-sheet-amount">{sampleAmount} <span>SOL</span></div>
          <div className="lp-sheet-rule" />
          <div className="lp-sheet-field"><span>{t.sheet1To}</span><strong>{t.sheet1ToValue}</strong></div>
          <div className="lp-sheet-bottom">{t.sheet1Action}<span className="lp-sheet-arrow" aria-hidden="true"><ArrowUpRight /></span></div>
        </div>
        <div className="lp-sheet lp-sheet-review" aria-hidden={step !== 1}>
          <div className="lp-sheet-top"><span>{t.sheet2Top}</span><span>Devnet</span></div>
          <div className="lp-sheet-title">{t.sheet2Title}</div>
          <div className="lp-sheet-amount-label">{t.example}</div>
          <div className="lp-sheet-amount">{sampleAmount} <span>SOL</span></div>
          <div className="lp-sheet-rule" />
          <div className="lp-sheet-field"><span>{t.sheet2To}</span><strong>{t.sheet2ToValue}</strong></div>
          <div className="lp-sheet-field"><span>{t.sheet2Fee}</span><strong>{t.sheet2FeeValue}</strong></div>
          <div className="lp-sheet-bottom">{t.sheet2Action}<span className="lp-sheet-arrow" aria-hidden="true"><ArrowUpRight /></span></div>
        </div>
        <div className="lp-sheet lp-sheet-match" aria-hidden={step !== 2}>
          <div className="lp-sheet-top"><span>{t.sheet3Top}</span><span>Devnet</span></div>
          <div className="lp-sheet-title">{t.sheet3Title}</div>
          <div className="lp-sheet-amount-label">{t.example}</div>
          <div className="lp-sheet-amount">{sampleAmount} <span>SOL</span></div>
          <div className="lp-sheet-rule" />
          <div className="lp-match-lines">{t.sheet3Rows.map((row) => <div key={row}><span className="lp-check" aria-hidden="true"><Check /></span>{row}</div>)}</div>
          <div className="lp-sheet-bottom">{t.sheet3Action}<span className="lp-sheet-arrow" aria-hidden="true"><ArrowUpRight /></span></div>
        </div>
      </div>
      <div className="lp-demo-controls">
        <p>{t.demoInstruction}</p>
        <input className="lp-step-range" type="range" min="0" max="2" step="1" value={step} onChange={(event) => setStep(Number(event.target.value))} aria-label={t.demoInstruction} aria-valuetext={t.steps[step]} />
        <div className="lp-step-buttons" role="group" aria-label={t.demoInstruction}>
          {t.steps.map((label, index) => <button type="button" key={label} className={step === index ? 'is-active' : ''} aria-pressed={step === index} onClick={() => setStep(index)}><span>{index + 1}</span>{label}</button>)}
        </div>
      </div>
    </div>
  );
}

export default function Landing({ onEnter, connected }: LandingProps) {
  const t = copy;
  const cta = connected ? t.primaryConnected : t.primary;
  return (
    <div className="landing" lang="en">
      <header className="lp-header">
        <div className="lp-shell lp-header-inner">
          <a className="lp-wordmark" href="#top" aria-label="Receivables">Receivables<span className="lp-wordmark-dot">.</span></a>
          <nav className="lp-nav" aria-label="Main navigation">
            <a href="#how-it-works">{t.navHow}</a><a href="#the-proof">{t.navWho}</a><a href="#questions">{t.navFaq}</a>
          </nav>
          <div className="lp-header-actions">
            <button type="button" className="lp-header-enter" onClick={onEnter}>{t.enter}<ArrowUpRight aria-hidden="true" /></button>
          </div>
        </div>
      </header>

      <main id="top">
        <section className="lp-hero lp-shell" aria-labelledby="lp-title">
          <div className="lp-hero-copy">
            <h1 id="lp-title">{t.titleA}<br/><em>{t.titleB}</em></h1>
            <p className="lp-lead">{t.intro}</p>
            <p className="lp-devnet"><span aria-hidden="true" />{t.devnet}</p>
            <div className="lp-hero-actions"><button type="button" className="lp-button lp-button-primary" onClick={onEnter}>{cta}<ArrowUpRight aria-hidden="true" /></button><a className="lp-button lp-button-text" href="#the-proof">{t.secondary}<ArrowDown aria-hidden="true" /></a></div>
            <p className="lp-hero-note">{t.heroNote}</p>
          </div>
          <PaymentScene />
        </section>

        <section id="the-proof" className="lp-proof" aria-labelledby="lp-proof-title">
          <div className="lp-shell lp-proof-inner">
            <div className="lp-proof-copy"><h2 id="lp-proof-title">“Paid” needs<br/><em>evidence.</em></h2><p>A client sends a screenshot. You still need to know: did the right amount reach the right wallet, for this request?</p><p>Inspect a real 0.001 SOL Devnet payment approved in Phantom. The receipt rechecks its recipient, amount, signed request and balance changes against the chain.</p><a className="lp-button lp-button-primary" href="/demo">Recheck a real payment<ArrowUpRight aria-hidden="true" /></a><small>Confirmed on 23 September 2026. Test SOL only. No wallet needed to recheck.</small><a className="lp-button lp-button-text" href="/verify">Check your own receipt<ArrowUpRight aria-hidden="true" /></a></div>
            <div className="lp-proof-rules"><h3>What a receipt has to prove</h3><dl>
              <div><dt>Destination</dt><dd>The receiving wallet matches the request exactly.</dd></div>
              <div><dt>Amount</dt><dd>The recipient’s balance increased by the full requested amount.</dd></div>
              <div><dt>Original terms</dt><dd>The payer signed the same request, including its reference and description.</dd></div>
              <div><dt>Execution</dt><dd>The transaction succeeded, its signature is valid, and its instructions and balance changes match.</dd></div>
            </dl><div className="lp-proof-source"><span>Inspect the transaction. Download the record. Check it again.</span><a href="https://github.com/Miervolino06/solana-receivables/blob/codex/receivables/docs/PROOF.md" target="_blank" rel="noreferrer">How verification works<ArrowUpRight size={15} /></a></div></div>
          </div>
        </section>

        <section id="how-it-works" className="lp-section lp-how lp-shell" aria-labelledby="lp-how-title">
          <div className="lp-section-intro"><h2 id="lp-how-title">{t.howTitle}</h2><p>{t.howIntro}</p></div>
          <div className="lp-how-list">{t.howRows.map((row, index) => <div className="lp-how-row" key={row.title}><span className="lp-how-number">0{index + 1}</span><h3>{row.title}</h3><p>{row.body}</p><span className="lp-how-line" aria-hidden="true"/></div>)}</div>
        </section>

        <section id="who-its-for" className="lp-who" aria-labelledby="lp-who-title"><div className="lp-shell lp-who-inner"><div><h2 id="lp-who-title">{t.whoTitle}</h2><p className="lp-who-intro">{t.whoIntro}</p><p className="lp-who-caveat">{t.whoCaveat}</p></div><div className="lp-who-examples">{t.whoExamples.map((example) => <p key={example}>{example}</p>)}</div></div></section>

        <section className="lp-trust lp-shell" aria-labelledby="lp-trust-title"><div className="lp-trust-top"><h2 id="lp-trust-title">{t.trustTitle}</h2><p>{t.trustBody}</p></div><ul>{t.trustList.map((item) => <li key={item}>{item}</li>)}</ul></section>

        <section id="questions" className="lp-section lp-faq lp-shell" aria-labelledby="lp-faq-title"><h2 id="lp-faq-title">{t.faqTitle}</h2><div>{t.faqs.map(({ q, a }) => <details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></section>

        <section className="lp-final" aria-labelledby="lp-final-title"><div className="lp-shell lp-final-inner"><div><h2 id="lp-final-title">{t.finalTitle}</h2><p>{t.finalBody}</p></div><button type="button" className="lp-button lp-button-primary" onClick={onEnter}>{cta}<ArrowUpRight aria-hidden="true" /></button></div></section>
      </main>

      <footer className="lp-footer"><div className="lp-shell lp-footer-inner"><div><a className="lp-wordmark" href="#top">Receivables<span className="lp-wordmark-dot">.</span></a><p>{t.footerNote}</p></div><div className="lp-footer-links"><a href="/verify">{t.verify} <ArrowUpRight aria-hidden="true" /></a><a href="https://github.com/Miervolino06/solana-receivables" target="_blank" rel="noopener noreferrer">{t.github} <ArrowUpRight aria-hidden="true" /></a><a href="https://faucet.solana.com/" target="_blank" rel="noopener noreferrer">{t.faucet} <ArrowUpRight aria-hidden="true" /></a></div></div></footer>
    </div>
  );
}
