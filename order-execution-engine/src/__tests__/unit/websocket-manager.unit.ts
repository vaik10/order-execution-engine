// src/__tests__/unit/websocket.manager.unit.ts
import {WebSocketManager} from '../../websocket/websocket.manager';

describe('WebSocketManager', () => {
  it('stores connections and sends messages', () => {
    const wsSend = jest.fn();
    const fakeWs: any = {send: wsSend, readyState: 1};
    const mgr = new WebSocketManager();

    // For test purposes we add directly to the connections map
    (mgr as any).connections.set('order123', new Set([fakeWs]));

    mgr.send('order123', {status: 'test'});

    expect(wsSend).toHaveBeenCalledTimes(1);
    expect(wsSend).toHaveBeenCalledWith(JSON.stringify({status: 'test'}));
  });

  it('ignores missing orderId connections gracefully', () => {
    const mgr = new WebSocketManager();
    expect(() => mgr.send('nope', {x: 1})).not.toThrow();
  });
});
