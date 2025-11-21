import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    postgresql: {table: 'orders'},
    strict: true,
    idInjection: false, // important (from previous fix)
  },
})
export class Order extends Entity {
  @property({
    type: 'string',
    id: true,
    postgresql: {columnName: 'id', dataType: 'uuid'},
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
    postgresql: {columnName: 'token_in', dataType: 'string'},
  })
  tokenIn: string;

  @property({
    type: 'string',
    required: true,
    postgresql: {columnName: 'token_out', dataType: 'string'},
  })
  tokenOut: string;

  @property({
    type: 'number',
    required: true,
    postgresql: {columnName: 'amount_in', dataType: 'number'},
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
    postgresql: {columnName: 'selected_dex', dataType: 'string'},
  })
  selectedDex?: string;

  @property({
    type: 'string',
    postgresql: {columnName: 'tx_hash', dataType: 'string'},
  })
  txHash?: string;

  @property({
    type: 'string',
    postgresql: {columnName: 'failure_reason', dataType: 'string'},
  })
  failureReason?: string;

  @property({
    type: 'number',
    postgresql: {columnName: 'executed_price', dataType: 'number'},
  })
  executedPrice?: number;

  @property({
    type: 'date',
    required: true,
    postgresql: {columnName: 'created_at', dataType: 'timestamp'},
  })
  createdAt: string;

  @property({
    type: 'date',
    required: true,
    postgresql: {columnName: 'updated_at', dataType: 'timestamp'},
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
