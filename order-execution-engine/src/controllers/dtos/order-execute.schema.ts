export const ExecuteOrderSchema = {
  type: 'object',
  required: ['type', 'tokenIn', 'tokenOut', 'amountIn', 'slippage'],
  properties: {
    type: {
      type: 'string',
      enum: ['market', 'limit', 'sniper'],
    },
    tokenIn: {type: 'string'},
    tokenOut: {type: 'string'},
    amountIn: {type: 'number', minimum: 0},
    slippage: {type: 'number', minimum: 0, maximum: 5},
  },
};
