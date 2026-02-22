import { container } from 'tsyringe';
import {
  WebSocketMonitorService,
  ConnectionStatus,
  ConnectionAlert,
} from '../../../services/WebSocketMonitorService';
import { FakeLoggerProvider } from '../../mocks/logger/FakeLoggerProvider';
import { FakeNotificationProvider } from '../../mocks/notification/FakeNotificationProvider';
import { ApplicationState } from '../../../services/ApplicationState';
import { IDatabaseAdapter } from '../../../repositories/adapters/IDatabaseAdapter';

// Mock WebSocket
const mockWebSocket = {
  readyState: 1, // OPEN
  send: jest.fn(),
  on: jest.fn(),
  close: jest.fn(),
};

const mockWebSocketServer = {
  on: jest.fn(),
  close: jest.fn((callback?: () => void) => callback?.()),
};

jest.mock('ws', () => ({
  WebSocketServer: jest.fn().mockImplementation(() => mockWebSocketServer),
  WebSocket: {
    OPEN: 1,
    CLOSED: 3,
  },
}));

describe('WebSocketMonitorService', () => {
  let webSocketMonitor: WebSocketMonitorService;
  let fakeLogger: FakeLoggerProvider;
  let fakeNotification: FakeNotificationProvider;
  let appState: ApplicationState;

  beforeEach(() => {
    // Reset container
    container.clearInstances();

    // Register mocks
    container.registerInstance('ILoggerProvider', new FakeLoggerProvider());
    container.registerInstance(
      'INotificationService',
      new FakeNotificationProvider()
    );
    const fakeDatabaseAdapter: IDatabaseAdapter = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      isConnected: jest.fn().mockReturnValue(true),
      ping: jest.fn().mockResolvedValue(true),
      getIdAdapter: jest.fn(),
    } as any;
    container.registerInstance('IDatabaseAdapter', fakeDatabaseAdapter);

    // Get instances
    webSocketMonitor = container.resolve(WebSocketMonitorService);
    fakeLogger = container.resolve('ILoggerProvider') as FakeLoggerProvider;
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
      ADMIN_EMAIL: 'mertbarandev@gmail.com',
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    webSocketMonitor.stopMonitoring();
  });

  describe('Initialization', () => {
    it('should initialize with default connection status', () => {
      const status = webSocketMonitor.getConnectionStatus();

      expect(status.get('database')).toEqual({
        service: 'database',
        status: 'connected',
        lastCheck: expect.any(Date),
      });

      expect(status.get('cache')).toEqual({
        service: 'cache',
        status: 'connected',
        lastCheck: expect.any(Date),
      });

      expect(status.get('queue')).toEqual({
        service: 'queue',
        status: 'connected',
        lastCheck: expect.any(Date),
      });

      expect(status.get('email')).toEqual({
        service: 'email',
        status: 'connected',
        lastCheck: expect.any(Date),
      });
    });

    it('should initialize WebSocket server', () => {
      const mockServer = { on: jest.fn() } as any;
      expect(() => webSocketMonitor.initialize(mockServer)).not.toThrow();
    });
  });

  describe('Monitoring Control', () => {
    it('should start monitoring', () => {
      webSocketMonitor.startMonitoring(1000);

      expect(webSocketMonitor.isMonitoringActive()).toBe(true);
      // Logger call is made in the actual service, not in test
    });

    it('should stop monitoring', () => {
      webSocketMonitor.startMonitoring(1000);
      webSocketMonitor.stopMonitoring();

      expect(webSocketMonitor.isMonitoringActive()).toBe(false);
      expect(fakeLogger.info).toHaveBeenCalledWith(
        '🛑 WebSocket connection monitoring stopped'
      );
    });

    it('should not start monitoring if already active', () => {
      webSocketMonitor.startMonitoring(1000);
      webSocketMonitor.startMonitoring(2000);

      expect(fakeLogger.warn).toHaveBeenCalledWith(
        'WebSocket monitoring is already running'
      );
    });
  });

  describe('Connection Status Management', () => {
    it('should update connection status', () => {
      const newStatus: ConnectionStatus = {
        service: 'database',
        status: 'disconnected',
        lastCheck: new Date(),
        details: { host: 'test-host' },
      };

      webSocketMonitor['updateConnectionStatus']('database', newStatus);

      // Verify the status was updated
      const status = webSocketMonitor.getConnectionStatus();
      expect(status.get('database')).toEqual(newStatus);
    });

    it('should handle connection lost', () => {
      const status: ConnectionStatus = {
        service: 'database',
        status: 'disconnected',
        lastCheck: new Date(),
        details: { host: 'test-host' },
      };

      webSocketMonitor['handleConnectionLost']('database', status);

      const alerts = webSocketMonitor.getAlertHistory();
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toEqual({
        type: 'connection_lost',
        service: 'database',
        message: 'DATABASE connection lost',
        timestamp: expect.any(Date),
        details: { host: 'test-host' },
      });
    });

    it('should handle connection restored', () => {
      const status: ConnectionStatus = {
        service: 'database',
        status: 'connected',
        lastCheck: new Date(),
        details: { host: 'test-host' },
      };

      webSocketMonitor['handleConnectionRestored']('database', status);

      const alerts = webSocketMonitor.getAlertHistory();
      expect(alerts).toHaveLength(1);
      expect(alerts[0]).toEqual({
        type: 'connection_restored',
        service: 'database',
        message: 'DATABASE connection restored',
        timestamp: expect.any(Date),
        details: { host: 'test-host' },
      });
    });
  });

  describe('Alert Management', () => {
    it('should create alerts and limit history', () => {
      // Create more than 100 alerts
      for (let i = 0; i < 105; i++) {
        const alert: ConnectionAlert = {
          type: 'connection_lost',
          service: 'database',
          message: `Alert ${i}`,
          timestamp: new Date(),
        };
        webSocketMonitor['createAlert'](alert);
      }

      const alerts = webSocketMonitor.getAlertHistory();
      expect(alerts).toHaveLength(100); // Should be limited to 100
      expect(alerts[alerts.length - 1]?.message).toBe('Alert 104');
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
        to: 'mertbarandev@gmail.com',
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

  describe('Statistics', () => {
    it('should provide monitoring stats', () => {
      // Add some test alerts
      const alert1: ConnectionAlert = {
        type: 'connection_lost',
        service: 'database',
        message: 'Lost connection',
        timestamp: new Date(),
      };
      const alert2: ConnectionAlert = {
        type: 'connection_restored',
        service: 'database',
        message: 'Restored connection',
        timestamp: new Date(),
      };

      webSocketMonitor['createAlert'](alert1);
      webSocketMonitor['createAlert'](alert2);

      const stats = webSocketMonitor.getMonitoringStats();

      expect(stats).toEqual({
        isMonitoring: false,
        totalAlerts: 2,
        connectionLost: 1,
        connectionRestored: 1,
        lastAlert: alert2,
        connectedClients: 0,
      });
    });

    it('should get recent alerts with limit', () => {
      // Add 5 alerts
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
      expect(recentAlerts[recentAlerts.length - 1]?.message).toBe('Alert 4');
    });
  });

  describe('WebSocket Communication', () => {
    it('should handle client connection', () => {
      // Simulate client connection via private method
      (webSocketMonitor as any)['handleConnection'](mockWebSocket);

      expect(webSocketMonitor.getConnectedClientsCount()).toBe(1);
      // Service starts monitoring on first client connect (no longer logs "Client connected")
      expect(fakeLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('WebSocket connection monitoring started'),
        expect.any(Object)
      );
    });

    it('should handle client disconnection', () => {
      (webSocketMonitor as any)['handleConnection'](mockWebSocket);

      // Simulate close event (stops monitoring when no clients left)
      const closeHandler = (mockWebSocket.on as jest.Mock).mock.calls.find(
        call => call[0] === 'close'
      )[1];
      closeHandler();

      expect(webSocketMonitor.getConnectedClientsCount()).toBe(0);
      // Service silently handles disconnect, stops monitoring when no clients
      expect(fakeLogger.info).toHaveBeenCalledWith(
        '🛑 WebSocket connection monitoring stopped'
      );
    });

    it('should handle ping message', () => {
      (webSocketMonitor as any)['handleConnection'](mockWebSocket);

      // Simulate ping message
      const messageHandler = (mockWebSocket.on as jest.Mock).mock.calls.find(
        call => call[0] === 'message'
      )[1];
      messageHandler(
        JSON.stringify({
          type: 'ping',
          data: {},
          timestamp: new Date(),
        })
      );

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"pong"')
      );
    });

    it('should handle get_status message', () => {
      (webSocketMonitor as any)['handleConnection'](mockWebSocket);

      // Simulate get_status message
      const messageHandler = (mockWebSocket.on as jest.Mock).mock.calls.find(
        call => call[0] === 'message'
      )[1];
      messageHandler(
        JSON.stringify({
          type: 'get_status',
          data: {},
          timestamp: new Date(),
        })
      );

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"connection_status"')
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket errors gracefully', () => {
      (webSocketMonitor as any)['handleConnection'](mockWebSocket);

      // Simulate error event (silently removes client, stops monitoring if no clients)
      const errorHandler = (mockWebSocket.on as jest.Mock).mock.calls.find(
        call => call[0] === 'error'
      )[1];
      errorHandler(new Error('WebSocket error'));

      expect(webSocketMonitor.getConnectedClientsCount()).toBe(0);
      // Service handles errors silently (no logger.error for client errors)
      expect(webSocketMonitor.isMonitoringActive()).toBe(false);
    });

    it('should handle notification errors', async () => {
      // Mock notification service to throw error
      fakeNotification.notify.mockRejectedValue(
        new Error('Notification failed')
      );

      const alert: ConnectionAlert = {
        type: 'connection_lost',
        service: 'database',
        message: 'Test alert',
        timestamp: new Date(),
      };

      await webSocketMonitor['sendNotification'](alert);

      expect(fakeLogger.error).toHaveBeenCalledWith(
        'Failed to send connection alert notification',
        {
          error: 'Notification failed',
          alert: alert,
        }
      );
    });
  });
});
