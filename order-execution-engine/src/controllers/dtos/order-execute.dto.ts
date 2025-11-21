export interface ExecuteOrderRequest {
  type: string; // market | limit | sniper
  tokenIn: string;
  tokenOut: string;
  amountIn: number;
  slippage: number;
}
