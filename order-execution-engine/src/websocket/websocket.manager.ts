import {injectable, BindingScope} from '@loopback/core';
import WebSocket, {WebSocketServer} from 'ws';

@injectable({scope: BindingScope.SINGLETON})
export class WebSocketManager {
  private wss: WebSocketServer | null = null;

  // Map: orderId -> list of websocket connections
  private connections: Map<string, Set<WebSocket>> = new Map();

  start(server: any) {
    this.wss = new WebSocketServer({noServer: true});

    server.on('upgrade', (req: any, socket: any, head: any) => {
      console.log('[WS] upgrade event:', req.url);
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (url.pathname !== '/ws') return;

      const orderId = url.searchParams.get('orderId');
      if (!orderId) {
        socket.destroy();
        return;
      }

      this.wss!.handleUpgrade(req, socket, head, ws => {
        this.wss!.emit('connection', ws, orderId);
      });
    });

    this.wss.on('connection', (ws: WebSocket, orderId: string) => {
      console.log(`WS connected for order ${orderId}`);

      if (!this.connections.has(orderId)) {
        this.connections.set(orderId, new Set());
      }
      this.connections.get(orderId)!.add(ws);

      ws.on('close', () => {
        this.connections.get(orderId)?.delete(ws);
      });
    });
  }

  send(orderId: string, data: any) {
    console.log(`[WS] send called for ${orderId} -> ${JSON.stringify(data)}`);
    const serialized = JSON.stringify(data);

    const sockets = this.connections.get(orderId);
    console.log('[WS] sockets found?', sockets ? sockets.size : 0);
    if (!sockets) return;

    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(serialized);
      }
    }
  }
}
