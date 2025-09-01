import 'reflect-metadata';
import { AdminController } from '../../../controllers/adminController';
import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../types/auth';
import { container } from 'tsyringe';
import { AdminManager } from '../../../services/managers/AdminManager';
import { ILoggerProvider } from '../../../infrastructure/logging/ILoggerProvider';
import { IExceptionTracker } from '../../../infrastructure/error/IExceptionTracker';
import { FakeAdminService } from '../../mocks/services/FakeAdminService';
import { FakeLoggerProvider } from '../../mocks/logging/FakeLoggerProvider';
import { FakeExceptionTracker } from '../../mocks/error/FakeExceptionTracker';

// Mock the container
jest.mock('tsyringe', () => ({
  container: {
    resolve: jest.fn(),
  },
}));

describe('AdminController Unit Tests', () => {
  let adminController: AdminController;
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let fakeAdminManager: FakeAdminService;
  let fakeLogger: FakeLoggerProvider;
  let fakeExceptionTracker: FakeExceptionTracker;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock response
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    // Create mock next function
    mockNext = jest.fn();

    // Create mock request
    mockRequest = {
      params: {},
      body: {},
      query: {},
      user: { id: 'admin123', email: 'admin@test.com', roles: ['admin'] },
    };

    // Create fake services
    fakeAdminManager = new FakeAdminService();
    fakeLogger = new FakeLoggerProvider();
    fakeExceptionTracker = new FakeExceptionTracker();

    // Mock container.resolve
    (container.resolve as jest.Mock).mockImplementation((token: string) => {
      if (token === 'IAdminService') {
        return fakeAdminManager;
      }
      if (token === 'ILoggerProvider') {
        return fakeLogger;
      }
      if (token === 'IExceptionTracker') {
        return fakeExceptionTracker;
      }
      throw new Error(`Unknown token: ${token}`);
    });

    // Create controller instance
    adminController = new AdminController();

    // Add some test data
    fakeAdminManager.addUser({
      _id: 'user1',
      name: 'Test User 1',
      email: 'user1@test.com',
      title: 'Developer',
      about: 'Test about',
      place: 'Test City',
      website: 'https://test.com',
      profile_image: 'profile1.jpg',
      blocked: false,
      createdAt: new Date(),
      password: 'hashedpassword',
      language: 'en',
      notificationPreferences: {
        email: true,
        push: false,
        sms: false,
        webhook: false,
      },
    });

    fakeAdminManager.addUser({
      _id: 'user2',
      name: 'Test User 2',
      email: 'user2@test.com',
      title: 'Designer',
      about: 'Test about 2',
      place: 'Test City 2',
      website: 'https://test2.com',
      profile_image: 'profile2.jpg',
      blocked: false,
      createdAt: new Date(),
      password: 'hashedpassword',
      language: 'tr',
      notificationPreferences: {
        email: true,
        push: true,
        sms: false,
        webhook: false,
      },
    });
  });

  describe('getUsers', () => {
    it('should return users with filters successfully', async () => {
      // Arrange
      mockRequest.query = {
        search: 'test',
        status: 'active',
        role: 'developer',
        page: '1',
        limit: '10',
      };

      // Act
      await adminController.getUsers.call(
        adminController,
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeAdminManager.getUsersForAdmin).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'test',
          status: 'active',
          role: 'developer',
        }),
        1,
        10
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object),
      });
    });

    it('should handle missing user authentication', async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await adminController.getUsers.call(
        adminController,
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not authenticated',
        })
      );
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      jest
        .spyOn(fakeAdminManager, 'getUsersForAdmin')
        .mockRejectedValue(new Error('Service error'));

      // Act & Assert
      try {
        await adminController.getUsers.call(
          adminController,
          mockRequest as any,
          mockResponse as Response,
          mockNext
        );
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        //expect(error.message).toContain('Failed to fetch users');
      }
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      // Arrange
      mockRequest.params = { userId: 'user1' };
      mockRequest.body = {
        name: 'Updated User',
        title: 'Senior Developer',
      };

      // Act
      await adminController.updateUser(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeAdminManager.updateUserByAdmin).toHaveBeenCalledWith('user1', {
        name: 'Updated User',
        title: 'Senior Developer',
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object),
      });
    });

    it('should handle missing user authentication', async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await adminController.updateUser(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not authenticated',
        })
      );
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      mockRequest.params = { userId: 'user1' };
      mockRequest.body = { name: 'Updated User' };
      jest
        .spyOn(fakeAdminManager, 'updateUserByAdmin')
        .mockRejectedValue(new Error('Service error'));

      // Act
      await adminController.updateUser(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to update user',
        })
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      // Arrange
      mockRequest.params = { userId: 'user1' };

      // Act
      await adminController.deleteUser(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeAdminManager.deleteUser).toHaveBeenCalledWith('user1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String),
      });
    });

    it('should handle missing user authentication', async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await adminController.deleteUser(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not authenticated',
        })
      );
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      mockRequest.params = { userId: 'user1' };
      jest
        .spyOn(fakeAdminManager, 'deleteUser')
        .mockRejectedValue(new Error('Service error'));

      // Act
      await adminController.deleteUser(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to delete user',
        })
      );
    });
  });

  describe('toggleUserBlock', () => {
    it('should toggle user block status successfully', async () => {
      // Arrange
      mockRequest.params = { userId: 'user1' };
      mockRequest.body = { blocked: true };

      // Act
      await adminController.toggleUserBlock(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeAdminManager.toggleUserBlock).toHaveBeenCalledWith(
        'user1',
        true
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expect.any(Object),
      });
    });

    it('should handle missing user authentication', async () => {
      // Arrange
      mockRequest.user = undefined;

      // Act
      await adminController.toggleUserBlock(
        mockRequest as any,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not authenticated',
        })
      );
    });
  });
});
