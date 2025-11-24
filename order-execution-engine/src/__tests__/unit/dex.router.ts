// src/__tests__/unit/dex.router.unit.ts

import {DexRouter} from '../../services/dex.router';
import {describe, it, expect, jest} from '@jest/globals';

describe('DexRouter', () => {
  it('selects Raydium when Raydium quote is better', async () => {
    const ray = {
      getQuote: jest
        .fn()
        .mockResolvedValue({amountOut: 100, fee: 0.01} as any as never),
    };
    const met = {
      getQuote: jest
        .fn()
        .mockResolvedValue({amountOut: 90, fee: 0.01} as any as never),
    };

    const router = new DexRouter(ray as any, met as any);
    const result = await router.route('SOL', 'USDC', 10);

    expect(result.dex).toBe('raydium');
  });

  it('selects Meteora when Meteora offers better output', async () => {
    const ray = {
      getQuote: jest.fn().mockResolvedValue({
        price: 10,
        amountOut: 80,
        fee: 0.01,
      } as any as never),
    };
    const met = {
      getQuote: jest
        .fn()
        .mockResolvedValue({amountOut: 95, fee: 0.01} as any as never),
    };

    const router = new DexRouter(ray as any, met as any);
    const result = await router.route('SOL', 'USDC', 10);

    expect(result.dex).toBe('meteora');
  });
});
