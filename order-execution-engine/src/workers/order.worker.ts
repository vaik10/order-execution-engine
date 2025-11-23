// src/workers/order.worker.ts
import {Worker, Job} from 'bullmq';
import * as dotenv from 'dotenv';
import {inject} from '@loopback/core';
import {OrderRepository} from '../repositories';
import {WebSocketManager} from '../websocket/websocket.manager';
import {DexRouter} from '../services/dex.router';
import {MockRaydiumAdapter} from '../services/mock-raydium.adapter';
import {MockMeteoraAdapter} from '../services/mock-meteora.adapter';

dotenv.config();

/**
 * OrderWorker
 *
 * - consumes jobs from 'order-execution' queue
 * - emits websocket lifecycle events via WebSocketManager
 * - uses DexRouter (which uses Mock adapters) to route & execute
 * - updates OrderRepository with status, txHash, executedPrice, failureReason
 *
 * Retry behavior:
 * - The queue producer should set attempts/backoff; this worker will throw errors
 *   to let BullMQ perform retries. We check job.attemptsMade to include retry logs.
 */
export class OrderWorker {
  private worker: Worker;

  constructor(
    @inject('repositories.OrderRepository')
    private orderRepo: OrderRepository,

    @inject('services.WebSocketManager')
    private wsManager: WebSocketManager,

    @inject('services.DexRouter')
    private dexRouter: DexRouter,

    @inject('services.MockRaydiumAdapter')
    private raydiumAdapter: MockRaydiumAdapter,

    @inject('services.MockMeteoraAdapter')
    private meteoraAdapter: MockMeteoraAdapter,
  ) {
    console.log('[Worker] Initializing OrderWorker...');

    this.worker = new Worker(
      'order-execution',
      async (job: Job) => {
        const {orderId} = job.data;
        console.log(
          `[Worker] Received job for order ${orderId} (job id=${job.id}) attemptsMade=${job.attemptsMade}`,
        );
        return this.process(orderId, job);
      },
      {
        connection: {
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: Number(process.env.REDIS_PORT || 6379),
        },
        concurrency: 10,
      },
    );

    this.worker.on('completed', job => {
      console.log(`[Worker] Job completed: ${job?.id}`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[Worker] Job failed: ${job?.id}`, err?.message || err);
    });

    this.worker.on('error', err => {
      console.error('[Worker] Worker error:', err);
    });

    console.log('[Worker] Started');
  }

  /**
   * The core processing pipeline for an order.
   */
  async process(orderId: string, job: Job) {
    // Send initial pending (order row should already be pending)
    try {
      await new Promise(r => setTimeout(r, 5000));
      this.wsManager.send(orderId, {status: 'pending'});
    } catch (err) {
      console.warn('[Worker] ws send pending failed', err);
    }

    // Load order
    let order;
    try {
      order = await this.orderRepo.findById(orderId);
    } catch (err) {
      console.error(`[Worker] Failed to load order ${orderId}:`, err);
      // Fatal - cannot continue, throw to let BullMQ retry if desired
      throw err;
    }

    // ROUTING
    try {
      this.wsManager.send(orderId, {status: 'routing'});
      console.log(
        `[Worker] routing for order ${orderId} tokenIn=${order.tokenIn} tokenOut=${order.tokenOut} amount=${order.amountIn}`,
      );

      const routeResult: any = await this.dexRouter.route(
        order.tokenIn,
        order.tokenOut,
        order.amountIn,
      );
      const chosenDex = routeResult.dex || routeResult.chosenDex || 'raydium';
      const quote = routeResult.quote || routeResult;

      // Persist routing decision for transparency
      await this.orderRepo.updateById(orderId, {
        selectedDex: chosenDex,
        updatedAt: new Date().toISOString(),
      });

      this.wsManager.send(orderId, {status: 'routing', chosenDex, quote});
      console.log(
        `[Worker] route decision for order ${orderId}: ${chosenDex}`,
        quote,
      );

      // BUILDING
      this.wsManager.send(orderId, {status: 'building', chosenDex, quote});
      // compute minAmountOut using slippage (slippage stored as percent e.g. 1 => 1%)
      const slippagePercent = Number(order.slippage) || 0;
      const minAmountOut = Number(
        (quote.amountOut * (1 - slippagePercent / 100)).toFixed(8),
      );

      // simulate small delay for building tx
      await this.sleep(2000);

      // SUBMIT / EXECUTE (mock execution)
      this.wsManager.send(orderId, {status: 'submitted'});
      let execResult: any;
      if (chosenDex === 'raydium') {
        execResult = await this.raydiumAdapter.executeSwap(
          order.amountIn,
          minAmountOut,
        );
      } else {
        execResult = await this.meteoraAdapter.executeSwap(
          order.amountIn,
          minAmountOut,
        );
      }

      // CONFIRMED
      this.wsManager.send(orderId, {
        status: 'confirmed',
        txHash: execResult.txHash,
        executedPrice: execResult.executedPrice,
        executedAmountOut: execResult.executedAmountOut,
      });

      // persist success
      await this.orderRepo.updateById(orderId, {
        status: 'confirmed',
        txHash: execResult.txHash,
        executedPrice: execResult.executedPrice,
        updatedAt: new Date().toISOString(),
      });

      console.log(
        `[Worker] Order ${orderId} confirmed tx ${execResult.txHash}`,
      );

      return true;
    } catch (err: any) {
      const attempts = job.attemptsMade || 0;
      console.error(
        `[Worker] Order ${orderId} execution error (attemptsMade=${attempts}):`,
        err?.message || err,
      );

      // If the job still has retries left, rethrow so BullMQ will retry according to job options.
      // The queue should be configured with attempts: 3 (done earlier in order.queue.ts).
      // If attempts exhausted, persist failure and emit failed event.
      const maxAttempts = 3; // reflects queue policy
      if (attempts < maxAttempts) {
        console.log(
          `[Worker] Will allow BullMQ to retry order ${orderId} (attempt #${attempts + 1})`,
        );
        // Don't update DB to failed yet; let retry occur. Rethrow to mark this attempt as failed.
        throw err;
      } else {
        // Exhausted attempts: mark failed, persist reason, emit failed
        const failureReason = (err && err.message) || String(err);
        try {
          await this.orderRepo.updateById(orderId, {
            status: 'failed',
            failureReason,
            updatedAt: new Date().toISOString(),
          });
        } catch (upErr) {
          console.error(
            `[Worker] Failed to persist failure for order ${orderId}:`,
            upErr,
          );
        }

        try {
          this.wsManager.send(orderId, {
            status: 'failed',
            error: failureReason,
          });
        } catch (wsErr) {
          console.warn('[Worker] ws send failed event failed', wsErr);
        }

        // Throw to inform BullMQ but attempts exhausted already.
        throw err;
      }
    }
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
