import 'reflect-metadata';
import { AuthManager } from '../../../services/managers/AuthManager';
import { UserRepository } from '../../../repositories/UserRepository';
import { UserManager } from '../../../services/managers/UserManager';
import { FakeUserDataSource } from '../../mocks/datasource/FakeUserDataSource';
import { FakeNotificationService } from '../../mocks/email/FakeNotificationService';
import { IRoleService } from '../../../services/contracts/IRoleService';
import { IUserRoleService } from '../../../services/contracts/IUserRoleService';

describe('AuthService Unit Tests', () => {
  let authService: AuthManager;
  let userRepository: UserRepository;
  let userService: UserManager;
  let fakeUserDataSource: FakeUserDataSource;
  let fakeNotificationService: FakeNotificationService;
  let fakeRoleService: jest.Mocked<IRoleService>;
  let fakeUserRoleService: jest.Mocked<IUserRoleService>;

  beforeEach(() => {
    fakeUserDataSource = new FakeUserDataSource();
    userRepository = new UserRepository(fakeUserDataSource);
    userService = new UserManager(userRepository);
    fakeNotificationService = new FakeNotificationService();
    fakeRoleService = {
      getDefaultRole: jest
        .fn()
        .mockResolvedValue({ _id: 'default-role-id' } as any),
    } as any;
    fakeUserRoleService = {
      assignRoleToUser: jest.fn().mockResolvedValue({} as any),
      getUserRoles: jest.fn().mockResolvedValue([]),
      getUserActiveRoles: jest.fn().mockResolvedValue([]),
      removeRoleFromUser: jest.fn().mockResolvedValue(null),
      hasRole: jest.fn().mockResolvedValue(false),
      hasAnyRole: jest.fn().mockResolvedValue(false),
      hasAllRoles: jest.fn().mockResolvedValue(false),
      deactivateExpiredRoles: jest.fn().mockResolvedValue(0),
    } as any;
    authService = new AuthManager(
      userRepository,
      userService,
      fakeRoleService,
      fakeUserRoleService,
      fakeNotificationService
    );
  });

  it('should register a new user', async () => {
    const user = await authService.registerUser({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@auth.com',
      password: 'password',
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
    });
    await expect(
      authService.registerUser({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@auth.com',
        password: 'password',
      })
    ).rejects.toThrow();
  });

  it('should login user with correct credentials', async () => {
    const userData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@auth.com',
      password: 'password',
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

  it('should reset password and allow login with new password', async () => {
    // Önce kullanıcı oluştur
    const user = await authService.registerUser({
      firstName: 'Test',
      lastName: 'User',
      email: 'reset@auth.com',
      password: 'oldpassword',
    });

    // Reset token oluştur
    const { token } = AuthManager.generateResetPasswordToken();
    await userRepository.updateById(user._id, {
      resetPasswordToken: token,
      resetPasswordExpire: new Date(Date.now() + 3600000), // 1 saat sonra
    });

    // Şifreyi sıfırla
    await authService.resetPassword(token, 'newpassword');

    // Yeni şifre ile giriş yap
    const loggedInUser = await authService.loginUser(
      'reset@auth.com',
      'newpassword'
    );
    expect(loggedInUser).toBeDefined();
    expect(loggedInUser.email).toBe('reset@auth.com');

    // lastPasswordChange alanının güncellendiğini kontrol et
    const updatedUser = await userRepository.findById(user._id);
    expect(updatedUser?.lastPasswordChange).toBeDefined();
    expect(updatedUser?.lastPasswordChange).toBeInstanceOf(Date);

    // Eski şifre ile giriş yapmaya çalış - başarısız olmalı
    await expect(
      authService.loginUser('reset@auth.com', 'oldpassword')
    ).rejects.toThrow();
  });

  it('should throw error for invalid reset token', async () => {
    await expect(
      authService.resetPassword('invalid-token', 'newpassword')
    ).rejects.toThrow();
  });
});
