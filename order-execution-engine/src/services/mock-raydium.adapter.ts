import {injectable, BindingScope} from '@loopback/core';

@injectable({scope: BindingScope.SINGLETON})
export class MockRaydiumAdapter {
  async getQuote(tokenIn: string, tokenOut: string, amountIn: number) {
    // Simulate 200ms latency
    await new Promise(r => setTimeout(r, 2000));

    const basePrice = 1.0; // assume 1:1 reference
    const price = basePrice * (0.98 + Math.random() * 0.04); //  ±2% randomness
    const fee = 0.003;

    return {
      price,
      amountOut: Number((amountIn * price).toFixed(6)),
      fee,
    };
  }

  async executeSwap(amountIn: number, minAmountOut: number) {
    // Simulate 4–5 second processing delay
    await new Promise(r => setTimeout(r, 4000 + Math.random() * 1000));

    const finalPrice = 1.0 * (0.98 + Math.random() * 0.04);
    const executedOut = amountIn * finalPrice;

    const success = executedOut >= minAmountOut;

    if (!success) {
      throw new Error('Slippage exceeded, swap failed');
    }

    return {
      txHash: `MOCKTX_${Math.random().toString(36).slice(2, 10)}`,
      executedPrice: finalPrice,
      executedAmountOut: Number(executedOut.toFixed(6)),
    };
  }
}
