import 'reflect-metadata';
import { PermissionController } from '../../../controllers/permissionController';
import { Request, Response } from 'express';
import { IUserRoleService } from '../../../services/contracts/IUserRoleService';
import { IRoleService } from '../../../services/contracts/IRoleService';
import { IUserService } from '../../../services/contracts/IUserService';
import { FakeUserRoleService } from '../../mocks/services/FakeUserRoleService';
import { FakeRoleService } from '../../mocks/services/FakeRoleService';
import { FakeUserService } from '../../mocks/services/FakeUserService';

describe('PermissionController Unit Tests', () => {
  let permissionController: PermissionController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let fakeUserRoleService: FakeUserRoleService;
  let fakeRoleService: FakeRoleService;
  let fakeUserService: FakeUserService;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock response
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };

    // Create mock request
    mockRequest = {
      params: { id: 'role1' },
      user: { id: 'admin123', name: 'Admin User' },
    } as any;

    // Create fake services
    fakeUserRoleService = new FakeUserRoleService();
    fakeRoleService = new FakeRoleService();
    fakeUserService = new FakeUserService();

    // Create controller instance
    permissionController = new PermissionController(
      fakeUserRoleService,
      fakeRoleService,
      fakeUserService
    );

    // Add some test data
    fakeUserService.create({
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
      notificationPreferences: {
        email: true,
        push: false,
        sms: false,
        webhook: false,
      },
    });

    fakeRoleService.addRole({
      _id: 'role1',
      name: 'Developer',
      description: 'Developer role',
      permissions: ['read', 'write'],
      isSystem: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    fakeRoleService.addRole({
      _id: 'role2',
      name: 'Admin',
      description: 'Admin role',
      permissions: ['read', 'write', 'delete'],
      isSystem: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    fakeRoleService.addRole({
      _id: 'inactiveRole',
      name: 'Inactive Role',
      description: 'Inactive role for testing',
      permissions: ['read:basic'],
      isSystem: false,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign role to user successfully', async () => {
      // Arrange
      mockRequest.body = {
        userId: 'user1',
        roleId: 'role1',
        assignedBy: 'admin123',
      };

      // Act
      await permissionController.assignRoleToUser(
        mockRequest as any,
        mockResponse as Response
      );

      // Assert
      expect(fakeUserService.findById).toHaveBeenCalledWith('user1');
      expect(fakeRoleService.findById).toHaveBeenCalledWith('role1');
      expect(fakeUserRoleService.assignRoleToUser).toHaveBeenCalledWith(
        'user1',
        'role1',
        'admin123'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String),
        data: {
          userRole: expect.objectContaining({
            userId: 'user1',
            roleId: 'role1',
            isActive: true,
            assignedBy: 'admin123',
          }),
        },
      });
    });

    it('should handle user not found', async () => {
      // Arrange
      mockRequest.body = {
        userId: 'nonexistent',
        roleId: 'role1',
        assignedBy: 'admin123',
      };

      // Act
      await expect(
        permissionController.assignRoleToUser(
          mockRequest as any,
          mockResponse as Response
        )
      ).rejects.toThrow('User not found');
    });

    it('should handle role not found', async () => {
      // Arrange
      mockRequest.body = {
        userId: 'user1',
        roleId: 'nonexistent',
        assignedBy: 'admin123',
      };

      // Act
      await expect(
        permissionController.assignRoleToUser(
          mockRequest as any,
          mockResponse as Response
        )
      ).rejects.toThrow('Role not found');
    });

    it('should handle inactive role', async () => {
      // Arrange
      fakeRoleService.addRole({
        _id: 'inactiveRole',
        name: 'Inactive Role',
        description: 'Inactive role',
        permissions: ['read'],
        isSystem: false,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockRequest.body = {
        userId: 'user1',
        roleId: 'inactiveRole',
        assignedBy: 'admin123',
      };

      // Act
      await expect(
        permissionController.assignRoleToUser(
          mockRequest as any,
          mockResponse as Response
        )
      ).rejects.toThrow('Role is not active');
    });
  });

  describe('removeRoleFromUser', () => {
    it('should remove role from user successfully', async () => {
      // Arrange
      mockRequest.body = {
        userId: 'user1',
        roleId: 'role1',
      };

      // Add existing role assignment
      fakeUserRoleService.addUserRole('user1', 'role1', 'admin123');

      // Act
      await permissionController.removeRoleFromUser(
        mockRequest as any,
        mockResponse as Response
      );

      // Assert
      expect(fakeUserService.findById).toHaveBeenCalledWith('user1');
      expect(fakeRoleService.findById).toHaveBeenCalledWith('role1');
      expect(fakeUserRoleService.removeRoleFromUser).toHaveBeenCalledWith(
        'user1',
        'role1'
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: expect.any(String),
        data: {
          removedUserRole: expect.any(Object),
        },
      });
    });

    it('should handle user not found', async () => {
      // Arrange
      mockRequest.body = {
        userId: 'nonexistent',
        roleId: 'role1',
      };

      // Act
      await expect(
        permissionController.removeRoleFromUser(
          mockRequest as any,
          mockResponse as Response
        )
      ).rejects.toThrow('User not found');
    });

    it('should handle role not found', async () => {
      // Arrange
      mockRequest.body = {
        userId: 'user1',
        roleId: 'nonexistent',
      };

      // Act
      await expect(
        permissionController.removeRoleFromUser(
          mockRequest as any,
          mockResponse as Response
        )
      ).rejects.toThrow('Role not found');
    });
  });

  describe('getUserRoles', () => {
    it('should return user roles successfully', async () => {
      // Arrange
      mockRequest.params = { userId: 'user1' };

      // Add some roles to user
      fakeUserRoleService.addUserRole('user1', 'role1', 'admin123');
      fakeUserRoleService.addUserRole('user1', 'role2', 'admin123');

      // Act
      await permissionController.getUserRoles(
        mockRequest as any,
        mockResponse as Response
      );

      // Assert
      expect(fakeUserService.findById).toHaveBeenCalledWith('user1');
      expect(fakeUserRoleService.getUserRoles).toHaveBeenCalledWith('user1');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: 'user1',
          userName: 'Test User 1',
          userEmail: 'user1@test.com',
          roles: expect.any(Array),
        },
      });
    });

    it('should handle user not found', async () => {
      // Arrange
      mockRequest.params = { userId: 'nonexistent' };

      // Act
      await expect(
        permissionController.getUserRoles(
          mockRequest as any,
          mockResponse as Response
        )
      ).rejects.toThrow('User not found');
    });
  });

  describe('getAllRoles', () => {
    it('should return all roles successfully', async () => {
      // Act
      await permissionController.getAllRoles(
        mockRequest as any,
        mockResponse as Response
      );

      // Assert
      expect(fakeRoleService.findAll).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          roles: expect.any(Array),
        },
      });
    });
  });

  describe('getAllPermissions', () => {
    it('should return all permissions successfully', async () => {
      // Act
      await permissionController.getAllPermissions(
        mockRequest as any,
        mockResponse as Response
      );

      // Assert
      expect(fakeRoleService.getAllPermissions).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          permissions: expect.any(Array),
        },
      });
    });
  });
});
