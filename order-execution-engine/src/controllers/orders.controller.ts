import {post, requestBody, Response, RestBindings} from '@loopback/rest';
import {ExecuteOrderSchema} from './dtos/order-execute.schema';
import {ExecuteOrderRequest} from './dtos/order-execute.dto';
import {inject} from '@loopback/core';
import {OrderService} from '../services/order.service';

export class OrdersController {
  constructor(
    @inject('services.OrderService')
    private orderService: OrderService,
  ) {}

  @post('/api/orders/execute', {
    responses: {
      '200': {
        description: 'Order accepted and initialised',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                orderId: {type: 'string'},
                message: {type: 'string'},
              },
            },
          },
        },
      },
    },
  })
  async executeOrder(
    @requestBody({
      description: 'Execute order payload',
      required: true,
      content: {
        'application/json': {schema: ExecuteOrderSchema as any},
      },
    })
    body: ExecuteOrderRequest,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ) {
    // Validate supported type
    if (body.type !== 'market') {
      return {
        message:
          'Only market orders are currently supported in the first version.',
      };
    }

    const order = await this.orderService.createPendingOrder(body);

    // Future commit: upgrade WS on this same connection

    return {
      orderId: order.id,
      message: 'Order received. WebSocket will stream updates.',
    };
  }
}
