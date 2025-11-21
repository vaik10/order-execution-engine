import {injectable, BindingScope, inject} from '@loopback/core';
import {OrderRepository} from '../repositories';
import {repository} from '@loopback/repository';
import {v4 as uuidv4} from 'uuid';
import {ExecuteOrderRequest} from '../controllers/dtos/order-execute.dto';
import {Order} from '../models';
import {orderQueue, ORDER_QUEUE_NAME} from '../queues/order.queue';

@injectable({scope: BindingScope.SINGLETON})
export class OrderService {
  constructor(
    @repository(OrderRepository)
    private orderRepo: OrderRepository,
  ) {}

  async createPendingOrder(payload: ExecuteOrderRequest): Promise<Order> {
    const id = uuidv4();

    const order = await this.orderRepo.create({
      id,
      type: payload.type,
      tokenIn: payload.tokenIn,
      tokenOut: payload.tokenOut,
      amountIn: payload.amountIn,
      slippage: payload.slippage,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await orderQueue.add('execute-order', {
      orderId: id,
    });

    return order;
  }
}
