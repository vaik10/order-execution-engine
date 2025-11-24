// src/__tests__/unit/mock-meteora.unit.ts
import {MockMeteoraAdapter} from '../../services/mock-meteora.adapter';

describe('MockMeteoraAdapter', () => {
  const mock = new MockMeteoraAdapter();

  it('returns a valid quote with reasonable variability', async () => {
    const q = await mock.getQuote('SOL', 'USDC', 10);
    expect(q.price).toBeGreaterThan(0.96);
    expect(q.price).toBeLessThan(1.05);
  });

  it('executes mock swap successfully', async () => {
    const r = await mock.executeSwap(10, 1);
    expect(typeof r.txHash).toBe('string');
  });
});
