import request from 'supertest';
import { container } from 'tsyringe';
import { WebSocketMonitorService } from '../../services/WebSocketMonitorService';
import { FakeLoggerProvider } from '../mocks/logger/FakeLoggerProvider';
import { FakeNotificationProvider } from '../mocks/notification/FakeNotificationProvider';
import { ApplicationState } from '../../services/ApplicationState';
import app from '../testApp';

describe('Monitoring Integration Tests', () => {
  let webSocketMonitor: WebSocketMonitorService;
  let fakeLogger: FakeLoggerProvider;
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
      ADMIN_EMAIL: 'admin@test.com',
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/monitoring/connections', () => {
    it('should return connection status', async () => {
      const response = await request(app)
        .get('/api/monitoring/connections')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          connections: expect.arrayContaining([
            expect.objectContaining({
              service: 'database',
              status: 'connected',
              lastCheck: expect.any(String),
            }),
            expect.objectContaining({
              service: 'cache',
              status: 'connected',
              lastCheck: expect.any(String),
            }),
            expect.objectContaining({
              service: 'queue',
              status: 'connected',
              lastCheck: expect.any(String),
            }),
            expect.objectContaining({
              service: 'email',
              status: 'connected',
              lastCheck: expect.any(String),
            }),
          ]),
          monitoring: false,
          lastUpdate: expect.any(String),
        },
      });
    });
  });

  describe('GET /api/monitoring/alerts', () => {
    it('should return alert history with default limit', async () => {
      const response = await request(app)
        .get('/api/monitoring/alerts')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          alerts: expect.any(Array),
          total: expect.any(Number),
          limit: 50,
        },
      });
    });

    it('should return alert history with custom limit', async () => {
      const response = await request(app)
        .get('/api/monitoring/alerts?limit=10')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          alerts: expect.any(Array),
          total: expect.any(Number),
          limit: 10,
        },
      });
    });
  });

  describe('GET /api/monitoring/stats', () => {
    it('should return monitoring statistics', async () => {
      const response = await request(app)
        .get('/api/monitoring/stats')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          isMonitoring: false,
          totalAlerts: expect.any(Number),
          connectionLost: expect.any(Number),
          connectionRestored: expect.any(Number),
          lastAlert: expect.any(Object),
          connectedClients: expect.any(Number),
        },
      });
    });
  });

  describe('POST /api/monitoring/start', () => {
    it('should start monitoring with default interval', async () => {
      const response = await request(app)
        .post('/api/monitoring/start')
        .send({})
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Connection monitoring started',
        data: {
          interval: 30000,
          isActive: true,
        },
      });
    });

    it('should start monitoring with custom interval', async () => {
      const response = await request(app)
        .post('/api/monitoring/start')
        .send({ interval: 15000 })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Connection monitoring started',
        data: {
          interval: 15000,
          isActive: true,
        },
      });
    });
  });

  describe('POST /api/monitoring/stop', () => {
    it('should stop monitoring', async () => {
      // First start monitoring
      await request(app).post('/api/monitoring/start').send({});

      // Then stop it
      const response = await request(app)
        .post('/api/monitoring/stop')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Connection monitoring stopped',
        data: {
          isActive: false,
        },
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid request body', async () => {
      const response = await request(app)
        .post('/api/monitoring/start')
        .send({ interval: 'invalid' })
        .expect(200); // Should still work with default interval

      expect(response.body.success).toBe(true);
    });

    it('should handle missing service gracefully', async () => {
      // Mock WebSocketMonitorService to throw error
      jest
        .spyOn(webSocketMonitor, 'getConnectionStatus')
        .mockImplementation(() => {
          throw new Error('Service unavailable');
        });

      const response = await request(app)
        .get('/api/monitoring/connections')
        .expect(200); // Service handles error gracefully

      expect(response.body.success).toBe(true);
    });
  });
});
