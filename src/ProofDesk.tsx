import { useEffect, useState } from 'react';
import { ArrowUpRight, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { sampleDevnet, type NetworkSample } from './network';
import './proof.css';

const source = 'https://github.com/Miervolino06/solana-receivables';
const rules = [
  ['The right wallet', 'The receiving address must be exactly the one in the request.'],
  ['The exact amount', 'The recipient’s balance must increase by the requested number of lamports.'],
  ['The same request', 'The reference and signed Memo must match every field, including the description.'],
  ['A successful transaction', 'The signature, instructions, network and balance changes must pass verification.'],
];

function NetworkObservation() {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ sample?: NetworkSample; error?: string; loading: boolean }>({ loading: true });
  useEffect(() => {
    let active = true;
    setState({ loading: true });
    void sampleDevnet().then(sample => { if (active) setState({ sample, loading: false }); }).catch(() => {
      if (active) setState({ error: 'Could not verify the Devnet connection. Try again; no payment status has changed.', loading: false });
    });
    return () => { active = false; };
  }, [attempt]);
  return <section className="network-observation" aria-labelledby="network-observation-title">
    <div className="network-observation-head"><h3 id="network-observation-title">A direct look at the network</h3><button className="button quiet" onClick={() => setAttempt(value => value + 1)} disabled={state.loading} aria-label="Refresh network observation"><RefreshCw size={15} className={state.loading ? 'spinning' : ''} /></button></div>
    <div aria-live="polite">
      {state.loading ? <p>Reading Solana Devnet…</p> : state.error ? <p className="network-error">{state.error}</p> : state.sample && <>
        <p>Devnet identity checked <span>·</span> confirmed slot <a href={`https://explorer.solana.com/block/${state.sample.slot}?cluster=devnet`} target="_blank" rel="noreferrer">{state.sample.slot.toLocaleString('en-US')}<ArrowUpRight size={13} /></a></p>
        <small>Read from the configured RPC at {new Date(state.sample.checkedAt).toLocaleTimeString('en-GB', { timeZone: 'UTC' })} UTC. Refresh for a new observation.</small>
        <details><summary>Network identity</summary><code>{state.sample.genesisHash}</code><p>The RPC’s genesis hash matches Solana Devnet. This does not verify a payment.</p></details>
      </>}
    </div>
    <p className="network-boundary">Network availability is separate from payment verification. No wallet connection or signature is needed here.</p>
  </section>;
}

type Props = {
  link: string; signature: string; busy: boolean;
  onLink: (value: string) => void; onSignature: (value: string) => void; onVerify: () => void;
};

export default function ProofDesk({ link, signature, busy, onLink, onSignature, onVerify }: Props) {
  return <div className="proof-desk">
    <div className="proof-desk-columns">
      <form className="proof-form" onSubmit={event => { event.preventDefault(); onVerify(); }}>
        <h2>Bring the receipt. We’ll check the chain.</h2>
        <p>Paste a Receivables link. We read the transaction from Solana and compare it with what was requested.</p>
        <label htmlFor="verify-link">Request or receipt link</label>
        <textarea id="verify-link" value={link} onChange={event => onLink(event.target.value)} rows={4} placeholder="https://solana-receivables.vercel.app/?r=…" spellCheck={false} required aria-describedby="verify-link-hint" />
        <small id="verify-link-hint">The link carries the original terms. A signature alone cannot tell us what you agreed to receive.</small>
        <label htmlFor="verify-signature">Transaction signature <small>optional</small></label>
        <input id="verify-signature" value={signature} onChange={event => onSignature(event.target.value)} placeholder="Already included in a receipt link" spellCheck={false} />
        <small>Without a signature, we look for a payment using the request’s reference.</small>
        <button type="submit" className="button primary full" disabled={busy}>{busy ? <LoaderCircle size={17} className="spinning" /> : <ShieldCheck size={17} />} Verify on Devnet</button>
        <p className="proof-readonly">Read-only. No wallet connection. No signing. No fee.</p>
      </form>
      <aside className="proof-method" aria-labelledby="proof-method-title">
        <h2 id="proof-method-title">What earns “Verified paid”?</h2>
        <p>Every check below must pass. A screenshot, saved record or shared reference is not enough.</p>
        <dl>{rules.map(([title, description]) => <div key={title}><dt>{title}</dt><dd>{description}</dd></div>)}</dl>
        <p className="proof-limits">A match proves this transfer against this request. It does not prove the payee’s identity, delivery of work or a tax invoice.</p>
        <a href={`${source}/blob/codex/receivables/src/payments.ts`} target="_blank" rel="noreferrer">Read the verification code<ArrowUpRight size={15} /></a>
      </aside>
    </div>
    <NetworkObservation />
    <div className="proof-open-source"><div><h3>Check it outside this website.</h3><p>The receipt links to Solana Explorer. Download the evidence record, or run the verifier yourself from the public repository.</p></div><a href={`${source}/blob/codex/receivables/docs/PROOF.md`} target="_blank" rel="noreferrer">Verification guide<ArrowUpRight size={16} /></a></div>
  </div>;
}
