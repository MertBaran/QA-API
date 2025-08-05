import 'reflect-metadata';
import { AuthController } from '../../../controllers/authController';
import { AuthManager } from '../../../services/managers/AuthManager';
import { UserRepository } from '../../../repositories/UserRepository';
import { UserManager } from '../../../services/managers/UserManager';
import { FakeUserDataSource } from '../../mocks/datasource/FakeUserDataSource';
import { FakeRoleService } from '../../mocks/services/FakeRoleService';
import { FakeUserRoleService } from '../../mocks/services/FakeUserRoleService';
import { FakePermissionService } from '../../mocks/services/FakePermissionService';
import { FakeNotificationService } from '../../mocks/email/FakeNotificationService';
import { FakeLoggerProvider } from '../../mocks/logger/FakeLoggerProvider';
import { FakeExceptionTracker } from '../../mocks/error/FakeExceptionTracker';

describe('AuthController Unit Tests', () => {
  let authController: AuthController;
  let authService: AuthManager;
  let userRepository: UserRepository;
  let userService: UserManager;
  let fakeUserDataSource: FakeUserDataSource;
  let fakeRoleService: FakeRoleService;
  let fakeUserRoleService: FakeUserRoleService;
  let fakePermissionService: FakePermissionService;
  let fakeNotificationService: FakeNotificationService;
  let fakeLoggerProvider: FakeLoggerProvider;
  let fakeExceptionTracker: FakeExceptionTracker;

  beforeEach(() => {
    fakeUserDataSource = new FakeUserDataSource();
    userRepository = new UserRepository(fakeUserDataSource);
    userService = new UserManager(userRepository);
    fakeRoleService = new FakeRoleService();
    fakeUserRoleService = new FakeUserRoleService();
    fakePermissionService = new FakePermissionService();
    fakeNotificationService = new FakeNotificationService();
    fakeLoggerProvider = new FakeLoggerProvider();
    fakeExceptionTracker = new FakeExceptionTracker();

    authService = new AuthManager(
      userRepository,
      userService,
      fakeRoleService,
      fakeUserRoleService,
      fakeNotificationService
    );

    authController = new AuthController(
      authService,
      userService,
      fakeUserRoleService,
      fakeRoleService,
      fakePermissionService,
      fakeLoggerProvider,
      fakeExceptionTracker
    );
  });

  it('should register a new user', async () => {
    const mockUser = {
      _id: 'user123',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedPassword',
      profile_image: '',
      blocked: false,
      title: '',
      about: '',
      place: '',
      website: '',
      createdAt: new Date(),
      language: 'en',
      notificationPreferences: {},
    };

    fakeUserDataSource.create = jest.fn().mockResolvedValue(mockUser);
    fakeRoleService.findByName = jest
      .fn()
      .mockResolvedValue({ _id: 'role123' });
    fakeUserRoleService.assignRoleToUser = jest
      .fn()
      .mockResolvedValue({} as any);

    const req = {
      body: {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
      },
      locale: 'en',
    } as any;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    const next = jest.fn();

    await authController.register(req, res, next);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
      })
    );
  });

  it('should login user with valid credentials', async () => {
    const mockUser = {
      _id: 'user123',
      name: 'Test User',
      email: 'test@example.com',
      password: '$2a$10$hashedPassword',
      profile_image: '',
      blocked: false,
      title: '',
      about: '',
      place: '',
      website: '',
      createdAt: new Date(),
      language: 'en',
      notificationPreferences: {},
    };

    fakeUserDataSource.findByEmail = jest.fn().mockResolvedValue(mockUser);
    fakeUserRoleService.getUserActiveRoles = jest.fn().mockResolvedValue([]);

    const req = {
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
      locale: 'en',
    } as any;

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    } as any;

    const next = jest.fn();

    await authController.login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
      })
    );
  });
});
