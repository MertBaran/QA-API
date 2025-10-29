import { injectable, inject } from 'tsyringe';
import WebSocket from 'ws';
import { ILoggerProvider } from '../infrastructure/logging/ILoggerProvider';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: Date;
}

@injectable()
export class InternalWebSocketClient {
  private client: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 5000; // 5 seconds
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(@inject('ILoggerProvider') private logger: ILoggerProvider) {}

  public connect = (wsUrl: string): void => {
    // Silent connection - don't log for internal client
    try {
      this.client = new WebSocket(wsUrl);
      this.client.on('open', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        // Silent success
      });

      this.client.on('message', (data: WebSocket.Data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          // Silent parse error
        }
      });

      this.client.on('close', () => {
        this.isConnected = false;
        // Silent close
        this.scheduleReconnect(wsUrl);
      });

      this.client.on('error', () => {
        this.isConnected = false;
        // Silent error
      });
    } catch (error) {
      // Silent setup error
      this.scheduleReconnect(wsUrl);
    }
  };

  public disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.client) {
      this.client.close();
      this.client = null;
    }

    this.isConnected = false;
    this.logger.info('🔌 Internal WebSocket client disconnected manually');
  }

  public isClientConnected(): boolean {
    return this.isConnected && this.client?.readyState === WebSocket.OPEN;
  }

  private scheduleReconnect(wsUrl: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      // Silent - max attempts reached
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    // Silent reconnect scheduling

    this.reconnectTimeout = setTimeout(() => {
      this.connect(wsUrl);
    }, delay);
  }

  private handleMessage(message: WebSocketMessage): void {
    // Internal client doesn't need to handle specific messages
    // It just keeps the connection alive for monitoring
    // Silent - don't log every message to avoid console spam
  }

  public sendMessage(message: WebSocketMessage): void {
    if (this.isClientConnected() && this.client) {
      try {
        this.client.send(JSON.stringify(message));
      } catch (error) {
        this.logger.error(
          'Failed to send message from internal WebSocket client:',
          {
            error: error instanceof Error ? error.message : String(error),
          }
        );
      }
    }
  }
}
