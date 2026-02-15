import { Server } from 'http';

// @ts-ignore - ws module types
import { WebSocketServer } from 'ws';

interface MetricUpdate {
  type: 'performance' | 'forecast' | 'optimization';
  data: Record<string, unknown>;
  timestamp: number;
}

interface ClientSubscription {
  clientId: string;
  types: Set<string>;
  ws: any;
}

export class WebSocketService {
  private static instance: WebSocketService;
  private wss: any = null;
  private clients: Map<string, ClientSubscription> = new Map();
  private clientCounter = 0;

  private constructor() {}

  static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: any) => {
      const clientId = `client_${++this.clientCounter}`;
      const subscription: ClientSubscription = {
        clientId,
        types: new Set(),
        ws,
      };

      this.clients.set(clientId, subscription);

      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message);
          this.handleClientMessage(clientId, data);
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`[WebSocket] Client ${clientId} disconnected`);
      });

      ws.on('error', (error: Error) => {
        console.error(`[WebSocket] Client ${clientId} error:`, error);
      });

      console.log(`[WebSocket] Client ${clientId} connected`);
    });
  }

  private handleClientMessage(clientId: string, data: Record<string, unknown>): void {
    const subscription = this.clients.get(clientId);
    if (!subscription) return;

    if (data.action === 'subscribe') {
      const types = data.types as string[];
      types.forEach(type => subscription.types.add(type));
      console.log(`[WebSocket] Client ${clientId} subscribed to:`, types);
    } else if (data.action === 'unsubscribe') {
      const types = data.types as string[];
      types.forEach(type => subscription.types.delete(type));
      console.log(`[WebSocket] Client ${clientId} unsubscribed from:`, types);
    }
  }

  broadcast(update: MetricUpdate): void {
    this.clients.forEach(subscription => {
      if (subscription.types.has(update.type) && subscription.ws.readyState === 1) {
        subscription.ws.send(JSON.stringify(update));
      }
    });
  }

  broadcastToAll(update: MetricUpdate): void {
    this.clients.forEach(subscription => {
      if (subscription.ws.readyState === 1) {
        subscription.ws.send(JSON.stringify(update));
      }
    });
  }

  getConnectedClients(): number {
    return this.clients.size;
  }

  close(): void {
    if (this.wss) {
      this.wss.close();
      this.clients.clear();
    }
  }
}

export const websocketService = WebSocketService.getInstance();
