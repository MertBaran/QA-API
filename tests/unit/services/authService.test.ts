import 'reflect-metadata';
import { AuthManager } from '../../../services/managers/AuthManager';
import { UserRepository } from '../../../repositories/UserRepository';
import { FakeUserDataSource } from '../../mocks/datasource/FakeUserDataSource';
import { FakeNotificationService } from '../../mocks/email/FakeNotificationService';

describe('AuthService Unit Tests', () => {
  let authService: AuthManager;
  let userRepository: UserRepository;
  let fakeUserDataSource: FakeUserDataSource;
  let fakeNotificationService: FakeNotificationService;

  beforeEach(() => {
    fakeUserDataSource = new FakeUserDataSource();
    userRepository = new UserRepository(fakeUserDataSource);
    fakeNotificationService = new FakeNotificationService();
    authService = new AuthManager(userRepository, fakeNotificationService);
  });

  it('should register a new user', async () => {
    const user = await authService.registerUser({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@auth.com',
      password: 'password',
      role: 'user',
    });
    expect(user).toBeDefined();
    expect(user.email).toBe('test@auth.com');
    expect(user.name).toBe('Test User');
  });

  it('should not register duplicate email', async () => {
    await authService.registerUser({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@auth.com',
      password: 'password',
      role: 'user',
    });
    await expect(
      authService.registerUser({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@auth.com',
        password: 'password',
        role: 'user',
      })
    ).rejects.toThrow();
  });

  it('should login user with correct credentials', async () => {
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@auth.com',
      password: 'password',
      role: 'user' as const,
    };

    await authService.registerUser(userData);
    const user = await authService.loginUser('test@auth.com', 'password');
    expect(user).toBeDefined();
    expect(user.email).toBe('test@auth.com');
  });

  it('should not login with wrong password', async () => {
    await authService.registerUser({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@auth.com',
      password: 'password',
      role: 'user',
    });
    await expect(
      authService.loginUser('test@auth.com', 'wrongpass')
    ).rejects.toThrow();
  });

  it('should throw error for non-existent user login', async () => {
    await expect(
      authService.loginUser('nouser@auth.com', 'password')
    ).rejects.toThrow();
  });
});
