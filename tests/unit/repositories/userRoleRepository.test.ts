import 'reflect-metadata';
import { UserRoleRepository } from '../../../repositories/UserRoleRepository';
import { FakeUserRoleDataSource } from '../../mocks/datasources/FakeUserRoleDataSource';
import { IUserRoleModel } from '../../../models/interfaces/IUserRoleModel';
import { EntityId } from '../../../types/database';

describe('UserRoleRepository Unit Tests', () => {
  let userRoleRepository: UserRoleRepository;
  let fakeDataSource: FakeUserRoleDataSource;

  beforeEach(() => {
    fakeDataSource = new FakeUserRoleDataSource();
    userRoleRepository = new UserRoleRepository(fakeDataSource);

    // Add some test data
    fakeDataSource.addUserRole({
      _id: 'ur1',
      userId: 'user1',
      roleId: 'role1',
      assignedAt: new Date(),
      assignedBy: 'admin1',
      expiresAt: undefined,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    fakeDataSource.addUserRole({
      _id: 'ur2',
      userId: 'user1',
      roleId: 'role2',
      assignedAt: new Date(),
      assignedBy: 'admin1',
      expiresAt: undefined,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    fakeDataSource.addUserRole({
      _id: 'ur3',
      userId: 'user2',
      roleId: 'role1',
      assignedAt: new Date(),
      assignedBy: 'admin1',
      expiresAt: undefined,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe('create', () => {
    it('should create a new user role successfully', async () => {
      // Arrange
      const userRoleData = {
        userId: 'user3',
        roleId: 'role1',
        assignedBy: 'admin1',
      };

      // Act
      const result = await userRoleRepository.create(userRoleData);

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe('user3');
      expect(result.roleId).toBe('role1');
      expect(result.assignedBy).toBe('admin1');
      expect(result.isActive).toBe(true);
      expect(fakeDataSource.create).toHaveBeenCalledWith(userRoleData);
    });
  });

  describe('findById', () => {
    it('should find user role by id successfully', async () => {
      // Act
      const result = await userRoleRepository.findById('ur1');

      // Assert
      expect(result).toBeDefined();
      expect(result?._id).toBe('ur1');
      expect(result?.userId).toBe('user1');
      expect(result?.roleId).toBe('role1');
      expect(fakeDataSource.findById).toHaveBeenCalledWith('ur1');
    });

    it('should throw when user role not found', async () => {
      // BaseRepository.findById throws "Resource not found" when not found
      await expect(userRoleRepository.findById('nonexistent')).rejects.toThrow(
        'Resource not found'
      );
    });
  });

  describe('findAll', () => {
    it('should return all user roles successfully', async () => {
      // Act
      const result = await userRoleRepository.findAll();

      // Assert
      expect(result).toHaveLength(3);
      expect(fakeDataSource.findAll).toHaveBeenCalled();
    });
  });

  describe('updateById', () => {
    it('should update user role successfully', async () => {
      // Arrange
      const updateData = { isActive: false };

      // Act
      const result = await userRoleRepository.updateById('ur1', updateData);

      // Assert
      expect(result).toBeDefined();
      expect(result?.isActive).toBe(false);
      expect(fakeDataSource.updateById).toHaveBeenCalledWith('ur1', updateData);
    });

    it('should throw when user role not found', async () => {
      // BaseRepository.updateById throws "Resource not found" when not found
      const updateData = { isActive: false };

      await expect(
        userRoleRepository.updateById('nonexistent', updateData)
      ).rejects.toThrow('Resource not found');
    });
  });

  describe('deleteById', () => {
    it('should delete user role successfully', async () => {
      // Act
      const result = await userRoleRepository.deleteById('ur1');

      // Assert
      expect(result).toBeDefined();
      expect(result?._id).toBe('ur1');
      expect(fakeDataSource.deleteById).toHaveBeenCalledWith('ur1');
    });

    it('should throw when user role not found', async () => {
      // BaseRepository.deleteById throws "Resource not found" when not found
      await expect(
        userRoleRepository.deleteById('nonexistent')
      ).rejects.toThrow('Resource not found');
    });
  });

  describe('findByUserId', () => {
    it('should find user roles by user id successfully', async () => {
      // Act
      const result = await userRoleRepository.findByUserId('user1');

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every((ur: IUserRoleModel) => ur.userId === 'user1')).toBe(
        true
      );
    });

    it('should return empty array when user has no roles', async () => {
      // Act
      const result = await userRoleRepository.findByUserId('user3');

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('findByUserIdAndActive', () => {
    it('should find active user roles by user id successfully', async () => {
      // Act
      const result = await userRoleRepository.findByUserIdAndActive('user1');

      // Assert
      expect(result).toHaveLength(2);
      expect(
        result.every(
          (ur: IUserRoleModel) => ur.userId === 'user1' && ur.isActive
        )
      ).toBe(true);
    });

    it('should return empty array when user has no active roles', async () => {
      // Act
      const result = await userRoleRepository.findByUserIdAndActive('user2');

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('findByRoleId', () => {
    it('should find user roles by role id successfully', async () => {
      // Act
      const result = await userRoleRepository.findByRoleId('role1');

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every((ur: IUserRoleModel) => ur.roleId === 'role1')).toBe(
        true
      );
    });

    it('should return empty array when role has no users', async () => {
      // Act
      const result = await userRoleRepository.findByRoleId('role3');

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('findByUserIdAndRoleId', () => {
    it('should return user role when user is assigned to role', async () => {
      // Act
      const result = await userRoleRepository.findByUserIdAndRoleId(
        'user1',
        'role1'
      );

      // Assert
      expect(result).toBeDefined();
      expect(result?.userId).toBe('user1');
      expect(result?.roleId).toBe('role1');
    });

    it('should throw when user is not assigned to role', async () => {
      // UserRoleRepository.findByUserIdAndRoleId throws when not found
      await expect(
        userRoleRepository.findByUserIdAndRoleId('user1', 'role3')
      ).rejects.toThrow('User role not found');
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign role to user successfully', async () => {
      // Act
      const result = await userRoleRepository.assignRoleToUser(
        'user3',
        'role1',
        'admin1'
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.userId).toBe('user3');
      expect(result.roleId).toBe('role1');
      expect(result.assignedBy).toBe('admin1');
      expect(result.isActive).toBe(true);
    });
  });

  describe('removeRoleFromUser', () => {
    it('should remove role from user successfully', async () => {
      // Act
      const result = await userRoleRepository.removeRoleFromUser(
        'user1',
        'role1'
      );

      // Assert
      expect(result).toBeDefined();
      expect(result?.isActive).toBe(false);
    });

    it('should throw when user role not found', async () => {
      // removeRoleFromUser throws when findByUserIdAndRoleId finds nothing
      await expect(
        userRoleRepository.removeRoleFromUser('user1', 'role3')
      ).rejects.toThrow('User role not found');
    });
  });
});
