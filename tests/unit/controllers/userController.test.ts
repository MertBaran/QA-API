import 'reflect-metadata';
import { UserController } from '../../../controllers/userController';
import { Request, Response, NextFunction } from 'express';
import { IAdminService } from '../../../services/contracts/IAdminService';
import { IUserRoleService } from '../../../services/contracts/IUserRoleService';
import { FakeAdminService } from '../../mocks/services/FakeAdminService';
import { FakeUserRoleService } from '../../mocks/services/FakeUserRoleService';
import { FakeExceptionTracker } from '../../mocks/error/FakeExceptionTracker';
import { container } from 'tsyringe';

// Mock the container
jest.mock('../../../services/container', () => ({
  container: {
    resolve: jest.fn(),
  },
}));

describe('UserController Unit Tests', () => {
  let userController: UserController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;
  let fakeAdminService: FakeAdminService;
  let fakeUserRoleService: FakeUserRoleService;

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
    };

    // Create fake services
    fakeAdminService = new FakeAdminService();
    fakeUserRoleService = new FakeUserRoleService();

    // Create controller instance
    userController = new UserController(fakeAdminService, fakeUserRoleService);

    // Add some test data
    fakeAdminService.addUser({
      _id: 'user1',
      name: 'Test User 1',
      email: 'user1@test.com',
      password: 'hashedpassword',
      title: 'Developer',
      about: 'Test about',
      place: 'Test City',
      website: 'https://test.com',
      profile_image: 'profile1.jpg',
      blocked: false,
      createdAt: new Date(),
      language: 'en',
      notificationPreferences: { email: true, push: false, sms: false, webhook: false },
    });

    fakeAdminService.addUser({
      _id: 'user2',
      name: 'Test User 2',
      email: 'user2@test.com',
      password: 'hashedpassword',
      title: 'Designer',
      about: 'Test about 2',
      place: 'Test City 2',
      website: 'https://test2.com',
      profile_image: 'profile2.jpg',
      blocked: false,
      createdAt: new Date(),
      language: 'tr',
      notificationPreferences: { email: true, push: true, sms: false, webhook: false },
    });

    // Add user roles
    fakeUserRoleService.addUserRole('user1', 'role1', 'admin1');
    fakeUserRoleService.addUserRole('user1', 'role2', 'admin1');
    fakeUserRoleService.addUserRole('user2', 'role1', 'admin1');
  });

  describe('getSingleUser', () => {
    it('should return single user successfully', async () => {
      // Arrange
      mockRequest.params = { id: 'user1' };

      // Act
      await userController.getSingleUser(
        mockRequest as Request<{ id: string }>,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeAdminService.getSingleUser).toHaveBeenCalledWith('user1');
      expect(fakeUserRoleService.getUserActiveRoles).toHaveBeenCalledWith('user1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          _id: 'user1',
          name: 'Test User 1',
          email: 'user1@test.com',
          roles: ['role1', 'role2'],
          title: 'Developer',
          about: 'Test about',
          place: 'Test City',
          website: 'https://test.com',
          profile_image: 'profile1.jpg',
          blocked: false,
          createdAt: expect.any(Date),
          language: 'en',
          notificationPreferences: { email: true, push: false, sms: false, webhook: false },
        },
      });
    });

    it('should call next with error when user not found', async () => {
      // Arrange
      mockRequest.params = { id: 'nonexistent' };

      // Act
      await userController.getSingleUser(
        mockRequest as Request<{ id: string }>,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeAdminService.getSingleUser).toHaveBeenCalledWith('nonexistent');
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found',
          statusCode: 404,
        })
      );
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      mockRequest.params = { id: 'user1' };
      jest.spyOn(fakeAdminService, 'getSingleUser').mockRejectedValue(new Error('Service error'));

      // Act
      await userController.getSingleUser(
        mockRequest as Request<{ id: string }>,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'User not found',
          statusCode: 404,
        })
      );
    });
  });

  describe('getAllUsers', () => {
    it('should return all users successfully', async () => {
      // Act
      await userController.getAllUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(fakeAdminService.getAllUsers).toHaveBeenCalled();
      expect(fakeUserRoleService.getUserActiveRoles).toHaveBeenCalledTimes(2);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [
          {
            _id: 'user1',
            name: 'Test User 1',
            email: 'user1@test.com',
            roles: ['role1', 'role2'],
            title: 'Developer',
            about: 'Test about',
            place: 'Test City',
            website: 'https://test.com',
            profile_image: 'profile1.jpg',
            blocked: false,
            createdAt: expect.any(Date),
            language: 'en',
            notificationPreferences: { email: true, push: false, sms: false, webhook: false },
          },
          {
            _id: 'user2',
            name: 'Test User 2',
            email: 'user2@test.com',
            roles: ['role1'],
            title: 'Designer',
            about: 'Test about 2',
            place: 'Test City 2',
            website: 'https://test2.com',
            profile_image: 'profile2.jpg',
            blocked: false,
            createdAt: expect.any(Date),
            language: 'tr',
            notificationPreferences: { email: true, push: true, sms: false, webhook: false },
          },
        ],
      });
    });

    it('should handle empty users list', async () => {
      // Arrange
      jest.spyOn(fakeAdminService, 'getAllUsers').mockResolvedValue([]);

      // Act
      await userController.getAllUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });

    it('should handle service errors gracefully', async () => {
      // Arrange
      jest.spyOn(fakeAdminService, 'getAllUsers').mockRejectedValue(new Error('Service error'));

      // Act
      await userController.getAllUsers(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Service error',
        })
      );
    });
  });
});
