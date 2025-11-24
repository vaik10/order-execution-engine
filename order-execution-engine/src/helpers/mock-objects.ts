// src/__tests__/helpers/fake-objects.ts
export function fakeOrderRepo() {
  return {
    findById: jest.fn(),
    updateById: jest.fn().mockResolvedValue(undefined),
  };
}

export function fakeWebSocketManager() {
  return {
    send: jest.fn(),
  };
}

export function fakeJob(orderId: string, attemptsMade = 0) {
  return {
    id: 'job1',
    data: {orderId},
    attemptsMade,
  } as any;
}
