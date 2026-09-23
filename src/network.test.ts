import { describe, expect, it, vi } from 'vitest';
import { sampleDevnet } from './network';
import { DEVNET_GENESIS_HASH } from './payments';

describe('network observations', () => {
  it('checks network identity before exposing a confirmed slot sample', async () => {
    const rpc = { getGenesisHash: vi.fn().mockResolvedValue(DEVNET_GENESIS_HASH), getSlot: vi.fn().mockResolvedValue(1234) };
    const sample = await sampleDevnet(rpc);
    expect(sample).toMatchObject({ genesisHash: DEVNET_GENESIS_HASH, slot: 1234 });
    expect(rpc.getSlot).toHaveBeenCalledWith('confirmed');
    expect(Number.isNaN(Date.parse(sample.checkedAt))).toBe(false);
    expect(sample).not.toHaveProperty('paid');
  });
  it('does not describe another network or invalid data as Devnet evidence', async () => {
    await expect(sampleDevnet({ getGenesisHash: async () => 'mainnet', getSlot: async () => 1234 })).rejects.toThrow('not Solana Devnet');
    await expect(sampleDevnet({ getGenesisHash: async () => DEVNET_GENESIS_HASH, getSlot: async () => NaN })).rejects.toThrow('invalid slot');
  });
  it('does not substitute illustrative data on an RPC failure', async () => {
    await expect(sampleDevnet({ getGenesisHash: async () => { throw Error('unavailable'); }, getSlot: async () => 1234 })).rejects.toThrow('unavailable');
  });
});
