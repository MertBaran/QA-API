import { injectable, inject } from 'tsyringe';
import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { ILoggerProvider } from '../infrastructure/logging/ILoggerProvider';
import { INotificationService } from './contracts/INotificationService';
import { ApplicationState } from './ApplicationState';
import { ICacheProvider } from '../infrastructure/cache/ICacheProvider';
import { container } from './container';

export interface ConnectionStatus {
  service: 'database' | 'cache' | 'queue' | 'email';
  status: 'connected' | 'disconnected' | 'reconnecting';
  lastCheck: Date;
  error?: string;
  details?: any;
}

export interface ConnectionAlert {
  type: 'connection_lost' | 'connection_restored' | 'connection_failed';
  service: string;
  message: string;
  timestamp: Date;
  details?: any;
}

export interface WebSocketMessage {
  type:
    | 'connection_status'
    | 'alert'
    | 'stats'
    | 'ping'
    | 'pong'
    | 'get_status'
    | 'get_alerts'
    | 'get_stats';
  data: any;
  timestamp: Date;
}

@injectable()
export class WebSocketMonitorService {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private connectionStatus: Map<string, ConnectionStatus> = new Map();
  private alertHistory: ConnectionAlert[] = [];
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private isMonitoring = false;
  private appState = ApplicationState.getInstance();

  // Circuit breaker for failed connections
  private circuitBreaker: Map<
    string,
    { failures: number; lastFailure: Date; skipUntil?: Date }
  > = new Map();
  private readonly MAX_FAILURES = 3;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds

  constructor(
    @inject('ILoggerProvider') private logger: ILoggerProvider,
    @inject('INotificationService')
    private notificationService: INotificationService
  ) {
    this.initializeStatus();
  }

  private initializeStatus(): void {
    this.connectionStatus.set('database', {
      service: 'database',
      status: 'connected',
      lastCheck: new Date(),
    });

    this.connectionStatus.set('cache', {
      service: 'cache',
      status: 'connected',
      lastCheck: new Date(),
    });

    this.connectionStatus.set('queue', {
      service: 'queue',
      status: 'connected',
      lastCheck: new Date(),
    });

    this.connectionStatus.set('email', {
      service: 'email',
      status: 'connected',
      lastCheck: new Date(),
    });
  }

