import {Entity, model, property} from '@loopback/repository';

@model()
export class Order extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: true,
  })
  id?: string;

  @property({
    type: 'string',
    required: true,
  })
  type: string;

  @property({
    type: 'string',
    required: true,
  })
  tokenIn: string;

  @property({
    type: 'string',
    required: true,
  })
  tokenOut: string;

  @property({
    type: 'number',
    required: true,
  })
  amountIn: number;

  @property({
    type: 'number',
    required: true,
  })
  slippage: number;

  @property({
    type: 'string',
    required: true,
  })
  status: string;

  @property({
    type: 'string',
  })
  selectedDex?: string;

  @property({
    type: 'string',
  })
  txHash?: string;

  @property({
    type: 'string',
  })
  failureReason?: string;

  @property({
    type: 'number',
  })
  executedPrice?: number;

  @property({
    type: 'date',
    required: true,
  })
  createdAt: string;

  @property({
    type: 'date',
    required: true,
  })
  updatedAt: string;

  constructor(data?: Partial<Order>) {
    super(data);
  }
}

export interface OrderRelations {
  // describe navigational properties here
}

export type OrderWithRelations = Order & OrderRelations;
