import {inject, injectable, BindingScope} from '@loopback/core';
import {MockRaydiumAdapter} from './mock-raydium.adapter';
import {MockMeteoraAdapter} from './mock-meteora.adapter';
import {logger} from '../helpers/logger';
@injectable({scope: BindingScope.SINGLETON})
export class DexRouter {
  constructor(
    @inject('services.MockRaydiumAdapter')
    private raydium: MockRaydiumAdapter,

    @inject('services.MockMeteoraAdapter')
    private meteora: MockMeteoraAdapter,
  ) {}

  async route(tokenIn: string, tokenOut: string, amountIn: number) {
    logger.info({tokenIn, tokenOut, amountIn}, '[DexRouter] Fetching quotes');

    const [raydiumQuote, meteoraQuote] = await Promise.all([
      this.raydium.getQuote(tokenIn, tokenOut, amountIn),
      this.meteora.getQuote(tokenIn, tokenOut, amountIn),
    ]);

    logger.debug({raydiumQuote}, '[DexRouter] Raydium quote');
    logger.debug({meteoraQuote}, '[DexRouter] Meteora quote');

    // Choose better by amountOut minus fee
    const rayScore = raydiumQuote.amountOut * (1 - raydiumQuote.fee);
    const meteoraScore = meteoraQuote.amountOut * (1 - meteoraQuote.fee);

    const selected = rayScore > meteoraScore ? 'raydium' : 'meteora';

    logger.info(
      {selected, rayScore, meteoraScore},
      '[DexRouter] Selected best execution venue',
    );

    if (rayScore > meteoraScore) {
      return {dex: 'raydium', quote: raydiumQuote};
    } else {
      return {dex: 'meteora', quote: meteoraQuote};
    }
  }
}
