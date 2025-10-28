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
    this.logger.info(`🔌 Connecting internal WebSocket client to: ${wsUrl}`);
    try {
      this.client = new WebSocket(wsUrl);
      this.client.on('open', () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.logger.info('✅ Internal WebSocket client connected');
      });

      this.client.on('message', (data: WebSocket.Data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          this.logger.error('Failed to parse WebSocket message:', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

      this.client.on('close', () => {
        this.isConnected = false;
        this.logger.warn('🔌 Internal WebSocket client disconnected');
        this.scheduleReconnect(wsUrl);
      });

      this.client.on('error', (error: Error) => {
        this.logger.error('Internal WebSocket client error:', {
          error: error.message,
        });
        this.isConnected = false;
      });
    } catch (error) {
      this.logger.error('Failed to set up internal WebSocket client:', {
        error: error instanceof Error ? error.message : String(error),
      });
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
      this.logger.error(
        'Max reconnection attempts reached for internal WebSocket client'
      );
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    this.logger.info(
      `🔄 Scheduling internal WebSocket reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connect(wsUrl);
    }, delay);
  }

  private handleMessage(message: WebSocketMessage): void {
    // Internal client doesn't need to handle specific messages
    // It just keeps the connection alive for monitoring
    this.logger.debug('Internal WebSocket client received message:', {
      type: message.type,
    });
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
