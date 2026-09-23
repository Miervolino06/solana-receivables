import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { ArrowLeft, ArrowRight, ExternalLink, LoaderCircle, Wallet } from 'lucide-react';
import Landing from './Landing';
import { resolveSurface } from './navigation';
import './entry.css';

const Workspace = lazy(() => import('./App'));
type Language = 'pt' | 'en';

const copy = {
  pt: {
    back: 'Voltar ao site', title: 'Sua carteira. Seu espaço de cobranças.',
    intro: 'Conecte uma carteira Solana para abrir o painel e criar sua primeira cobrança de teste.',
    connect: 'Escolher carteira', selected: 'Conectar', connecting: 'Aguardando a carteira…', change: 'Escolher outra carteira',
    note: 'Conectar mostra seu endereço público ao app. Não envia SOL, não assina pagamentos e não autoriza gastos.',
    local: 'Suas cobranças ficam neste navegador, sem sincronização entre dispositivos. Conectar outra carteira não esconde os registros salvos aqui.',
    devnet: 'Esta versão usa Solana Devnet: uma rede de testes, com SOL sem valor financeiro.',
    step1: 'Escolha sua carteira', step2: 'Confirme a conexão nela', step3: 'Crie e compartilhe sua cobrança',
    help: 'Não apareceu uma carteira?', helpBody: 'Use um navegador com uma carteira Solana instalada ou abra este site no navegador da sua carteira no celular. Você pode conhecer o produto sem instalar nada.',
    declined: 'A conexão não foi concluída. Desbloqueie sua carteira e tente novamente, ou escolha outra.',
    loading: 'Abrindo seu espaço…', faucet: 'Obter SOL de teste', verify: 'Conferir um comprovante sem conectar',
  },
  en: {
    back: 'Back to the website', title: 'Your wallet. Your payment workspace.',
    intro: 'Connect a Solana wallet to open the workspace and create your first test payment request.',
    connect: 'Choose a wallet', selected: 'Connect', connecting: 'Waiting for your wallet…', change: 'Choose another wallet',
    note: 'Connecting shares your public address with the app. It does not send SOL, sign a payment or approve spending.',
    local: 'Requests stay in this browser, with no cross-device sync. Connecting another wallet does not hide records saved here.',
    devnet: 'This version uses Solana Devnet: a test network with SOL that has no monetary value.',
    step1: 'Choose your wallet', step2: 'Approve the connection in it', step3: 'Create and share a request',
    help: 'No wallet appeared?', helpBody: 'Use a browser with a Solana wallet installed, or open this site in your mobile wallet’s browser. You can explore the product without installing anything.',
    declined: 'The wallet did not connect. Unlock it and try again, or choose another wallet.',
    loading: 'Opening your workspace…', faucet: 'Get test SOL', verify: 'Check a receipt without connecting',
  },
};

