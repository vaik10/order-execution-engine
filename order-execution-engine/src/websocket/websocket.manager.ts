import {injectable, BindingScope} from '@loopback/core';
import WebSocket, {WebSocketServer} from 'ws';
import {logger} from '../helpers/logger';

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
      logger.info({orderId}, '[WS] Client connected');

      if (!this.connections.has(orderId)) {
        this.connections.set(orderId, new Set());
      }
      this.connections.get(orderId)!.add(ws);

      ws.on('close', () => {
        this.connections.get(orderId)?.delete(ws);
        logger.info({orderId}, '[WS] Client disconnected');
      });
    });
  }

  send(orderId: string, data: any) {
    logger.debug(`[WS] send called for ${orderId} -> ${JSON.stringify(data)}`);
    const serialized = JSON.stringify(data);

    const sockets = this.connections.get(orderId);
    logger.info(`[WS] sockets found: ${sockets ? sockets.size : 0} `);
    if (!sockets) return;

    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        logger.debug({orderId, data}, '[WS] Sending event');
        ws.send(serialized);
      }
    }
  }
}
