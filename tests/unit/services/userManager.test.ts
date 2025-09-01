import 'reflect-metadata';
import { UserManager } from '../../../services/managers/UserManager';
import { IUserRepository } from '../../../repositories/interfaces/IUserRepository';
import { IUserRoleRepository } from '../../../repositories/interfaces/IUserRoleRepository';
import { FakeUserRepository } from '../../mocks/repositories/FakeUserRepository';
import { FakeUserRoleRepository } from '../../mocks/repositories/FakeUserRoleRepository';
import { IUserModel } from '../../../models/interfaces/IUserModel';
import { EntityId } from '../../../types/database';
import { SupportedLanguage } from '../../../constants/supportedLanguages';

describe('UserManager Unit Tests', () => {
  let userManager: UserManager;
  let fakeUserRepository: FakeUserRepository;
  let fakeUserRoleRepository: FakeUserRoleRepository;

  beforeEach(() => {
    fakeUserRepository = new FakeUserRepository();
    userManager = new UserManager(fakeUserRepository);

    // Add some test data
    fakeUserRepository.create({
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
      language: 'en' as SupportedLanguage,
      notificationPreferences: { email: true, push: false, sms: false, webhook: false },
    });

    fakeUserRepository.create({
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
      language: 'tr' as SupportedLanguage,
      notificationPreferences: { email: true, push: true, sms: false, webhook: false },
    });
  });

  describe('findById', () => {
    it('should find user by id successfully', async () => {
      // Act
      const result = await userManager.findById('user1');

      // Assert
      expect(result).toBeDefined();
      expect(result?._id).toBe('user1');
      expect(result?.name).toBe('Test User 1');
    });

    it('should return null when user not found', async () => {
      // Act
      const result = await userManager.findById('nonexistent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email successfully', async () => {
      // Act
      const result = await userManager.findByEmail('user1@test.com');

      // Assert
      expect(result).toBeDefined();
      expect(result?._id).toBe('user1');
      expect(result?.email).toBe('user1@test.com');
    });

    it('should return null when user not found', async () => {
      // Act
      const result = await userManager.findByEmail('nonexistent@test.com');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create user successfully', async () => {
      // Arrange
      const userData = {
        name: 'New User',
        email: 'newuser@test.com',
        password: 'hashedpassword',
        title: 'Tester',
        about: 'New user about',
        place: 'New City',
        website: 'https://newuser.com',
        profile_image: 'newprofile.jpg',
        blocked: false,
        language: 'en' as SupportedLanguage,
        notificationPreferences: { email: true, push: false, sms: false, webhook: false },
      };

      // Act
      const result = await userManager.create(userData);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe('New User');
      expect(result.email).toBe('newuser@test.com');
    });
  });

  describe('updateById', () => {
    it('should update user successfully', async () => {
      // Arrange
      const updateData = { title: 'Senior Developer' };

      // Act
      const result = await userManager.updateById('user1', updateData);

      // Assert
      expect(result).toBeDefined();
      expect(result?.title).toBe('Senior Developer');
    });

    it('should return null when user not found', async () => {
      // Arrange
      const updateData = { title: 'Senior Developer' };

      // Act
      const result = await userManager.updateById('nonexistent', updateData);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('deleteById', () => {
    it('should delete user successfully', async () => {
      // Act
      const result = await userManager.deleteById('user1');

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when user not found', async () => {
      // Act
      const result = await userManager.deleteById('nonexistent');

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return all users successfully', async () => {
      // Act
      const result = await userManager.findAll();

      // Assert
      expect(result).toHaveLength(2);
    });
  });

  describe('findActive', () => {
    it('should return active users successfully', async () => {
      // Act
      const result = await userManager.findActive();

      // Assert
      expect(result).toHaveLength(2);
      expect(result.every(user => !user.blocked)).toBe(true);
    });
  });
});
