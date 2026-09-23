import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  Activity, ArrowDownToLine, ArrowRight, ArrowUpRight, Check, CheckCircle2,
  ChevronRight, Copy, ExternalLink, FileCheck2, FilePlus2, ListFilter,
  LoaderCircle, Moon, PanelLeftClose, PanelLeftOpen, Plus, QrCode, RefreshCw, Search,
  ShieldCheck, Sun, Wallet, X,
} from 'lucide-react';
import QRCode from 'qrcode';
import ProofDesk from './ProofDesk';
import ReceiptEvidence from './ReceiptEvidence';
import {
  PendingPaymentError, FailedPaymentError, createRequest, decodeRequest, encodeRequest,
  explorerUrl, fetchPaymentReceipt, findPayment, formatSol, preparePayment,
  receiptUrl, requestUrl, sendPayment, shortAddress,
  type PaymentReceipt, type PaymentRequest, type PreparedPayment,
} from './payments';
import {
  readWorkspace, saveWorkspace, upsertEntry, reconcileRequests, summarizeWorkspace,
  workspaceCsv, verifiedReceiptCheck, type WorkspaceEntry, type CheckState,
} from './workspace';

type Page = 'requests' | 'activity' | 'verify';
type Panel = 'none' | 'detail' | 'create';
type Filter = 'all' | 'open' | 'paid' | 'pending' | 'unchecked';
type Phase = 'idle' | 'checking' | 'preparing' | 'review' | 'signing' | 'confirming';
type Draft = { label: string; recipient: string; amount: string; description: string };
const EMPTY: Draft = { label: '', recipient: '', amount: '', description: '' };
function message(cause: unknown): string {
  if (cause instanceof PendingPaymentError) return 'Transaction submitted; confirmation is uncertain. Check this signature before paying again.';
  if (cause instanceof FailedPaymentError) return 'The transaction failed. Inspect the signature before trying again.';
  if (cause instanceof Error) return /reject|declin|cancel/i.test(cause.message) ? 'Wallet signature declined. No payment was submitted.' : cause.message;
  return 'Could not complete this action. Check your connection and try again.';
}
function date(iso: string) { return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(iso)); }
function chainDate(seconds: number | null) { return seconds === null ? 'Block time unavailable' : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(seconds * 1000)) + ' UTC'; }
function sol(lamports: string | bigint) { return formatSol(BigInt(lamports)); }
function parseLink(input: string) {
  if (!input.trim()) throw Error('Paste a request or receipt link first.');
  let url: URL;
  try { url = new URL(input.trim(), location.origin); } catch { throw Error('The link is not a valid URL.'); }
  const encoded = url.searchParams.get('r');
  if (!encoded) throw Error('This link does not contain a payment request (?r=).');
  return { request: decodeRequest(encoded), signature: url.searchParams.get('tx') };
}
function Address({ value }: { value: string }) { return <span className="address" title={value}>{value}</span>; }
function Detail({ label, children }: { label: string; children: React.ReactNode }) { return <div className="detail-row"><dt>{label}</dt><dd>{children}</dd></div>; }
function Status({ state, pending }: { state?: CheckState; pending?: string }) {
  const status = state?.status || (pending ? 'pending' : 'unchecked');
  const label = status === 'paid' ? 'Verified paid' : status === 'open' ? 'No payment found' : status === 'pending' ? 'Needs check' : status === 'error' ? 'Check failed' : 'Not checked';
  return <span className={'status-pill status-' + status}><i />{label}</span>;
}

