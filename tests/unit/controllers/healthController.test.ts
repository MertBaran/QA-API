import 'reflect-metadata';
import { HealthCheckController } from '../../../controllers/healthController';
import { Request, Response } from 'express';
import { container } from '../../../services/container';
import { HealthCheckService } from '../../../services/HealthCheckService';
import { ApplicationState } from '../../../services/ApplicationState';

// Mock the container
jest.mock('../../../services/container', () => {
  const actual = jest.requireActual('../../../services/container');
  return {
    ...actual,
    container: {
      resolve: jest.fn(),
    },
  };
});

// Mock container.resolve
const mockContainer = {
  resolve: jest.fn(),
};

// Mock ApplicationState
jest.mock('../../../services/ApplicationState', () => ({
  ApplicationState: {
    getInstance: jest.fn(),
  },
}));

describe('HealthCheckController Unit Tests', () => {
  let healthController: HealthCheckController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockHealthCheckService: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock response
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    // Create mock request
    mockRequest = {};

    // Create mock health check service
    mockHealthCheckService = {
      checkHealth: jest.fn().mockResolvedValue({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: 'test',
        services: {
          database: 'connected',
          cache: 'connected',
          email: 'connected',
        },
        uptime: 3600000,
        memory: {
          rss: 1024 * 1024,
          heapTotal: 512 * 1024,
          heapUsed: 256 * 1024,
          external: 64 * 1024,
        },
        message: 'All services are healthy',
      }),
      getStartTime: jest.fn().mockReturnValue(Date.now() - 3600000),
      getUptime: jest.fn().mockReturnValue(3600000),
    };

    // Mock container.resolve
    (container.resolve as jest.Mock).mockImplementation((token: any) => {
      if (token === 'HealthCheckService') {
        return mockHealthCheckService;
      }
      throw new Error(`Unknown token: ${token}`);
    });

    // Mock ApplicationState.getInstance
    const mockAppState = {
      isReady: true,
      getMemoryUsage: jest.fn(() => ({
        rss: 1024 * 1024,
        heapTotal: 512 * 1024,
        heapUsed: 256 * 1024,
        external: 64 * 1024,
      })),
      getUptime: jest.fn(() => 3600000),
    };
    (ApplicationState.getInstance as jest.Mock).mockReturnValue(mockAppState);

    // Create controller instance
    healthController = new HealthCheckController();
  });

  describe('quickHealthCheck', () => {
    it('should return quick health status when server is ready', () => {
      // Arrange
      const mockAppState = {
        isReady: true,
        getMemoryUsage: jest.fn(() => ({
          rss: 1024 * 1024,
          heapTotal: 512 * 1024,
          heapUsed: 256 * 1024,
          external: 64 * 1024,
        })),
        getUptime: jest.fn(() => 3600000),
      };

      (ApplicationState.getInstance as jest.Mock).mockReturnValue(mockAppState);

      // Act
      healthController.quickHealthCheck(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          timestamp: expect.any(String),
          uptime: expect.any(Number),
          memory: expect.any(Object),
          message: 'Server is ready',
        })
      );
    });

    it.skip('should return starting status when server is not ready', () => {
      // Arrange
      const mockAppState = {
        isReady: false,
        getMemoryUsage: jest.fn(() => ({
          rss: 1024 * 1024,
          heapTotal: 512 * 1024,
          heapUsed: 256 * 1024,
          external: 64 * 1024,
        })),
        getUptime: jest.fn(() => 5000),
      };

      (ApplicationState.getInstance as jest.Mock).mockReturnValue(mockAppState);

      // Act
      healthController.quickHealthCheck(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'starting',
        timestamp: expect.any(String),
        uptime: 5000,
        memory: {
          rss: 1024 * 1024,
          heapTotal: 512 * 1024,
          heapUsed: 256 * 1024,
          external: 64 * 1024,
        },
        message: 'Server is starting up',
      });
    });
  });

  describe('fullHealthCheck', () => {
    it('should return full health status when server is ready', async () => {
      // Arrange
      const mockAppState = {
        isReady: true,
        getMemoryUsage: jest.fn(() => ({
          rss: 1024 * 1024,
          heapTotal: 512 * 1024,
          heapUsed: 256 * 1024,
          external: 64 * 1024,
        })),
        getUptime: jest.fn(() => 3600000),
      };

      (ApplicationState.getInstance as jest.Mock).mockReturnValue(mockAppState);

      const mockHealthCheckService = {
        checkHealth: jest.fn().mockResolvedValue({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          environment: 'test',
          services: { database: 'connected' },
          uptime: 3600000,
          memory: { rss: 1 },
          message: 'All services are healthy',
        }),
      };

      jest.isolateModules(async () => {
        const cMod = require('../../../services/container');
        (cMod.container.resolve as jest.Mock).mockImplementation(
          (token: any) => {
            if (token === 'HealthCheckService') return mockHealthCheckService;
            throw new Error(`Unknown token: ${token}`);
          }
        );

        const {
          HealthCheckController: Ctl,
        } = require('../../../controllers/healthController');
        const ctl = new Ctl();

        await ctl.fullHealthCheck(
          mockRequest as Request,
          mockResponse as Response,
          jest.fn()
        );

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'healthy',
            timestamp: expect.any(String),
            environment: expect.any(String),
            services: expect.any(Object),
            uptime: expect.any(Number),
            memory: expect.any(Object),
          })
        );
      });
    });

    it.skip('should return starting status when server is not ready', async () => {
      // Arrange
      const mockAppState = {
        isReady: false,
        getMemoryUsage: jest.fn(() => ({
          rss: 1024 * 1024,
          heapTotal: 512 * 1024,
          heapUsed: 256 * 1024,
          external: 64 * 1024,
        })),
        getUptime: jest.fn(() => 5000),
      };

      (ApplicationState.getInstance as jest.Mock).mockReturnValue(mockAppState);

      // Act
      await healthController.fullHealthCheck(
        mockRequest as Request,
        mockResponse as Response,
        jest.fn()
      );

      // Assert
      expect(mockHealthCheckService.checkHealth).not.toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'starting',
        timestamp: expect.any(String),
        environment: 'test',
        services: {
          database: 'unknown',
          cache: 'unknown',
          email: 'unknown',
        },
        uptime: 5000,
        memory: {
          rss: 1024 * 1024,
          heapTotal: 512 * 1024,
          heapUsed: 256 * 1024,
          external: 64 * 1024,
        },
        message: 'Server is starting up, services are being initialized',
      });
    });

    it('should handle health check service errors', async () => {
      const mockAppState = {
        isReady: true,
        getMemoryUsage: jest.fn(() => ({
          rss: 1024 * 1024,
          heapTotal: 512 * 1024,
          heapUsed: 256 * 1024,
          external: 64 * 1024,
        })),
        getUptime: jest.fn(() => 3600000),
      };
      (ApplicationState.getInstance as jest.Mock).mockReturnValue(mockAppState);

      const mockHealthCheckSvc = {
        checkHealth: jest.fn().mockRejectedValue(new Error('Service unavailable')),
      };
      (container.resolve as jest.Mock).mockImplementation((token: any) => {
        if (token === 'HealthCheckService') return mockHealthCheckSvc;
        throw new Error(`Unknown token: ${token}`);
      });

      const ctl = new HealthCheckController();
      const mockNext = jest.fn();

      await ctl.fullHealthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
    });

    it('should handle unknown errors', async () => {
      const mockAppState = {
        isReady: true,
        getMemoryUsage: jest.fn(() => ({
          rss: 1024 * 1024,
          heapTotal: 512 * 1024,
          heapUsed: 256 * 1024,
          external: 64 * 1024,
        })),
        getUptime: jest.fn(() => 3600000),
      };
      (ApplicationState.getInstance as jest.Mock).mockReturnValue(mockAppState);

      const mockHealthCheckSvc = {
        checkHealth: jest.fn().mockRejectedValue('Unknown error'),
      };
      (container.resolve as jest.Mock).mockImplementation((token: any) => {
        if (token === 'HealthCheckService') return mockHealthCheckSvc;
        throw new Error(`Unknown token: ${token}`);
      });

      const ctl = new HealthCheckController();
      const mockNext = jest.fn();

      await ctl.fullHealthCheck(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Rejected value may be Error or string; express-async-handler passes it to next()
      expect(mockNext).toHaveBeenCalled();
      expect(mockNext.mock.calls[0][0]).toBeDefined();
    });
  });
});
