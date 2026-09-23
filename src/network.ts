import type { Connection } from '@solana/web3.js';
import { connection, DEVNET_GENESIS_HASH } from './payments';

export type NetworkSample = { genesisHash: string; slot: number; checkedAt: string };

// A network observation never serves as payment evidence.
export async function sampleDevnet(rpc: Pick<Connection, 'getGenesisHash' | 'getSlot'> = connection): Promise<NetworkSample> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const [genesisHash, slot] = await Promise.race([
      Promise.all([rpc.getGenesisHash(), rpc.getSlot('confirmed')]),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Network check timed out. Try again.')), 12_000); }),
    ]);
    if (genesisHash !== DEVNET_GENESIS_HASH) throw new Error('The configured RPC is not Solana Devnet. Payment verification is unavailable on this endpoint.');
    if (!Number.isSafeInteger(slot) || slot < 0) throw new Error('The RPC returned an invalid slot. Try again.');
    return { genesisHash, slot, checkedAt: new Date().toISOString() };
  } finally { clearTimeout(timer); }
}
