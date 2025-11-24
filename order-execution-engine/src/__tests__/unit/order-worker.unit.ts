// src/__tests__/unit/order.worker.unit.ts
import {OrderWorker} from '../../workers/order.worker';
import {
  fakeOrderRepo,
  fakeWebSocketManager,
  fakeJob,
} from '../../helpers/mock-objects';

describe('OrderWorker', () => {
  let orderRepo: any;
  let ws: any;
  let mockRay: any;
  let mockMet: any;
  let router: any;

  beforeEach(() => {
    orderRepo = fakeOrderRepo();
    ws = fakeWebSocketManager();

    mockRay = {
      executeSwap: jest.fn().mockResolvedValue({
        txHash: 'TX1',
        executedPrice: 1,
        executedAmountOut: 10,
      }),
    };
    mockMet = {
      executeSwap: jest.fn().mockResolvedValue({
        txHash: 'TX2',
        executedPrice: 1,
        executedAmountOut: 10,
      }),
    };

    router = {
      route: jest
        .fn()
        .mockResolvedValue({dex: 'raydium', quote: {amountOut: 10, fee: 0.01}}),
    };
  });

  it('processes an order end-to-end successfully', async () => {
    orderRepo.findById.mockResolvedValue({
      id: 'order1',
      tokenIn: 'SOL',
      tokenOut: 'USDC',
      amountIn: 10,
      slippage: 1,
    });

    const worker = new OrderWorker(orderRepo, ws, router, mockRay, mockMet);
    const job = fakeJob('order1');

    const result = await worker.process('order1', job);
    expect(result).toBe(true);

    expect(ws.send).toHaveBeenCalledWith(
      'order1',
      expect.objectContaining({status: 'pending'}),
    );
    expect(ws.send).toHaveBeenCalledWith(
      'order1',
      expect.objectContaining({status: 'routing'}),
    );
    expect(ws.send).toHaveBeenCalledWith(
      'order1',
      expect.objectContaining({status: 'building'}),
    );
    expect(ws.send).toHaveBeenCalledWith(
      'order1',
      expect.objectContaining({status: 'submitted'}),
    );
    expect(ws.send).toHaveBeenCalledWith(
      'order1',
      expect.objectContaining({status: 'confirmed'}),
    );

    expect(orderRepo.updateById).toHaveBeenCalled();
  });

  it('rethrows errors so BullMQ retries', async () => {
    orderRepo.findById.mockResolvedValue({
      id: 'order1',
      tokenIn: 'a',
      tokenOut: 'b',
      amountIn: 10,
      slippage: 1,
    });
    router.route.mockRejectedValue(new Error('router failed'));

    const worker = new OrderWorker(orderRepo, ws, router, mockRay, mockMet);
    const job = fakeJob('order1', 0); // first attempt

    await expect(worker.process('order1', job)).rejects.toThrow(
      'router failed',
    );
    expect(orderRepo.updateById).not.toHaveBeenCalled();
  });

  it('marks order failed after retries exhausted', async () => {
    orderRepo.findById.mockResolvedValue({
      id: 'order1',
      tokenIn: 'x',
      tokenOut: 'y',
      amountIn: 10,
      slippage: 1,
    });

    router.route.mockRejectedValue(new Error('router failed'));

    const worker = new OrderWorker(orderRepo, ws, router, mockRay, mockMet);
    const job = fakeJob('order1', 3); // attempts exhausted

    await expect(worker.process('order1', job)).rejects.toThrow();

    // last call to updateById should mark failed
    expect(orderRepo.updateById).toHaveBeenCalled();
    const lastCallArg =
      orderRepo.updateById.mock.calls[
        orderRepo.updateById.mock.calls.length - 1
      ][1];
    expect(lastCallArg.status).toBe('failed');
  });
});
