// Read-only endpoint smoke check. Never signs, broadcasts or requests funds.
import assert from 'node:assert/strict';
import { Keypair } from '@solana/web3.js';

const origin = process.argv[2] || 'http://127.0.0.1:5174';
const request = {
  version: 1,
  recipient: Keypair.generate().publicKey.toBase58(),
  amountLamports: '1000000',
  label: 'Endpoint check',
  description: 'Read-only metadata verification',
  reference: Keypair.generate().publicKey.toBase58(),
  createdAt: new Date().toISOString(),
};
const encoded = Buffer.from(JSON.stringify(request)).toString('base64url');
const endpoint = `${origin}/api/pay?r=${encoded}`;
const timeout = () => AbortSignal.timeout(30_000);
const preflight = await fetch(endpoint, { method: 'OPTIONS', signal: timeout() });
assert.equal(preflight.status, 204);
assert.equal(preflight.headers.get('access-control-allow-origin'), '*');
assert.equal(preflight.headers.get('x-blockchain-ids'), 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1');
const get = await fetch(endpoint, { signal: timeout() });
assert.equal(get.status, 200);
const body = await get.json();
assert.equal(body.type, 'action');
assert.equal(body.disabled, false);
assert.ok(body.description.includes(request.recipient));
assert.ok(body.description.includes('0.001 SOL'));
assert.ok(body.description.includes('Platform fee: 0 SOL'));
assert.ok(body.description.includes('cannot be reversed'));
const icon = await fetch(body.icon, { signal: timeout() });
assert.equal(icon.status, 200);
assert.match(icon.headers.get('content-type') || '', /image\/svg/);
const post = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ account: 'invalid' }), signal: timeout() });
assert.equal(post.status, 400);
assert.ok((await post.json()).message.includes('Invalid payer'));
const discovery = await fetch(`${origin}/actions.json`, { signal: timeout() });
assert.equal(discovery.status, 200);
assert.ok((await discovery.json()).rules.some(rule => rule.pathPattern === '/' && rule.apiPath === '/api/pay'));
console.log(JSON.stringify({ checkedAt: new Date().toISOString(), origin, options: preflight.status, metadata: get.status, invalidPayerRejected: post.status, icon: icon.status, discovery: discovery.status, actualDisclosure: body.description, transactionSubmitted: false }, null, 2));
