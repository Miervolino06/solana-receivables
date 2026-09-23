import { decodeRequest, encodeRequest, fetchPaymentReceipt, findPayment, formatSol, type PaymentReceipt } from './payments';
import bs58 from 'bs58';

// Keep existing links when upgrading the initial prototype. Stored signatures are
// hints to recheck, never evidence that a payment succeeded.
export const WORKSPACE_KEY = 'lineitem-requests-v1';
export const WORKSPACE_LIMIT = 40;
export type WorkspaceEntry = { encoded: string; signature?: string; pendingSignature?: string };
export type CheckState = {
  encoded: string;
  status: 'open' | 'paid' | 'pending' | 'error';
  checkedAt: number;
  receipt?: PaymentReceipt;
  error?: string;
};
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>;

export function readWorkspace(storage: StoragePort = localStorage): { items: WorkspaceEntry[]; error: string } {
  try {
    const raw = storage.getItem(WORKSPACE_KEY);
    if (!raw) return { items: [], error: '' };
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Invalid workspace');
    const items: WorkspaceEntry[] = [];
    const seen = new Set<string>();
    for (const value of parsed) {
      if (!value || typeof value !== 'object' || typeof value.encoded !== 'string') continue;
      try {
        const encoded = encodeRequest(decodeRequest(value.encoded));
        if (seen.has(encoded)) continue;
        seen.add(encoded);
        const entry: WorkspaceEntry = { encoded };
        for (const field of ['signature', 'pendingSignature'] as const) {
          const signature = value[field];
          if (typeof signature !== 'string' || signature.length < 64 || signature.length > 88) continue;
          try { if (bs58.decode(signature).length === 64) entry[field] = signature; } catch { /* Invalid hint. */ }
        }
        items.push(entry);
        if (items.length === WORKSPACE_LIMIT) break;
      } catch { /* A malformed local record cannot become a payable request. */ }
    }
    return { items, error: items.length < parsed.length ? 'Some duplicate or invalid local records were skipped.' : '' };
  } catch { return { items: [], error: 'Local requests could not be read. Shared links still work.' }; }
}

export function saveWorkspace(items: WorkspaceEntry[], storage: StoragePort = localStorage): string {
  try { storage.setItem(WORKSPACE_KEY, JSON.stringify(items.slice(0, WORKSPACE_LIMIT))); return ''; }
  catch { return 'This browser could not save the request. Keep its link and any submitted signature before leaving.'; }
}

export function upsertEntry(items: WorkspaceEntry[], entry: WorkspaceEntry): WorkspaceEntry[] {
  // Callers explicitly carry pendingSignature until onchain verification resolves it.
  return [entry, ...items.filter(item => item.encoded !== entry.encoded)].slice(0, WORKSPACE_LIMIT);
}

export async function reconcileRequests(
  items: WorkspaceEntry[],
  onResult: (result: CheckState) => void,
  options: { signal?: AbortSignal; find?: typeof findPayment; fetch?: typeof fetchPaymentReceipt } = {},
): Promise<void> {
  // Serial requests avoid bursting shared public RPC limits. Failures remain
  // unknown/error; they are never counted as outstanding or received.
  for (const entry of items) {
    if (options.signal?.aborted) return;
    let result: CheckState;
    try {
      const request = decodeRequest(entry.encoded);
      const signature = entry.pendingSignature || entry.signature;
      const receipt = signature
        ? await (options.fetch || fetchPaymentReceipt)(signature, request)
        : await (options.find || findPayment)(request);
      result = { encoded: entry.encoded, status: receipt ? 'paid' : 'open', checkedAt: Date.now(), ...(receipt ? { receipt } : {}) };
    } catch (cause) {
      result = { encoded: entry.encoded, status: entry.pendingSignature ? 'pending' : 'error', checkedAt: Date.now(), error: cause instanceof Error ? cause.message : 'The network could not be checked.' };
    }
    if (options.signal?.aborted) return;
    onResult(result);
  }
}

export function summarizeWorkspace(items: WorkspaceEntry[], checks: Record<string, CheckState>) {
  let requested = 0n, received = 0n, open = 0n, unverified = 0;
  for (const entry of items) {
    const request = decodeRequest(entry.encoded);
    const amount = BigInt(request.amountLamports);
    requested += amount;
    const check = checks[entry.encoded];
    if (check?.status === 'paid' && check.receipt && encodeRequest(check.receipt.request) === entry.encoded) received += check.receipt.amountLamports;
    else if (check?.status === 'open') open += amount;
    else unverified++;
  }
  return { requested, received, open, unverified, count: items.length };
}

function csvCell(value: string): string {
  // Spreadsheet applications evaluate formulas even in quoted CSV cells.
  const safe = /^[\s]*[=+@\-]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function workspaceCsv(items: WorkspaceEntry[], checks: Record<string, CheckState>): string {
  const rows = [['Network', 'Payee (self-declared)', 'Description', 'Recipient', 'Requested SOL', 'Status', 'Checked at UTC', 'Transaction', 'Fee SOL', 'Confirmed at UTC', 'Reference']];
  for (const entry of items) {
    const request = decodeRequest(entry.encoded), check = checks[entry.encoded];
    const receipt = check?.status === 'paid' && check.receipt && encodeRequest(check.receipt.request) === entry.encoded ? check.receipt : undefined;
    rows.push(['Solana Devnet', request.label, request.description, request.recipient, formatSol(BigInt(request.amountLamports)), receipt ? 'Verified this session' : check?.status === 'open' ? 'No matching payment found' : entry.pendingSignature ? 'Submitted; verification required' : 'Not verified', check ? new Date(check.checkedAt).toISOString() : '', receipt?.signature || entry.pendingSignature || entry.signature || '', receipt ? formatSol(receipt.feeLamports) : '', receipt?.blockTime ? new Date(receipt.blockTime * 1000).toISOString() : '', request.reference]);
  }
  return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
}
