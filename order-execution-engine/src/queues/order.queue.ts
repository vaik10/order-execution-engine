import {Queue} from 'bullmq';
import * as dotenv from 'dotenv';
dotenv.config();

export const ORDER_QUEUE_NAME = 'order-execution';

export const orderQueue = new Queue(ORDER_QUEUE_NAME, {
  connection: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
  defaultJobOptions: {
    attempts: 3, // retries handled later
    removeOnFail: false,
    removeOnComplete: false,
  },
});
