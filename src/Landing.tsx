import { useRef, useState } from 'react';
import type { CSSProperties, PointerEvent } from 'react';
import { ArrowDown, ArrowUpRight, Check } from 'lucide-react';
import './landing.css';

type Language = 'pt' | 'en';
type LandingProps = {
  language: Language;
  onLanguageChange: (language: Language) => void;
  onEnter: () => void;
  connected: boolean;
};

const copy = {
  pt: {
    navHow: 'Como funciona', navWho: 'Para quem', navFaq: 'Perguntas', enter: 'Entrar',
    devnet: 'Protótipo na Devnet · SOL de teste, sem valor econômico',
    titleA: 'Peça em cripto.', titleB: 'Confira o pagamento.',
    intro: 'Crie um pedido em SOL, compartilhe o link e veja se a transação corresponde exatamente ao que você cobrou. Um registro claro para quem trabalha por conta própria ou vende em pequena escala.',
    primary: 'Entrar e conectar carteira', primaryConnected: 'Abrir área de trabalho', secondary: 'Entender o fluxo',
    heroNote: 'Conectar a carteira não assina uma transação nem autoriza gastos.',
    demoLabel: 'Ilustração interativa · nenhum pagamento foi feito', demoInstruction: 'Arraste a peça ou selecione uma etapa',
    steps: ['Pedido', 'Revisão', 'Conferência'],
    sheet1Top: 'Pedido de pagamento', sheet1Title: 'Serviço de design', sheet1To: 'Destino', sheet1ToValue: 'Carteira informada por você', sheet1Action: 'Link para compartilhar',
    sheet2Top: 'Antes de assinar', sheet2Title: 'O pagador confere', sheet2To: 'Carteira de destino', sheet2ToValue: 'Endereço completo no produto', sheet2Fee: 'Taxa da rede', sheet2FeeValue: 'Exibida antes da assinatura', sheet2Action: 'A carteira pede a assinatura',
    sheet3Top: 'Depois do pagamento', sheet3Title: 'Por que corresponde?', sheet3Rows: ['Destino confere', 'Valor confere', 'Referência confere'], sheet3Action: 'Recibo e CSV com evidência',
    example: 'Valor ilustrativo',
    interludeA: 'Um link organiza a cobrança.', interludeB: 'A conferência organiza o depois.',
    interludeBody: 'Receber uma transferência é só metade do trabalho. Receivables liga cada pedido à evidência encontrada na rede para você saber o que conferir e o que exportar.',
    howTitle: 'Do pedido ao registro, sem adivinhar.',
    howIntro: 'O fluxo acompanha o pagamento; você continua no controle da carteira.',
    howRows: [
      { title: 'Crie e compartilhe', body: 'Defina valor em SOL, destino e descrição. O app cria a referência; você envia o link ou QR ao pagador. O nome do recebedor é informado por você.' },
      { title: 'O pagador revisa', body: 'Ele vê destino, valor e taxa de rede antes de assinar na própria carteira. A transferência acontece diretamente entre carteiras.' },
      { title: 'Confira a correspondência', body: 'A área de trabalho compara destino, valor e referência com a transação confirmada. Depois, você pode abrir um recibo verificável ou exportar CSV.' },
    ],
    whoTitle: 'Para quem já recebe cripto e precisa fechar a conta.',
    whoIntro: 'Feito para freelancers e pequenos negócios que cobram em SOL e querem deixar cada pedido rastreável.',
    whoExamples: ['Um trabalho entregue, um pedido com valor definido.', 'Uma venda, um link para compartilhar com o comprador.', 'Vários pedidos, uma lista para conferir e exportar.'],
    whoCaveat: 'Você precisa de uma carteira Solana. Esta versão usa apenas a Devnet, com SOL de teste.',
    trustTitle: 'Clareza também sobre os limites.',
    trustBody: 'Este é um protótipo em Devnet. SOL de teste não tem valor econômico; a rede pode ser reiniciada. Ainda não há evidência aqui de pagamentos reais ou uso por clientes.',
    trustList: ['Sem custódia: o app não guarda seus fundos.', 'Não converte para moeda fiduciária.', 'Recibos não são notas fiscais nem prova de entrega.', 'Nomes são autodeclarados; dados do link e do Memo são públicos.'],
    faqTitle: 'Perguntas frequentes',
    faqs: [
      { q: 'Preciso conectar a carteira para criar um pedido?', a: 'A área de trabalho usa sua carteira para definir o destino e operar o fluxo. Conectar a carteira, por si só, não assina pagamento nem concede permissão para gastar seus fundos. Os pedidos ficam salvos neste navegador; conectar a carteira não cria uma conta com sincronização entre dispositivos.' },
      { q: 'Como o pagamento é conferido?', a: 'O app compara o destinatário, o valor exato e a referência do pedido com a transação confirmada na Solana Devnet. Um registro salvo no navegador, sozinho, não é tratado como pagamento confirmado.' },
      { q: 'Quem paga precisa conectar a carteira?', a: 'Para assinar a transferência, sim. Antes disso, a tela de revisão mostra o valor, o destino e a taxa de rede. Um recibo compartilhado pode ser consultado sem conectar carteira.' },
      { q: 'Quanto custa?', a: 'O app não cobra taxa de plataforma nesta versão. Quem paga envia o valor pedido e a taxa da rede, estimada antes da assinatura. Tudo acontece na Devnet, com SOL de teste sem valor financeiro.' },
      { q: 'Isso substitui nota fiscal ou conta bancária?', a: 'Não. O recibo registra evidência da transferência em SOL; não é nota fiscal, não prova entrega e não faz conversão para moeda fiduciária.' },
    ],
    finalTitle: 'Pronto para organizar sua próxima cobrança em SOL de teste?', finalBody: 'Entre na área de trabalho, conecte sua carteira e crie um pedido na Devnet.',
    footerNote: 'Protótipo público · Solana Devnet', github: 'Código no GitHub', faucet: 'Obter SOL de teste', verify: 'Conferir comprovante',
  },
  en: {
    navHow: 'How it works', navWho: 'Who it’s for', navFaq: 'Questions', enter: 'Enter',
    devnet: 'Devnet prototype · test SOL has no economic value',
    titleA: 'Request crypto.', titleB: 'Check the payment.',
    intro: 'Create a SOL request, share a link, and see whether the transaction matches exactly what you asked for. A clear record for freelancers and small businesses.',
    primary: 'Enter and connect wallet', primaryConnected: 'Open workspace', secondary: 'See how it works',
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
    trustBody: 'This is a Devnet prototype. Test SOL has no economic value, and the network can reset. There is no evidence here of real payments or customer use yet.',
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
  },
} as const;

