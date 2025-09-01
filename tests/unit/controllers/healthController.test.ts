import 'reflect-metadata';
import { HealthCheckController } from '../../../controllers/healthController';
import { Request, Response } from 'express';
import { container } from '../../../services/container';
import { HealthCheckService } from '../../../services/HealthCheckService';
import { ApplicationState } from '../../../services/ApplicationState';

// Mock the container
jest.mock('../../../services/container', () => ({
  container: {
    resolve: jest.fn(),
  },
}));

// Mock container.resolve
const mockContainer = {
  resolve: jest.fn(),
};

// Mock ApplicationState
jest.mock('../../../services/ApplicationState', () => ({
  ApplicationState: {
    getInstance: jest.fn(() => ({
      isReady: true,
      getMemoryUsage: jest.fn(() => ({
        rss: 1024 * 1024,
        heapTotal: 512 * 1024,
        heapUsed: 256 * 1024,
        external: 64 * 1024,
      })),
      getUptime: jest.fn(() => 3600000), // 1 hour in milliseconds
    })),
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
    (container.resolve as jest.Mock).mockImplementation((token: string) => {
      if (token === 'HealthCheckService') {
        //return mockHealthManager;
      }
      throw new Error(`Unknown token: ${token}`);
    });

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
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'healthy',
        timestamp: expect.any(String),
        uptime: 3600000,
        memory: {
          rss: 1024 * 1024,
          heapTotal: 512 * 1024,
          heapUsed: 256 * 1024,
          external: 64 * 1024,
        },
        message: 'Server is ready',
      });
    });

    it('should return starting status when server is not ready', () => {
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
        mockResponse as Response
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

      // Act
      await healthController.fullHealthCheck(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockHealthCheckService.checkHealth).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'healthy',
        timestamp: expect.any(String),
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
      });
    });

    it('should return starting status when server is not ready', async () => {
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
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'starting',
        timestamp: expect.any(String),
        environment: 'unknown',
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
      mockHealthCheckService.checkHealth.mockRejectedValue(
        new Error('Service unavailable')
      );

      // Act
      await healthController.fullHealthCheck(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Health check failed',
        error: 'Service unavailable',
      });
    });

    it('should handle unknown errors', async () => {
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
      mockHealthCheckService.checkHealth.mockRejectedValue('Unknown error');

      // Act
      await healthController.fullHealthCheck(
        mockRequest as Request,
        mockResponse as Response
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'error',
        message: 'Health check failed',
        error: 'Unknown error',
      });
    });
  });
});