  public initialize(server: Server): void {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket) => {
      this.handleConnection(ws);
    });

    //this.logger.info('🔌 WebSocket monitoring server initialized');
  }

  private handleConnection(ws: WebSocket): void {
    this.clients.add(ws);

    // Start monitoring when first client connects
    if (this.clients.size === 1 && !this.isMonitoring) {
      this.startMonitoring();
    }

    // Send current status to new client
    this.sendToClient(ws, {
      type: 'connection_status',
      data: Array.from(this.connectionStatus.values()),
      timestamp: new Date(),
    });

    // Send recent alerts
    this.sendToClient(ws, {
      type: 'alert',
      data: this.getRecentAlerts(10),
      timestamp: new Date(),
    });

    // Send monitoring stats
    this.sendToClient(ws, {
      type: 'stats',
      data: this.getMonitoringStats(),
      timestamp: new Date(),
    });

    ws.on('message', (message: string) => {
      this.handleMessage(ws, message);
    });

    ws.on('close', () => {
      this.clients.delete(ws);
      this.logger.info('Client disconnected from WebSocket monitoring');

      // Stop monitoring if no clients left
      if (this.clients.size === 0 && this.isMonitoring) {
        this.stopMonitoring();
      }
    });

    ws.on('error', (error: Error) => {
      this.logger.error('WebSocket error:', { error: error.message });
      this.clients.delete(ws);

      // Stop monitoring if no clients left
      if (this.clients.size === 0 && this.isMonitoring) {
        this.stopMonitoring();
      }
    });

    this.logger.info('Client connected to WebSocket monitoring');
  }

  private handleMessage(ws: WebSocket, message: string): void {
    try {
      const parsedMessage: WebSocketMessage = JSON.parse(message);

      switch (parsedMessage.type) {
        case 'ping':
          this.sendToClient(ws, {
            type: 'pong',
            data: { timestamp: new Date() },
            timestamp: new Date(),
          });
          break;

        case 'get_status':
          this.sendToClient(ws, {
            type: 'connection_status',
            data: Array.from(this.connectionStatus.values()),
            timestamp: new Date(),
          });
          break;

        case 'get_alerts': {
          const limit = parsedMessage.data?.limit || 50;
          this.sendToClient(ws, {
            type: 'alert',
            data: this.getRecentAlerts(limit),
            timestamp: new Date(),
          });
          break;
        }

        case 'get_stats':
          this.sendToClient(ws, {
            type: 'stats',
            data: this.getMonitoringStats(),
            timestamp: new Date(),
          });
          break;

        default:
          this.logger.warn('Unknown WebSocket message type:', {
            type: parsedMessage.type,
          });
      }
    } catch (error) {
      this.logger.error('Error handling WebSocket message:', {
        error: (error as Error).message,
      });
    }
  }

  private sendToClient(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private broadcast(message: WebSocketMessage): void {
    this.clients.forEach(client => {
      this.sendToClient(client, message);
    });
  }

  public startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      this.logger.warn('WebSocket monitoring is already running');
      return;
    }

    // Only start monitoring if there are active WebSocket clients
    if (this.clients.size === 0) {
      this.logger.info(
        'No WebSocket clients connected - monitoring not started'
      );
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      // Only monitor if there are active clients
      if (this.clients.size > 0) {
        this.checkAllConnections();
      } else {
        // No clients - stop monitoring to save resources
        this.stopMonitoring();
      }
    }, intervalMs);

    this.logger.info('🔍 WebSocket connection monitoring started', {
      interval: `${intervalMs}ms`,
      clients: this.clients.size,
      services: ['database', 'cache', 'queue', 'email'],
    });
  }

  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    this.logger.info('🛑 WebSocket connection monitoring stopped');
  }

  private async checkAllConnections(): Promise<void> {
    if (!this.appState.isReady) {
      return;
    }

    const config = this.appState.config;
    const checks = [
      this.checkDatabaseConnection(config.MONGO_URI),
      this.checkCacheConnection(config),
      this.checkQueueConnection(),
      this.checkEmailConnection(config),
    ];

    await Promise.allSettled(checks);
  }

  private shouldSkipCheck(service: string): boolean {
    const breaker = this.circuitBreaker.get(service);
    if (!breaker) return false;

    if (breaker.skipUntil && breaker.skipUntil > new Date()) {
      return true;
    }

    return false;
  }

  private recordFailure(service: string): void {
    const breaker = this.circuitBreaker.get(service) || {
      failures: 0,
      lastFailure: new Date(),
    };
    breaker.failures++;
    breaker.lastFailure = new Date();

    if (breaker.failures >= this.MAX_FAILURES) {
      breaker.skipUntil = new Date(Date.now() + this.CIRCUIT_BREAKER_TIMEOUT);
      this.logger.warn(
        `Circuit breaker opened for ${service} - skipping checks for ${this.CIRCUIT_BREAKER_TIMEOUT}ms`
      );
    }

    this.circuitBreaker.set(service, breaker);
  }

  private recordSuccess(service: string): void {
    const breaker = this.circuitBreaker.get(service);
    if (breaker && breaker.failures > 0) {
      breaker.failures = 0;
      breaker.skipUntil = undefined;
      this.logger.info(
        `Circuit breaker closed for ${service} - connection restored`
      );
      this.circuitBreaker.set(service, breaker);
    }
  }

  private async checkDatabaseConnection(mongoUri: string): Promise<void> {
    if (this.shouldSkipCheck('database')) {
      return;
    }

    try {
      // Real MongoDB connection test
      const mongoose = require('mongoose');

      // Try to ping the database
      await mongoose.connection.db.admin().ping();

      const previousStatus = this.connectionStatus.get('database');
      const newStatus: ConnectionStatus = {
        service: 'database',
        status: 'connected',
        lastCheck: new Date(),
        details: {
          host: new URL(mongoUri).hostname,
          database: new URL(mongoUri).pathname.substring(1),
          testResult: 'success',
        },
      };

      this.updateConnectionStatus('database', newStatus, previousStatus);
      this.recordSuccess('database');
    } catch (error) {
      this.recordFailure('database');

      // Database connection failed - notify clients but don't crash
      const previousStatus = this.connectionStatus.get('database');
      const newStatus: ConnectionStatus = {
        service: 'database',
        status: 'disconnected',
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : String(error),
        details: {
          host: mongoUri ? new URL(mongoUri).hostname : 'unknown',
          database: mongoUri
            ? new URL(mongoUri).pathname.substring(1)
            : 'unknown',
          testResult: 'failed',
        },
      };

      this.updateConnectionStatus('database', newStatus, previousStatus);

      // Notify WebSocket clients about database failure
      this.broadcast({
        type: 'alert',
        data: {
          type: 'connection_lost',
          service: 'database',
          message: 'MongoDB database connection lost',
          timestamp: new Date(),
          details: error instanceof Error ? error.message : String(error),
        },
        timestamp: new Date(),
      });
    }
  }

  private async checkCacheConnection(config: any): Promise<void> {
    if (this.shouldSkipCheck('cache')) {
      return;
    }

    try {
      // Real Redis connection test
      const cacheProvider = container.resolve<ICacheProvider>('ICacheProvider');

      // Try to perform a simple operation to test connection
      const testKey = `health-check-${Date.now()}`;
      await cacheProvider.set(testKey, 'test', 1); // 1 second TTL
      await cacheProvider.get(testKey);
      await cacheProvider.del(testKey);

      const previousStatus = this.connectionStatus.get('cache');
      const newStatus: ConnectionStatus = {
        service: 'cache',
        status: 'connected',
        lastCheck: new Date(),
        details: {
          host: config.REDIS_HOST,
          port: config.REDIS_PORT,
          testResult: 'success',
        },
      };

      this.updateConnectionStatus('cache', newStatus, previousStatus);
      this.recordSuccess('cache');
    } catch (error) {
      this.recordFailure('cache');

      // Cache connection failed - notify clients but don't crash
      const previousStatus = this.connectionStatus.get('cache');
      const newStatus: ConnectionStatus = {
        service: 'cache',
        status: 'disconnected',
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : String(error),
        details: {
          host: config.REDIS_HOST,
          port: config.REDIS_PORT,
          testResult: 'failed',
        },
      };

      this.updateConnectionStatus('cache', newStatus, previousStatus);

      // Notify WebSocket clients about cache failure
      this.broadcast({
        type: 'alert',
        data: {
          type: 'connection_lost',
          service: 'cache',
          message: 'Redis cache connection lost',
          timestamp: new Date(),
          details: error instanceof Error ? error.message : String(error),
        },
        timestamp: new Date(),
      });
    }
  }

  private async checkQueueConnection(): Promise<void> {
    try {
      const isConnected = true; // Assume connected for now

      const previousStatus = this.connectionStatus.get('queue');
      const newStatus: ConnectionStatus = {
        service: 'queue',
        status: isConnected ? 'connected' : 'disconnected',
        lastCheck: new Date(),
        details: {
          host: 'localhost',
          port: 5672,
        },
      };

      this.updateConnectionStatus('queue', newStatus, previousStatus);
    } catch (error) {
      this.handleConnectionError('queue', error as Error);
    }
  }

  private async checkEmailConnection(config: any): Promise<void> {
    try {
      const isConnected = config.SMTP_HOST && config.SMTP_PORT;

      const previousStatus = this.connectionStatus.get('email');
      const newStatus: ConnectionStatus = {
        service: 'email',
        status: isConnected ? 'connected' : 'disconnected',
        lastCheck: new Date(),
        details: {
          host: config.SMTP_HOST,
          port: config.SMTP_PORT,
        },
      };

      this.updateConnectionStatus('email', newStatus, previousStatus);
    } catch (error) {
      this.handleConnectionError('email', error as Error);
    }
  }

  private updateConnectionStatus(
    service: string,
    newStatus: ConnectionStatus,
    previousStatus?: ConnectionStatus
  ): void {
    this.connectionStatus.set(service, newStatus);

    // Broadcast status update to all clients
    this.broadcast({
      type: 'connection_status',
      data: Array.from(this.connectionStatus.values()),
      timestamp: new Date(),
    });

    // Check for status changes
    if (previousStatus && previousStatus.status !== newStatus.status) {
      if (newStatus.status === 'disconnected') {
        this.handleConnectionLost(service, newStatus);
      } else if (
        newStatus.status === 'connected' &&
        previousStatus.status === 'disconnected'
      ) {
        this.handleConnectionRestored(service, newStatus);
      }
    }
  }

  private handleConnectionLost(
    service: string,
    status: ConnectionStatus
  ): void {
    const alert: ConnectionAlert = {
      type: 'connection_lost',
      service,
      message: `${service.toUpperCase()} connection lost`,
      timestamp: new Date(),
      details: status.details,
    };

    this.createAlert(alert);
    this.sendNotification(alert);
  }

  private handleConnectionRestored(
    service: string,
    status: ConnectionStatus
  ): void {
    const alert: ConnectionAlert = {
      type: 'connection_restored',
      service,
      message: `${service.toUpperCase()} connection restored`,
      timestamp: new Date(),
      details: status.details,
    };

    this.createAlert(alert);
    this.sendNotification(alert);
  }

  private handleConnectionError(service: string, error: Error): void {
    const status: ConnectionStatus = {
      service: service as any,
      status: 'disconnected',
      lastCheck: new Date(),
      error: error.message,
    };

    this.connectionStatus.set(service, status);
    this.handleConnectionLost(service, status);
  }

  private createAlert(alert: ConnectionAlert): void {
    this.alertHistory.push(alert);

    // Keep only last 100 alerts
    if (this.alertHistory.length > 100) {
      this.alertHistory = this.alertHistory.slice(-100);
    }

    this.logger.error(`🚨 Connection Alert: ${alert.message}`, {
      service: alert.service,
      type: alert.type,
      timestamp: alert.timestamp,
      details: alert.details,
    });

    // Broadcast alert to all clients
    this.broadcast({
      type: 'alert',
      data: [alert],
      timestamp: new Date(),
    });
  }

  private async sendNotification(alert: ConnectionAlert): Promise<void> {
    try {
      const config = this.appState.config;
      const notificationPayload = {
        channel: 'email' as const,
        to: config.ADMIN_EMAIL || 'admin@example.com',
        subject: `Connection Alert: ${alert.service.toUpperCase()}`,
        message: alert.message,
        data: {
          service: alert.service,
          alertType: alert.type,
          timestamp: alert.timestamp,
          details: alert.details,
        },
        tags: ['system', 'connection', alert.type],
      };

      await this.notificationService.notify(notificationPayload);
    } catch (error) {
      this.logger.error('Failed to send connection alert notification', {
        error: (error as Error).message,
        alert: alert,
      });
    }
  }

  public getConnectionStatus(): Map<string, ConnectionStatus> {
    return new Map(this.connectionStatus);
  }

  public getAlertHistory(): ConnectionAlert[] {
    return [...this.alertHistory];
  }

  public getRecentAlerts(limit: number = 10): ConnectionAlert[] {
    return this.alertHistory.slice(-limit);
  }

  public isMonitoringActive(): boolean {
    return this.isMonitoring;
  }

  public getMonitoringStats(): any {
    const totalAlerts = this.alertHistory.length;
    const lostAlerts = this.alertHistory.filter(
      a => a.type === 'connection_lost'
    ).length;
    const restoredAlerts = this.alertHistory.filter(
      a => a.type === 'connection_restored'
    ).length;

    return {
      isMonitoring: this.isMonitoring,
      totalAlerts,
      connectionLost: lostAlerts,
      connectionRestored: restoredAlerts,
      lastAlert: this.alertHistory[this.alertHistory.length - 1] || null,
      connectedClients: this.clients.size,
    };
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }
}
