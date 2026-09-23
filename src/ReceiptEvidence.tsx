import { useState } from 'react';
import { ArrowDownToLine, Check, RefreshCw } from 'lucide-react';
import { createEvidenceReport } from './evidence';
import { formatSol, type PaymentReceipt } from './payments';
import './proof.css';

export default function ReceiptEvidence({ receipt, checkedAt, onRecheck }: {
  receipt: PaymentReceipt; checkedAt?: number; onRecheck: () => void;
}) {
  const [error, setError] = useState('');
  const request = receipt.request;
  function download() {
    if (!checkedAt) return;
    try {
      const report = createEvidenceReport(receipt, location.origin, new Date(checkedAt).toISOString());
      const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2) + '\n'], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `receivables-${receipt.signature.slice(0, 12)}.json`;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setError('');
    } catch { setError('The evidence file could not be created. Recheck this payment and try again.'); }
  }
  return <section className="receipt-evidence" aria-labelledby="receipt-evidence-title">
    <h3 id="receipt-evidence-title">The request and the chain agree.</h3>
    <p>{checkedAt ? `Checked against Solana Devnet at ${new Date(checkedAt).toLocaleString('en-GB', { timeZone: 'UTC' })} UTC.` : 'Verified from Solana Devnet in this session.'} Each condition below passed.</p>
    <dl>
      <div><dt><Check size={15} /> Exact recipient</dt><dd>Requested <code>{request.recipient}</code></dd><dd>Received by <code>{receipt.recipient}</code></dd></div>
      <div><dt><Check size={15} /> Exact amount</dt><dd>Requested <code>{formatSol(BigInt(request.amountLamports))} SOL</code></dd><dd>Recipient gained <code>{formatSol(receipt.amountLamports)} SOL</code></dd></div>
      <div><dt><Check size={15} /> Signed request</dt><dd>The read-only reference and every request field match the payer-signed Memo.</dd></div>
      <div><dt><Check size={15} /> Transfer and fee accounted for</dt><dd>Payer spent <code>{formatSol(receipt.amountLamports + receipt.feeLamports)} SOL</code>, including a <code>{formatSol(receipt.feeLamports)} SOL</code> network fee. All other account balances are unchanged.</dd></div>
      <div><dt><Check size={15} /> Successful transaction</dt><dd>Valid payer signature and exact transfer instructions. Confirmed in slot <code>{receipt.slot.toLocaleString('en-US')}</code>.</dd></div>
    </dl>
    <details><summary>Inspect the matched request data</summary><pre>{JSON.stringify(request, null, 2)}</pre></details>
    <button className="button secondary full" onClick={onRecheck}><RefreshCw size={15} /> Recheck on Solana</button>
    <button className="button secondary full" disabled={!checkedAt} onClick={download}><ArrowDownToLine size={15} /> Download evidence (JSON)</button>
    {error && <p role="alert">{error}</p>}
    <p className="receipt-evidence-note">The file records this check; it is not a certificate. Anyone can reopen the proof link or run the public verifier to query Solana again. Confirmation and balances rely on RPC data; Devnet can reset.</p>
  </section>;
}