function ConnectGate({ language, onHome }: { language: Language; onHome: () => void }) {
  const wallet = useWallet();
  const { visible, setVisible } = useWalletModal();
  const connectButton = useRef<HTMLButtonElement>(null);
  const modalWasOpen = useRef(false);
  const [error, setError] = useState(false);
  const text = copy[language];
  async function connect() {
    setError(false);
    if (!wallet.wallet) { setVisible(true); return; }
    try { await wallet.connect(); } catch { setError(true); }
  }
  useEffect(() => { setError(false); }, [wallet.wallet]);
  useEffect(() => {
    if (!visible) {
      if (modalWasOpen.current) connectButton.current?.focus();
      modalWasOpen.current = false;
      return;
    }
    modalWasOpen.current = true;
    // The upstream selector traps Tab but does not move focus into its portal.
    const frame = requestAnimationFrame(() => {
      const close = document.querySelector<HTMLButtonElement>('.wallet-adapter-modal-button-close');
      close?.setAttribute('aria-label', language === 'pt' ? 'Fechar seleção de carteira' : 'Close wallet selection');
      const title = document.querySelector('.wallet-adapter-modal-title');
      if (title) title.id = 'wallet-adapter-modal-title';
      close?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [visible, language]);
  return <div className="entry-page">
    <header className="entry-header"><button className="entry-wordmark" onClick={onHome}>Receivables</button><span>Solana Devnet</span></header>
    <main className="entry-main">
      <button className="entry-back" onClick={onHome}><ArrowLeft size={17} /> {text.back}</button>
      <div className="entry-layout">
        <section className="entry-intro"><h1>{text.title}</h1><p>{text.intro}</p><ol><li>{text.step1}</li><li>{text.step2}</li><li>{text.step3}</li></ol><p className="entry-test-note">{text.devnet}</p></section>
        <section className="entry-connection" aria-label={text.connect}>
          <Wallet className="entry-wallet-icon" size={28} strokeWidth={1.5} />
          <h2>{wallet.wallet ? wallet.wallet.adapter.name : text.connect}</h2>
          <p>{text.note}</p>
          <button ref={connectButton} className="entry-connect" onClick={() => void connect()} disabled={wallet.connecting}>
            {wallet.connecting ? <><LoaderCircle size={18} className="entry-spinner" />{text.connecting}</> : <>{wallet.wallet ? text.selected + ' ' + wallet.wallet.adapter.name : text.connect}<ArrowRight size={18} /></>}
          </button>
          {wallet.wallet && <button className="entry-change" disabled={wallet.connecting} onClick={() => { setError(false); setVisible(true); }}>{text.change}</button>}
          {error && <p className="entry-error" role="alert">{text.declined}</p>}
          <details><summary>{text.help}</summary><p>{text.helpBody}</p></details>
          <p className="entry-storage">{text.local}</p>
          <a href="https://faucet.solana.com/" target="_blank" rel="noreferrer">{text.faucet}<ExternalLink size={14} /></a>
        </section>
      </div>
      <a className="entry-verify" href="/verify">{text.verify}<ArrowRight size={16} /></a>
    </main>
  </div>;
}

export default function Root() {
  const wallet = useWallet();
  const [navigation, setNavigation] = useState(0);
  const [language, setLanguage] = useState<Language>(() => {
    try { return localStorage.getItem('receivables-language') === 'en' ? 'en' : 'pt'; } catch { return 'pt'; }
  });
  // The workspace replaces the URL as a request becomes a receipt. Read that
  // current URL on wallet changes too, so shared proofs remain public.
  const current = new URL(location.href);
  const surface = resolveSurface(current.pathname, current.search, wallet.connected && Boolean(wallet.publicKey));
  const previousScreen = useRef({ surface, navigation });
  useEffect(() => {
    const previous = previousScreen.current;
    previousScreen.current = { surface, navigation };
    if (previous.surface === surface && previous.navigation === navigation) return;
    // Lazy workspace content can arrive after the route has already changed.
    const focusHeading = () => {
      const heading = document.querySelector<HTMLElement>('main h1');
      if (!heading) return false;
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
      return true;
    };
    const observer = new MutationObserver(() => { if (focusHeading()) observer.disconnect(); });
    const frame = requestAnimationFrame(() => {
      if (!focusHeading()) observer.observe(document.getElementById('root')!, { childList: true, subtree: true });
    });
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [surface, navigation]);
  useEffect(() => {
    const update = () => setNavigation(value => value + 1);
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  useEffect(() => {
    document.documentElement.lang = surface === 'workspace' || surface === 'public' ? 'en' : language === 'pt' ? 'pt-BR' : 'en';
    document.title = surface === 'connect' ? 'Receivables — ' + copy[language].connect
      : surface === 'landing' ? language === 'pt' ? 'Receivables — Cobranças em SOL, pagamentos conferidos' : 'Receivables — SOL payment links with verifiable receipts'
      : 'Receivables — Requests and verified receipts';
  }, [surface, language]);
  function navigate(path: string) {
    history.pushState(null, '', path);
    setNavigation(value => value + 1);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function changeLanguage(next: Language) {
    setLanguage(next);
    try { localStorage.setItem('receivables-language', next); } catch { /* Language works for this visit without storage. */ }
  }
  if (surface === 'landing') return <Landing language={language} onLanguageChange={changeLanguage} onEnter={() => navigate('/app')} connected={wallet.connected} />;
  if (surface === 'connect') return <ConnectGate language={language} onHome={() => navigate('/')} />;
  return <Suspense fallback={<div className="entry-loading" role="status"><LoaderCircle size={22} className="entry-spinner" />{copy[language].loading}</div>}>
    <Workspace key={navigation} publicAccess={surface === 'public'} initialPage={current.pathname.startsWith('/verify') ? 'verify' : 'requests'} onHome={() => navigate('/')} onWorkspace={() => navigate('/app')} onVerify={() => navigate('/verify')} />
  </Suspense>;
}