type AppProps = { publicAccess?: boolean; initialPage?: Page; onHome?: () => void; onWorkspace?: () => void; onVerify?: () => void };
export default function App({ publicAccess = false, initialPage = 'requests', onHome, onWorkspace, onVerify }: AppProps) {
  const wallet = useWallet();
  const initial = useMemo(() => {
    const params = new URLSearchParams(location.search), encoded = params.get('r');
    if (!encoded) return { request: null as PaymentRequest | null, signature: null as string | null, error: '' };
    try { return { request: decodeRequest(encoded), signature: params.get('tx'), error: '' }; }
    catch (cause) { return { request: null, signature: null, error: message(cause) }; }
  }, []);
  const [page, setPage] = useState<Page>(initial.error ? 'verify' : initialPage);
  const [panel, setPanel] = useState<Panel>(initial.request ? 'detail' : 'none');
  const [focusedLink, setFocusedLink] = useState(Boolean(initial.request));
  const previousFocus = useRef<HTMLElement | null>(null);
  const [sidebarClosed, setSidebarClosed] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try { return localStorage.getItem('receivables-theme') === 'light' ? 'light' : 'dark'; }
    catch { return 'dark'; }
  });
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [request, setRequest] = useState<PaymentRequest | null>(initial.request);
  const [prepared, setPrepared] = useState<PreparedPayment | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState(initial.error);
  const [notice, setNotice] = useState('');
  const [storageError, setStorageError] = useState('');
  const [saved, setSaved] = useState<WorkspaceEntry[]>(() => readWorkspace().items);
  const savedRef = useRef(saved);
  const [checks, setChecks] = useState<Record<string, CheckState>>({});
  const [reconciling, setReconciling] = useState(false);
  const [reconcileDone, setReconcileDone] = useState(0);
  const reconcileAbort = useRef<AbortController | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [pendingSignature, setPendingSignature] = useState<string | null>(null);
  const [ack, setAck] = useState(false);
  const [copied, setCopied] = useState<'request' | 'receipt' | 'action' | null>(null);
  const [verifyInput, setVerifyInput] = useState('');
  const [verifySignature, setVerifySignature] = useState('');
  const [qrOpen, setQrOpen] = useState(false);
  const [qr, setQr] = useState('');
  const op = useRef(0);
  const busy = phase === 'checking' || phase === 'preparing' || phase === 'signing' || phase === 'confirming';
  const encoded = request ? encodeRequest(request) : '';
  const matchedCheck = request ? verifiedReceiptCheck(request, checks[encoded]) : null;
  const receipt = matchedCheck?.receipt || null;
  const requestLink = request ? requestUrl(request) : '';
  const proofLink = request && receipt ? receiptUrl(request, receipt.signature) : '';
  const actionLink = request && location.protocol === 'https:' ? 'solana-action:' + encodeURIComponent(new URL('/api/pay?r=' + encoded, location.origin).href) : '';
  const summary = useMemo(() => summarizeWorkspace(saved, checks), [saved, checks]);
  const rows = useMemo(() => saved.map(entry => ({ entry, request: decodeRequest(entry.encoded), check: checks[entry.encoded] })), [saved, checks]);
  const visibleRows = useMemo(() => rows.filter(row => {
    const query = search.trim().toLocaleLowerCase();
    const matches = !query || [row.request.label, row.request.description, row.request.recipient, row.request.reference].some(value => value.toLocaleLowerCase().includes(query));
    const state = row.check?.status || (row.entry.pendingSignature ? 'pending' : 'unchecked');
    return matches && (filter === 'all' || state === filter);
  }), [rows, search, filter]);
  const activityRows = useMemo(() => rows.filter(row => row.check?.status === 'paid' && row.check.receipt).sort((a, b) => (b.check?.receipt?.blockTime || 0) - (a.check?.receipt?.blockTime || 0)), [rows]);

  const persist = useCallback((entry: WorkspaceEntry) => {
    const next = upsertEntry(savedRef.current, entry);
    savedRef.current = next;
    setSaved(next);
    setStorageError(saveWorkspace(next));
  }, []);
  const showReceipt = useCallback((found: PaymentReceipt) => {
    const key = encodeRequest(found.request);
    setRequest(found.request); setPrepared(null); setPendingSignature(null);
    setPhase('idle'); setError(''); setNotice('Confirmed transaction verified against this request.');
    setChecks(current => ({ ...current, [key]: { encoded: key, status: 'paid', receipt: found, checkedAt: Date.now() } }));
    persist({ encoded: key, signature: found.signature });
    history.replaceState(null, '', receiptUrl(found.request, found.signature));
  }, [persist]);
  const verifyTx = useCallback(async (item: PaymentRequest, signature: string) => {
    const id = ++op.current, key = encodeRequest(item);
    setPhase('checking'); setError(''); setNotice('');
    setChecks(current => { const next = { ...current }; delete next[key]; return next; });
    try { const found = await fetchPaymentReceipt(signature, item); if (id === op.current) showReceipt(found); }
    catch (cause) {
      if (id !== op.current) return;
      setPhase('idle'); setError(message(cause));
      setChecks(current => ({ ...current, [key]: { encoded: key, status: savedRef.current.find(entry => entry.encoded === key)?.pendingSignature ? 'pending' : 'error', checkedAt: Date.now(), error: message(cause) } }));
    }
  }, [showReceipt]);
  useEffect(() => { const issue = readWorkspace().error; if (issue) setStorageError(issue); }, []);
  useEffect(() => {
    if (!initial.request) return;
    const key = encodeRequest(initial.request);
    const entry = savedRef.current.find(item => item.encoded === key);
    if (entry?.pendingSignature) setPendingSignature(entry.pendingSignature);
    if (initial.signature) void verifyTx(initial.request, initial.signature);
    else if (entry?.signature) void verifyTx(initial.request, entry.signature);
  }, [initial.request, initial.signature, verifyTx]);
  useEffect(() => {
    if (!requestLink || !qrOpen) { setQr(''); return; }
    let live = true;
    void QRCode.toDataURL(requestLink, { width: 480, margin: 1, errorCorrectionLevel: 'L', color: { dark: '#171717', light: '#ffffff' } }).then(value => { if (live) setQr(value); }).catch(() => { if (live) setError('QR generation failed. Copy the link instead.'); });
    return () => { live = false; };
  }, [requestLink, qrOpen]);
  useEffect(() => () => reconcileAbort.current?.abort(), []);
  useEffect(() => {
    if (phase !== 'review') return;
    const dialog = document.querySelector<HTMLElement>('.review-panel');
    const close = dialog?.querySelector<HTMLButtonElement>('.close-review');
    close?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setPhase('idle'); setPrepared(null); return; }
      if (event.key !== 'Tab' || !dialog) return;
      const controls = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), a[href]')];
      const first = controls[0], last = controls[controls.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);
  useEffect(() => {
    if (panel === 'none') return;
    const close = document.querySelector<HTMLElement>('.detail-panel .panel-top button');
    close?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !document.querySelector('.review-panel')) {
        setPanel('none');
        setFocusedLink(false);
        requestAnimationFrame(() => previousFocus.current?.focus());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel, encoded]);
  useEffect(() => {
    if (!request || panel !== 'detail' || phase !== 'idle') return;
    const key = encodeRequest(request), verified = checks[key];
    if (verified?.status !== 'paid' || !verified.receipt) return;
    setPendingSignature(null);
    history.replaceState(null, '', receiptUrl(request, verified.receipt.signature));
  }, [request, panel, phase, checks, receipt]);

  function navigate(next: Page) {
    if (phase === 'signing' || phase === 'confirming') return;
    if (publicAccess && next === 'verify' && onVerify) { onVerify(); return; }
    if (publicAccess && next !== 'verify' && onWorkspace) { onWorkspace(); return; }
    ++op.current;
    setPage(next); setPanel('none'); setError(''); setNotice(''); setPrepared(null); setPhase('idle'); setQrOpen(false);
    setFocusedLink(false);
    history.replaceState(null, '', location.pathname);
  }
  function openCreate() {
    if (phase === 'signing' || phase === 'confirming') return;
    if (publicAccess && onWorkspace) { onWorkspace(); return; }
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    ++op.current;
    setPage('requests'); setPanel('create'); setFocusedLink(false);
    setError(''); setNotice(''); setPrepared(null); setPhase('idle');
    history.replaceState(null, '', location.pathname);
  }
  function closePanel() {
    if (phase === 'signing' || phase === 'confirming') return;
    if (publicAccess && onHome) { onHome(); return; }
    setPanel('none'); setFocusedLink(false);
    requestAnimationFrame(() => previousFocus.current?.focus());
  }
  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try { localStorage.setItem('receivables-theme', next); }
    catch { setStorageError('This browser could not save your appearance preference.'); }
  }
  function open(item: PaymentRequest, signature?: string | null, searchReference = false) {
    if (phase === 'signing' || phase === 'confirming') return;
    ++op.current;
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const key = encodeRequest(item), entry = savedRef.current.find(value => value.encoded === key);
    setRequest(item); setPanel('detail'); setPrepared(null); setPhase('idle'); setAck(false);
    setFocusedLink(false);
    setError(''); setNotice(''); setQrOpen(false); setPendingSignature(entry?.pendingSignature || null);
    history.replaceState(null, '', signature ? receiptUrl(item, signature) : requestUrl(item));
    if (searchReference) { void checkFoundFor(item); return; }
    const prior = checks[key];
    if (prior?.status === 'paid' && prior.receipt && !signature) return;
    const toCheck = signature || entry?.pendingSignature || entry?.signature;
    if (toCheck) void verifyTx(item, toCheck);
  }
  function edit(field: keyof Draft, value: string) {
    if (field === 'label' && new TextEncoder().encode(value).length > 40) return;
    if (field === 'description' && new TextEncoder().encode(value).length > 120) return;
    setDraft(current => ({ ...current, [field]: value })); setError('');
  }
  function create() {
    try {
      const made = createRequest(draft);
      persist({ encoded: encodeRequest(made) });
      open(made);
      setDraft(EMPTY); setNotice('Request saved locally. Share its link to invite payment.');
    } catch (cause) { setError(message(cause)); }
  }
  async function copy(kind: 'request' | 'receipt' | 'action') {
    const value = kind === 'receipt' ? proofLink : kind === 'action' ? actionLink : requestLink;
    if (!value) return;
    try { await navigator.clipboard.writeText(value); setCopied(kind); setTimeout(() => setCopied(null), 2000); }
    catch { setError('Copy failed. Select the link field to copy it manually.'); }
  }
  async function checkPayment() { if (request) await checkFoundFor(request); }
  async function refreshAll() {
    if (reconciling || savedRef.current.length === 0) return;
    reconcileAbort.current?.abort();
    const controller = new AbortController(); reconcileAbort.current = controller;
    const list = [...savedRef.current];
    setChecks({}); setReconcileDone(0); setReconciling(true); setError(''); setNotice('');
    try {
      await reconcileRequests(list, result => {
        setChecks(current => ({ ...current, [result.encoded]: result }));
        setReconcileDone(current => current + 1);
        if (result.status === 'paid' && result.receipt) {
          persist({ encoded: result.encoded, signature: result.receipt.signature });
        }
      }, { signal: controller.signal });
      if (!controller.signal.aborted) setNotice('Checked ' + list.length + (list.length === 1 ? ' request.' : ' requests.'));
    } catch (cause) { if (!controller.signal.aborted) setError(message(cause)); }
    finally { if (!controller.signal.aborted) setReconciling(false); }
  }
  function exportCsv() {
    try {
      const blob = new Blob([workspaceCsv(savedRef.current, checks)], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob), anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'receivables-devnet.csv'; document.body.appendChild(anchor); anchor.click(); anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) { setError(message(cause)); }
  }
  async function prepare() {
    if (!request) return;
    if (pendingSignature) { setError('Check the submitted signature before another payment review.'); return; }
    if (!wallet.publicKey) { setError('Connect a Solana wallet to see the live fee and total.'); return; }
    const id = ++op.current;
    setPhase('preparing'); setError(''); setNotice(''); setAck(false);
    try { const quote = await preparePayment(request, wallet.publicKey); if (id === op.current) { setPrepared(quote); setPhase('review'); } }
    catch (cause) { if (id === op.current) { setPhase('idle'); setError(message(cause)); } }
  }
  async function pay() {
    if (!prepared || !wallet.signTransaction || !ack) return;
    if (!wallet.publicKey || wallet.publicKey.toBase58() !== prepared.payer) { setPrepared(null); setPhase('idle'); setError('Connected wallet changed. Prepare a fresh review.'); return; }
    if (Date.now() - prepared.preparedAt > 60_000) { setPrepared(null); setPhase('idle'); setError('Network quote expired. Prepare a fresh review.'); return; }
    setPhase('signing'); setError('');
    try {
      const found = await sendPayment(prepared, async tx => { const signed = await wallet.signTransaction!(tx); setPhase('confirming'); return signed; }, undefined, signature => {
        const entry = { encoded: encodeRequest(prepared.request), pendingSignature: signature };
        const next = upsertEntry(savedRef.current, entry);
        const issue = saveWorkspace(next);
        if (issue) throw new Error(issue);
        savedRef.current = next;
        setSaved(next);
        setPendingSignature(signature);
      });
      showReceipt(found);
    } catch (cause) {
      if (cause instanceof PendingPaymentError || cause instanceof FailedPaymentError) {
        setPendingSignature(cause.signature);
        persist({ encoded: encodeRequest(prepared.request), pendingSignature: cause.signature });
      }
      setPhase('idle'); setError(message(cause));
    }
  }
  async function verifyLink() {
    try {
      const parsed = parseLink(verifyInput), signature = verifySignature.trim() || parsed.signature;
      setPage('requests'); open(parsed.request, signature, !signature);
      setFocusedLink(true);
    } catch (cause) { setError(message(cause)); }
  }
  async function checkFoundFor(item: PaymentRequest) {
    const id = ++op.current, key = encodeRequest(item);
    setPhase('checking'); setError(''); setNotice('');
    setChecks(current => { const next = { ...current }; delete next[key]; return next; });
    try {
      const found = await findPayment(item);
      if (id !== op.current) return;
      if (found) showReceipt(found);
      else {
        setPhase('idle'); setNotice('Valid request. No confirmed matching payment was found.');
        setChecks(current => ({ ...current, [key]: { encoded: key, status: 'open', checkedAt: Date.now() } }));
      }
    } catch (cause) {
      if (id !== op.current) return;
      setPhase('idle'); setError(message(cause));
      setChecks(current => ({ ...current, [key]: { encoded: key, status: savedRef.current.find(entry => entry.encoded === key)?.pendingSignature ? 'pending' : 'error', checkedAt: Date.now(), error: message(cause) } }));
    }
  }
  function abandonPending() {
    if (!request || !pendingSignature) return;
    if (!window.confirm('This transaction may still confirm. A second payment could send SOL twice. Continue?')) return;
    const entry = savedRef.current.find(value => value.encoded === encoded);
    persist({ encoded, ...(entry?.signature ? { signature: entry.signature } : {}) });
    setPendingSignature(null); setPhase('idle'); setError('');
  }
  const title = page === 'requests' ? 'Requests' : page === 'activity' ? 'Activity' : 'Proof desk';
  return <div className={'app-layout ' + (sidebarClosed ? 'sidebar-collapsed' : '')} data-theme={theme} data-accent="sapphire">
    <aside className="sidebar">
      <div className="sidebar-head"><button className="workspace-name" disabled={phase === 'signing' || phase === 'confirming'} onClick={onHome || (() => navigate('requests'))} title="About Receivables">Receivables</button><button className="sidebar-toggle" onClick={() => setSidebarClosed(value => !value)} aria-label={sidebarClosed ? 'Expand sidebar' : 'Collapse sidebar'}>{sidebarClosed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}</button></div>
      <div className="nav-group"><span className="nav-group-label">Workspace</span><nav aria-label="Workspace"><button className={page === 'requests' ? 'current' : ''} onClick={() => navigate('requests')} disabled={phase === 'signing' || phase === 'confirming'} title="Requests"><FileCheck2 size={17} /><span>Requests</span><b>{saved.length}</b></button><button className={page === 'activity' ? 'current' : ''} onClick={() => navigate('activity')} disabled={phase === 'signing' || phase === 'confirming'} title="Activity"><Activity size={17} /><span>Activity</span>{activityRows.length > 0 && <b>{activityRows.length}</b>}</button><button className={page === 'verify' ? 'current' : ''} onClick={() => navigate('verify')} disabled={phase === 'signing' || phase === 'confirming'} title="Verify"><ShieldCheck size={17} /><span>Verify</span></button></nav></div>
      <div className="sidebar-bottom"><button className="appearance-toggle" onClick={toggleTheme} aria-label={theme === 'light' ? 'Switch to dark appearance' : 'Switch to light appearance'}>{theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}<span>{theme === 'light' ? 'Dark appearance' : 'Light appearance'}</span></button><div className="sidebar-network"><i /> Solana Devnet</div><p>Local workspace · test SOL</p></div>
    </aside>
    <div className="main-area">
      <header className="app-header"><div className="breadcrumb"><span>Receivables</span><ChevronRight size={15} /><strong>{title}</strong></div><div className="header-actions"><span className="header-network"><i /> Devnet</span><WalletMultiButton /></div></header>
      <main className="main-content"><div className="page-head"><div><h1>{title}</h1><p>{page === 'requests' ? 'Create, share and check payment requests on this device.' : page === 'activity' ? 'Confirmed receipts verified during this session.' : 'A payment status you can inspect, share and check again.'}</p></div>{page !== 'verify' && <button className="button primary" onClick={openCreate}><Plus size={16} /> New request</button>}</div>
        {page === 'requests' && <div className={'page-with-panel ' + (panel !== 'none' ? 'has-panel' : '') + (focusedLink && panel === 'detail' ? ' linked-request' : '')}>
          <div className="list-area">
            {saved.length > 0 && <div className="ledger-summary"><div><span>Requested</span><strong>{sol(summary.requested)} SOL</strong></div><div><span>Verified received</span><strong>{sol(summary.received)} SOL</strong></div><div><span>No payment found</span><strong>{sol(summary.open)} SOL</strong></div><div><span>Not checked</span><strong>{summary.unverified}</strong></div></div>}
            <div className="toolbar"><div className="search-box"><Search size={17} /><input aria-label="Search requests" placeholder="Search payee, description or address" value={search} onChange={event => setSearch(event.target.value)} /></div><button className="button quiet" disabled={reconciling || !saved.length} onClick={() => void refreshAll()}><RefreshCw size={16} className={reconciling ? 'spinning' : ''} /> {reconciling ? `Checking ${reconcileDone}/${saved.length}` : 'Check all'}</button><button className="button quiet" disabled={!saved.length} onClick={exportCsv}><ArrowDownToLine size={16} /> Export CSV</button></div>
            <div className="filters" role="group" aria-label="Filter requests"><ListFilter size={16} />{(['all', 'open', 'paid', 'pending', 'unchecked'] as Filter[]).map(value => <button key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)}>{value === 'all' ? 'All' : value === 'open' ? 'No payment found' : value === 'paid' ? 'Verified paid' : value === 'pending' ? 'Needs check' : 'Not checked'}</button>)}</div>
            <div className="table-wrap"><table className="request-table"><thead><tr><th>Payee</th><th>For</th><th>Amount</th><th>Status</th><th>Created</th><th className="table-action" /></tr></thead><tbody>{visibleRows.map(row => <tr key={row.entry.encoded} className={encoded === row.entry.encoded && panel === 'detail' ? 'selected' : ''} onClick={() => open(row.request)}><td><button className="row-open" onClick={event => { event.stopPropagation(); open(row.request); }}>{row.request.label}</button><small className="desktop-recipient">{shortAddress(row.request.recipient)}</small><small className="mobile-description">{row.request.description || 'No description'}</small><span className="mobile-status"><Status state={row.check} pending={row.entry.pendingSignature} /></span></td><td className="description-cell">{row.request.description || '—'}</td><td className="numeric">{sol(row.request.amountLamports)} SOL</td><td><Status state={row.check} pending={row.entry.pendingSignature} /></td><td>{date(row.request.createdAt)}</td><td className="table-action"><ChevronRight size={16} /></td></tr>)}</tbody></table>{!saved.length ? <div className="table-empty"><FilePlus2 size={29} /><h2>No requests yet</h2><p>Write your first request, then share a link for the payer to review.</p><button className="button primary" onClick={openCreate}><Plus size={16} /> New request</button></div> : !visibleRows.length && <div className="table-empty compact"><h2>No matching requests</h2><p>Try another search or status filter.</p><button className="text-link" onClick={() => { setSearch(''); setFilter('all'); }}>Clear filters</button></div>}</div>
            <p className="table-foot">Saved locally in this browser. Status is verified against Solana Devnet only when checked.</p>
          </div>
          {panel !== 'none' && <aside className="detail-panel" key={panel === 'detail' ? encoded : panel} aria-label={panel === 'create' ? 'New request' : 'Request details'}><div className="panel-top"><span>{panel === 'create' ? 'New request' : receipt ? 'Verified receipt' : 'Request details'}</span><button onClick={closePanel} aria-label="Close panel"><X size={18} /></button></div>{panel === 'create' ? renderCreate() : renderDetail()}</aside>}
        </div>}
        {page === 'activity' && <div className={'page-with-panel ' + (panel === 'detail' ? 'has-panel' : '')}><div className="list-area"><div className="toolbar activity-toolbar"><span>{activityRows.length} {activityRows.length === 1 ? 'receipt' : 'receipts'} verified in this session</span><button className="button quiet" disabled={reconciling || !saved.length} onClick={() => void refreshAll()}><RefreshCw size={16} className={reconciling ? 'spinning' : ''} /> {reconciling ? `Checking ${reconcileDone}/${saved.length}` : 'Check saved requests'}</button><button className="button quiet" disabled={!saved.length} onClick={exportCsv}><ArrowDownToLine size={16} /> Export CSV</button></div>{activityRows.length ? <div className="table-wrap"><table className="request-table activity-table"><thead><tr><th>Payee</th><th>Confirmed</th><th>Amount</th><th>Transaction</th><th className="table-action" /></tr></thead><tbody>{activityRows.map(row => <tr key={row.entry.encoded} onClick={() => open(row.request)}><td><button className="row-open" onClick={event => { event.stopPropagation(); open(row.request); }}>{row.request.label}</button><small>{row.request.description}</small></td><td>{chainDate(row.check!.receipt!.blockTime)}</td><td className="numeric">{sol(row.check!.receipt!.amountLamports)} SOL</td><td className="mono">{shortAddress(row.check!.receipt!.signature)}</td><td className="table-action"><ChevronRight size={16} /></td></tr>)}</tbody></table></div> : <div className="table-empty activity-empty"><Activity size={30} /><h2>No verified activity in this session</h2><p>Check saved requests to find confirmed Devnet transactions. A saved link alone is not a receipt.</p><button className="button primary" disabled={reconciling || !saved.length} onClick={() => void refreshAll()}><RefreshCw size={16} /> Check saved requests</button></div>}</div>{panel === 'detail' && <aside className="detail-panel" key={encoded}><div className="panel-top"><span>{receipt ? 'Verified receipt' : 'Request details'}</span><button onClick={closePanel} aria-label="Close panel"><X size={18} /></button></div>{renderDetail()}</aside>}</div>}
        {page === 'verify' && <ProofDesk link={verifyInput} signature={verifySignature} busy={busy} onLink={value => { setVerifyInput(value); setError(''); }} onSignature={value => { setVerifySignature(value); setError(''); }} onVerify={() => void verifyLink()} />}
        {(error || notice || storageError || busy || reconciling) && <div className="message-stack" role="status" aria-live="polite">{busy && <div className="message working"><LoaderCircle size={17} className="spinning" />{phase === 'checking' ? 'Checking Solana Devnet…' : phase === 'preparing' ? 'Calculating fee and balance…' : phase === 'signing' ? 'Waiting for wallet signature…' : 'Waiting for confirmation…'}</div>}{reconciling && <div className="message working"><RefreshCw size={17} className="spinning" />Checking saved requests: {reconcileDone} of {saved.length}</div>}{error && <div className="message error"><X size={17} />{error}</div>}{notice && <div className="message success"><Check size={17} />{notice}</div>}{storageError && <div className="message error"><X size={17} />{storageError}</div>}</div>}
      </main>
    </div>
    {phase === 'review' && prepared && request && <div className="review-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) { setPhase('idle'); setPrepared(null); } }}><section className="review-panel" role="dialog" aria-modal="true" aria-labelledby="review-title"><button className="close-review" onClick={() => { setPhase('idle'); setPrepared(null); }} aria-label="Close payment review"><X size={20} /></button><h2 id="review-title">Review payment</h2><p>One wallet signature sends native SOL directly to this address on Devnet. After confirmation, you get a shareable receipt checked against this request.</p><div className="review-amount">{sol(request.amountLamports)} <span>SOL</span></div><div className="review-rows"><Detail label="Payee name">{request.label} <small>self-declared</small></Detail><Detail label="Receiving wallet"><Address value={request.recipient} /></Detail><Detail label="From your wallet"><Address value={prepared.payer} /></Detail><Detail label="Public description">{request.description || 'None'}</Detail><Detail label="Payment amount">{sol(request.amountLamports)} SOL</Detail><Detail label="Network fee">{sol(prepared.feeLamports)} SOL</Detail><Detail label="Platform fee">0 SOL</Detail><Detail label="Total from wallet"><strong>{sol(prepared.totalLamports)} SOL</strong></Detail><Detail label="Wallet balance">{sol(prepared.balanceLamports)} SOL</Detail></div><p className="review-warning">Devnet uses test SOL. This payment is public and irreversible on the network. The payee name does not prove who owns the receiving wallet, and payment does not guarantee delivery. The description becomes public in a transaction memo. A failed on-chain transaction may still cost a network fee.</p><label className="acknowledge"><input type="checkbox" checked={ack} onChange={event => setAck(event.target.checked)} /><span>I checked the full receiving address, amount and public details.</span></label><button className="button primary full" disabled={!ack || !wallet.signTransaction} onClick={() => void pay()}>Sign and send payment <ArrowRight size={17} /></button><small className="quote-note">Quote expires after 60 seconds. Your wallet shows the transaction before signing.</small></section></div>}
  </div>;

  function renderCreate() {
    return <form className="panel-content create-form" onSubmit={event => { event.preventDefault(); create(); }}><h2>Create a payment request</h2><p>Write clear terms before you share. Creating a request does not sign or transfer SOL.</p><label htmlFor="payee">Payee name <small>self-declared</small></label><input id="payee" value={draft.label} onChange={event => edit('label', event.target.value)} placeholder="Your name or business" required /><div className="input-meta">{new TextEncoder().encode(draft.label).length}/40 bytes</div><label htmlFor="recipient">Receiving wallet</label><input id="recipient" value={draft.recipient} onChange={event => edit('recipient', event.target.value)} placeholder="Solana wallet address" autoComplete="off" spellCheck={false} required /><button type="button" className="text-link wallet-fill" onClick={() => wallet.publicKey ? edit('recipient', wallet.publicKey.toBase58()) : setError('Connect a wallet or paste a receiving address.')}><Wallet size={15} /> Use connected wallet</button><label htmlFor="amount">Amount in SOL</label><div className="amount-input"><input id="amount" value={draft.amount} onChange={event => edit('amount', event.target.value)} inputMode="decimal" placeholder="0.00" required /><span>SOL</span></div><label htmlFor="description">Description</label><textarea id="description" value={draft.description} onChange={event => edit('description', event.target.value)} rows={3} placeholder="What is this payment for?" /><div className="input-meta">{new TextEncoder().encode(draft.description).length}/120 bytes · Public if paid</div><div className="form-note">Recipient, amount and description are fixed into the link. No platform fee. Devnet test SOL only.</div><button type="submit" className="button primary full">Create request <ArrowRight size={17} /></button></form>;
  }
  function renderDetail() {
    if (!request) return null;
    return <div className={'panel-content detail-content ' + (receipt ? 'is-paid' : '')}><div className="detail-heading"><div><h2>{request.label}</h2><p>Created {date(request.createdAt)}</p></div><Status state={checks[encoded]} pending={pendingSignature || undefined} /></div><div className="detail-amount"><span>Requested</span><strong>{sol(request.amountLamports)} <small>SOL</small></strong></div><div className="detail-fields"><Detail label="For">{request.description || 'No description'}</Detail><Detail label="Receiving wallet"><Address value={request.recipient} /></Detail><Detail label="Reference"><Address value={request.reference} /></Detail><Detail label="Network">Solana Devnet</Detail></div>{receipt ? <div className="receipt-detail"><div className="receipt-title"><CheckCircle2 size={20} /><strong>Payment verified</strong></div><p>Reconstructed from a confirmed Devnet transaction. This receipt matches the exact request.</p><ReceiptEvidence receipt={receipt} checkedAt={matchedCheck?.checkedAt} onRecheck={() => void verifyTx(request, receipt.signature)} /><Detail label="Confirmed">{chainDate(receipt.blockTime)}</Detail><Detail label="Payer"><Address value={receipt.payer} /></Detail><Detail label="Transaction"><a href={explorerUrl(receipt.signature)} target="_blank" rel="noreferrer"><Address value={receipt.signature} /> <ArrowUpRight size={14} /></a></Detail><Detail label="Slot">{receipt.slot.toLocaleString('en-US')}</Detail><Detail label="Network fee">{sol(receipt.feeLamports)} SOL</Detail><button className="button primary full" onClick={() => void copy('receipt')}>{copied === 'receipt' ? <Check size={16} /> : <Copy size={16} />}{copied === 'receipt' ? ' Proof link copied' : ' Copy proof link'}</button><button className="button secondary full" onClick={() => window.print()}><ArrowDownToLine size={16} /> Save or print receipt</button><input className="link-field" value={proofLink} readOnly aria-label="Receipt link, select to copy" onFocus={event => event.target.select()} /></div> : <div className="detail-actions"><button className="button primary full" onClick={() => void copy('request')}>{copied === 'request' ? <Check size={16} /> : <Copy size={16} />}{copied === 'request' ? ' Link copied' : ' Copy payment link'}</button><button className="button secondary full" onClick={() => setQrOpen(value => !value)}><QrCode size={16} />{qrOpen ? 'Hide QR code' : 'Show QR code'}</button>{qrOpen && <div className="qr-frame">{qr ? <img src={qr} alt="QR code for this exact request link" /> : <LoaderCircle className="spinning" />}</div>}<input className="link-field" value={requestLink} readOnly aria-label="Payment link, select to copy" onFocus={event => event.target.select()} />{actionLink && <div className="action-share"><button className="text-link" onClick={() => void copy('action')}>{copied === 'action' ? <Check size={14} /> : <Copy size={14} />}{copied === 'action' ? ' Action link copied' : ' Copy Solana Action link'}</button><small>For supported Solana Action clients. The payment link above opens this review.</small></div>}<button className="button secondary full" disabled={busy} onClick={() => void checkPayment()}><RefreshCw size={16} /> Check payment</button><div className="pay-action"><h3>Pay this request</h3><p>See the exact address, network fee, total and balance before your wallet signs.</p><div className="pay-wallet"><WalletMultiButton /></div><small>{wallet.publicKey ? 'Connected: ' + shortAddress(wallet.publicKey.toBase58()) : 'Connect a wallet to continue.'}</small><button className="button primary full" disabled={busy || Boolean(pendingSignature)} onClick={() => void prepare()}>Review payment <ArrowRight size={16} /></button></div>{pendingSignature && <div className="pending-box"><strong>Submitted signature needs a check</strong><p>The payment may still confirm. Another transfer could pay twice.</p><button className="button secondary full" onClick={() => void verifyTx(request, pendingSignature)}><RefreshCw size={16} /> Check signature</button><a href={explorerUrl(pendingSignature)} target="_blank" rel="noreferrer">Inspect in explorer <ExternalLink size={14} /></a><button className="text-link danger" onClick={abandonPending}>Start a fresh review anyway</button></div>}</div>}<div className="detail-disclosure"><strong>Devnet · test SOL</strong><p>Transactions are public and irreversible on this network. A wallet address does not verify the payee's identity. Payment does not guarantee delivery. Devnet can reset. Platform fee: 0 SOL.</p><a href="https://faucet.solana.com/" target="_blank" rel="noreferrer">Get Devnet SOL <ExternalLink size={13} /></a></div></div>;
  }
}
