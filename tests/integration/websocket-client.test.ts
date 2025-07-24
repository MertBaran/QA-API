// WebSocket kullanılmıyor, kaldırıldı
import { container } from 'tsyringe';
import {
  WebSocketMonitorService,
  ConnectionStatus,
  ConnectionAlert,
} from '../../services/WebSocketMonitorService';
import { FakeLoggerProvider } from '../mocks/logger/FakeLoggerProvider';
import { FakeNotificationProvider } from '../mocks/notification/FakeNotificationProvider';
import { ApplicationState } from '../../services/ApplicationState';

describe('WebSocket Client Integration Tests', () => {
  let webSocketMonitor: WebSocketMonitorService;
  let _fakeLogger: FakeLoggerProvider;
  let fakeNotification: FakeNotificationProvider;
  let appState: ApplicationState;

  beforeAll(async () => {
    // Setup mocks
    container.registerInstance('ILoggerProvider', new FakeLoggerProvider());
    container.registerInstance(
      'INotificationService',
      new FakeNotificationProvider()
    );

    // Get instances
    webSocketMonitor = container.resolve(WebSocketMonitorService);
    _fakeLogger = container.resolve('ILoggerProvider') as FakeLoggerProvider;
    fakeNotification = container.resolve(
      'INotificationService'
    ) as FakeNotificationProvider;
    appState = ApplicationState.getInstance();

    // Mock ApplicationState
    appState.setReady({
      MONGO_URI: 'mongodb://localhost:27017/test',
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      SMTP_HOST: 'smtp.gmail.com',
      SMTP_PORT: 465,
      ADMIN_EMAIL: 'admin@test.com',
    });

    // Create proper mock server with required methods
    const mockServer = {
      on: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
      listeners: jest.fn().mockReturnValue([]),
      removeAllListeners: jest.fn(),
      setMaxListeners: jest.fn(),
      getMaxListeners: jest.fn().mockReturnValue(10),
      eventNames: jest.fn().mockReturnValue([]),
      listenerCount: jest.fn().mockReturnValue(0),
      prependListener: jest.fn(),
      prependOnceListener: jest.fn(),
      removeListener: jest.fn(),
      off: jest.fn(),
      addListener: jest.fn(),
    } as any;

    // Initialize WebSocket monitoring
    webSocketMonitor.initialize(mockServer);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear alert history between tests
    webSocketMonitor['alertHistory'] = [];
  });

  describe('WebSocket Service Basic Functionality', () => {
    it('should initialize with default connection status', () => {
      const status = webSocketMonitor.getConnectionStatus();

      expect(status.get('database')).toBeDefined();
      expect(status.get('cache')).toBeDefined();
      expect(status.get('queue')).toBeDefined();
      expect(status.get('email')).toBeDefined();
    });

    it('should start and stop monitoring', () => {
      webSocketMonitor.startMonitoring(1000);
      expect(webSocketMonitor.isMonitoringActive()).toBe(true);

      webSocketMonitor.stopMonitoring();
      expect(webSocketMonitor.isMonitoringActive()).toBe(false);
    });

    it('should handle connection status updates', () => {
      const newStatus: ConnectionStatus = {
        service: 'database',
        status: 'disconnected',
        lastCheck: new Date(),
        details: { host: 'test-host' },
      };

      webSocketMonitor['updateConnectionStatus']('database', newStatus);

      const status = webSocketMonitor.getConnectionStatus();
      expect(status.get('database')).toEqual(newStatus);
    });

    it('should create and manage alerts', () => {
      const alert: ConnectionAlert = {
        type: 'connection_lost',
        service: 'database',
        message: 'Test alert',
        timestamp: new Date(),
      };

      webSocketMonitor['createAlert'](alert);

      const alerts = webSocketMonitor.getAlertHistory();
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toEqual(alert);
    });

    it('should provide monitoring statistics', () => {
      const stats = webSocketMonitor.getMonitoringStats();

      expect(stats).toHaveProperty('isMonitoring');
      expect(stats).toHaveProperty('totalAlerts');
      expect(stats).toHaveProperty('connectedClients');
    });

    it('should get recent alerts with limit', () => {
      // Add some test alerts
      for (let i = 0; i < 5; i++) {
        const alert: ConnectionAlert = {
          type: 'connection_lost',
          service: 'database',
          message: `Alert ${i}`,
          timestamp: new Date(),
        };
        webSocketMonitor['createAlert'](alert);
      }

      const recentAlerts = webSocketMonitor.getRecentAlerts(3);
      expect(recentAlerts).toHaveLength(3);
    });

    it('should handle connection lost events', () => {
      const status: ConnectionStatus = {
        service: 'database',
        status: 'disconnected',
        lastCheck: new Date(),
        details: { host: 'test-host' },
      };

      webSocketMonitor['handleConnectionLost']('database', status);

      const alerts = webSocketMonitor.getAlertHistory();
      expect(alerts).toHaveLength(1);
      expect(alerts[0]?.type).toBe('connection_lost');
    });

    it('should handle connection restored events', () => {
      const status: ConnectionStatus = {
        service: 'database',
        status: 'connected',
        lastCheck: new Date(),
        details: { host: 'test-host' },
      };

      webSocketMonitor['handleConnectionRestored']('database', status);

      const alerts = webSocketMonitor.getAlertHistory();
      expect(alerts).toHaveLength(1);
      expect(alerts[0]?.type).toBe('connection_restored');
    });

    it('should send notifications for alerts', async () => {
      const alert: ConnectionAlert = {
        type: 'connection_lost',
        service: 'database',
        message: 'Test alert',
        timestamp: new Date(),
      };

      await webSocketMonitor['sendNotification'](alert);

      expect(fakeNotification.notify).toHaveBeenCalledWith({
        channel: 'email',
        to: 'admin@test.com',
        subject: 'Connection Alert: DATABASE',
        message: 'Test alert',
        data: {
          service: 'database',
          alertType: 'connection_lost',
          timestamp: expect.any(Date),
        },
        tags: ['system', 'connection', 'connection_lost'],
      });
    });
  });
});
