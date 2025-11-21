import {Worker, Job} from 'bullmq';
import * as dotenv from 'dotenv';
import {repository} from '@loopback/repository';
import {OrderRepository} from '../repositories';
import {WebSocketManager} from '../websocket/websocket.manager';
import {inject} from '@loopback/core';

dotenv.config();

export class OrderWorker {
  private worker: Worker;

  constructor(
    @inject('repositories.OrderRepository')
    private orderRepo: OrderRepository,

    @inject('services.WebSocketManager')
    private wsManager: WebSocketManager,
  ) {
    console.log('[Worker] initializing, connecting to queue');
    this.worker = new Worker(
      'order-execution',
      async (job: Job) => {
        const {orderId} = job.data;
        return this.process(orderId);
      },
      {
        connection: {
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT),
        },
        concurrency: 10,
      },
    );

    this.worker.on('completed', job =>
      console.log(`Order ${job.data.orderId} completed.`),
    );

    this.worker.on('failed', (job, err) =>
      console.log(`Order ${job?.data.orderId} failed:`, err),
    );
    console.log('[Worker] started');
  }

  async process(orderId: string) {
    console.log('Working on order:', orderId);

    await new Promise(res => setTimeout(res, 5000));
    this.wsManager.send(orderId, {status: 'pending'});

    await new Promise(res => setTimeout(res, 5000));
    this.wsManager.send(orderId, {status: 'routing'});

    await new Promise(res => setTimeout(res, 5000));
    this.wsManager.send(orderId, {status: 'building'});

    // Simulate submitted tx
    const mockTx = 'MockTx-' + Math.random().toString(36).substring(2, 8);
    this.wsManager.send(orderId, {status: 'submitted', txHash: mockTx});

    await new Promise(res => setTimeout(res, 10000));
    this.wsManager.send(orderId, {
      status: 'confirmed',
      txHash: mockTx,
      executedPrice: 0.0012,
    });

    await this.orderRepo.updateById(orderId, {
      status: 'confirmed',
      txHash: mockTx,
      executedPrice: 0.0012,
      updatedAt: new Date().toISOString(),
    });

    return true;
  }
}