function PaymentScene({ language }: { language: Language }) {
  const [step, setStep] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const t = copy[language];
  const sampleAmount = language === 'pt' ? '0,25' : '0.25';

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

export default function Landing({ language, onLanguageChange, onEnter, connected }: LandingProps) {
  const t = copy[language];
  const cta = connected ? t.primaryConnected : t.primary;
  return (
    <div className="landing" lang={language === 'pt' ? 'pt-BR' : 'en'}>
      <header className="lp-header">
        <div className="lp-shell lp-header-inner">
          <a className="lp-wordmark" href="#inicio" aria-label="Receivables">Receivables<span className="lp-wordmark-dot">.</span></a>
          <nav className="lp-nav" aria-label={language === 'pt' ? 'Navegação principal' : 'Main navigation'}>
            <a href="#como-funciona">{t.navHow}</a><a href="#para-quem">{t.navWho}</a><a href="#perguntas">{t.navFaq}</a>
          </nav>
          <div className="lp-header-actions">
            <div className="lp-language" role="group" aria-label={language === 'pt' ? 'Idioma' : 'Language'}>
              <button type="button" onClick={() => onLanguageChange('pt')} aria-pressed={language === 'pt'}>PT</button>
              <button type="button" onClick={() => onLanguageChange('en')} aria-pressed={language === 'en'}>EN</button>
            </div>
            <button type="button" className="lp-header-enter" onClick={onEnter}>{t.enter}<ArrowUpRight aria-hidden="true" /></button>
          </div>
        </div>
      </header>

      <main id="inicio">
        <section className="lp-hero lp-shell" aria-labelledby="lp-title">
          <div className="lp-hero-copy">
            <h1 id="lp-title">{t.titleA}<br/><em>{t.titleB}</em></h1>
            <p className="lp-lead">{t.intro}</p>
            <p className="lp-devnet"><span aria-hidden="true" />{t.devnet}</p>
            <div className="lp-hero-actions"><button type="button" className="lp-button lp-button-primary" onClick={onEnter}>{cta}<ArrowUpRight aria-hidden="true" /></button><a className="lp-button lp-button-text" href="#como-funciona">{t.secondary}<ArrowDown aria-hidden="true" /></a></div>
            <p className="lp-hero-note">{t.heroNote}</p>
          </div>
          <PaymentScene language={language} />
        </section>

        <section className="lp-interlude" aria-labelledby="lp-interlude-title"><div className="lp-shell lp-interlude-inner"><h2 id="lp-interlude-title">{t.interludeA}<br/><span>{t.interludeB}</span></h2><p>{t.interludeBody}</p></div></section>

        <section id="como-funciona" className="lp-section lp-how lp-shell" aria-labelledby="lp-how-title">
          <div className="lp-section-intro"><h2 id="lp-how-title">{t.howTitle}</h2><p>{t.howIntro}</p></div>
          <div className="lp-how-list">{t.howRows.map((row, index) => <div className="lp-how-row" key={row.title}><span className="lp-how-number">0{index + 1}</span><h3>{row.title}</h3><p>{row.body}</p><span className="lp-how-line" aria-hidden="true"/></div>)}</div>
        </section>

        <section id="para-quem" className="lp-who" aria-labelledby="lp-who-title"><div className="lp-shell lp-who-inner"><div><h2 id="lp-who-title">{t.whoTitle}</h2><p className="lp-who-intro">{t.whoIntro}</p><p className="lp-who-caveat">{t.whoCaveat}</p></div><div className="lp-who-examples">{t.whoExamples.map((example) => <p key={example}>{example}</p>)}</div></div></section>

        <section className="lp-trust lp-shell" aria-labelledby="lp-trust-title"><div className="lp-trust-top"><h2 id="lp-trust-title">{t.trustTitle}</h2><p>{t.trustBody}</p></div><ul>{t.trustList.map((item) => <li key={item}>{item}</li>)}</ul></section>

        <section id="perguntas" className="lp-section lp-faq lp-shell" aria-labelledby="lp-faq-title"><h2 id="lp-faq-title">{t.faqTitle}</h2><div>{t.faqs.map(({ q, a }) => <details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></section>

        <section className="lp-final" aria-labelledby="lp-final-title"><div className="lp-shell lp-final-inner"><div><h2 id="lp-final-title">{t.finalTitle}</h2><p>{t.finalBody}</p></div><button type="button" className="lp-button lp-button-primary" onClick={onEnter}>{cta}<ArrowUpRight aria-hidden="true" /></button></div></section>
      </main>

      <footer className="lp-footer"><div className="lp-shell lp-footer-inner"><div><a className="lp-wordmark" href="#inicio">Receivables<span className="lp-wordmark-dot">.</span></a><p>{t.footerNote}</p></div><div className="lp-footer-links"><a href="/verify">{t.verify} <ArrowUpRight aria-hidden="true" /></a><a href="https://github.com/Miervolino06/solana-receivables" target="_blank" rel="noopener noreferrer">{t.github} <ArrowUpRight aria-hidden="true" /></a><a href="https://faucet.solana.com/" target="_blank" rel="noopener noreferrer">{t.faucet} <ArrowUpRight aria-hidden="true" /></a></div></div></footer>
    </div>
  );
}
