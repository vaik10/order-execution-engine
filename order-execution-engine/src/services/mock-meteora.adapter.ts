import {injectable, BindingScope} from '@loopback/core';

@injectable({scope: BindingScope.SINGLETON})
export class MockMeteoraAdapter {
  async getQuote(tokenIn: string, tokenOut: string, amountIn: number) {
    await new Promise(r => setTimeout(r, 2000));

    const basePrice = 1.0;
    const price = basePrice * (0.97 + Math.random() * 0.05);
    const fee = 0.002;

    return {
      price,
      amountOut: Number((amountIn * price).toFixed(6)),
      fee,
    };
  }

  async executeSwap(amountIn: number, minAmountOut: number) {
    await new Promise(r => setTimeout(r, 4000 + Math.random() * 1000));

    const finalPrice = 1.0 * (0.97 + Math.random() * 0.05);
    const executedOut = amountIn * finalPrice;

    if (executedOut < minAmountOut) {
      throw new Error('Slippage exceeded, Meteora swap failed');
    }

    return {
      txHash: `MOCKTX_${Math.random().toString(36).slice(2, 10)}`,
      executedPrice: finalPrice,
      executedAmountOut: Number(executedOut.toFixed(6)),
    };
  }
}
