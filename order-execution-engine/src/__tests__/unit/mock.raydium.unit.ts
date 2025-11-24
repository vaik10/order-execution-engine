// src/__tests__/unit/mock-raydium.unit.ts
import {MockRaydiumAdapter} from '../../services/mock-raydium.adapter';

describe('MockRaydiumAdapter', () => {
  const mock = new MockRaydiumAdapter();

  it('returns a price within the expected mock range', async () => {
    const q = await mock.getQuote('SOL', 'USDC', 10);
    expect(q.price).toBeGreaterThan(0.98);
    expect(q.price).toBeLessThan(1.03);
  });

  it('executes swap successfully when minAmountOut is satisfied', async () => {
    const result = await mock.executeSwap(10, 1);
    expect(result.txHash).toMatch(/^MOCKTX_/);
  });

  it('throws error when slippage fails', async () => {
    await expect(mock.executeSwap(10, 9999)).rejects.toThrow();
  });
});
