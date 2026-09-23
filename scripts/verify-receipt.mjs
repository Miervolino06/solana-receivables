#!/usr/bin/env node
import { createServer } from 'vite';

function receiptUrlArgument(value) {
  if (!value) throw new Error('Provide a full receipt URL containing r and tx.');
  let url;
  try { url = new URL(value); }
  catch { throw new Error('Provide a valid full HTTP or HTTPS receipt URL.'); }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.hash ||
      [...url.searchParams.keys()].sort().join(',') !== 'r,tx' ||
      !url.searchParams.get('r') || !url.searchParams.get('tx')) {
    throw new Error('Receipt URL must contain only one request (r) and one transaction signature (tx).');
  }
  return url;
}

async function main() {
  if (process.argv.length !== 3) throw new Error('Usage: npm run verify:receipt -- "<full receipt URL with r and tx>"');
  const url = receiptUrlArgument(process.argv[2]);
  const vite = await createServer({ configFile: false, logLevel: 'silent',
    server: { middlewareMode: true }, appType: 'custom' });
  try {
    const { decodeRequest, fetchPaymentReceipt } = await vite.ssrLoadModule('/src/payments.ts');
    const { createEvidenceReport } = await vite.ssrLoadModule('/src/evidence.ts');
    let request;
    try { request = decodeRequest(url.searchParams.get('r')); }
    catch { throw new Error('Receipt URL contains invalid request data.'); }
    let receipt;
    try { receipt = await fetchPaymentReceipt(url.searchParams.get('tx'), request); }
    catch { throw new Error('Could not verify this transaction on Solana Devnet. Check the signature and try again.'); }
    const report = createEvidenceReport(receipt, `${url.origin}${url.pathname}`);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } finally {
    await vite.close();
  }
}

main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : 'Receipt verification failed.'}\n`);
  process.exitCode = 1;
});
