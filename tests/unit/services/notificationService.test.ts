import 'reflect-metadata';
import { SmartNotificationManager } from '../../../services/managers/SmartNotificationManager';
import {
  NotificationPayload,
  UserNotificationPreferences,
} from '../../../services/contracts/NotificationPayload';
import { INotificationStrategy } from '../../../services/contracts/INotificationStrategy';
import { SystemMetricsCollector } from '../../../services/metrics/SystemMetricsCollector';
import { IUserService } from '../../../services/contracts/IUserService';
import { INotificationRepository } from '../../../repositories/interfaces/INotificationRepository';
import { IEnvironmentProvider } from '../../../services/contracts/IEnvironmentProvider';
import { ILoggerProvider } from '../../../infrastructure/logging/ILoggerProvider';
import { container } from 'tsyringe';
import { FakeMultiChannelNotificationManager } from '../../mocks/managers/FakeMultiChannelNotificationManager';
import { FakeQueueBasedNotificationManager } from '../../mocks/managers/FakeQueueBasedNotificationManager';
import { MultiChannelNotificationManager } from '../../../services/managers/MultiChannelNotificationManager';
import { QueueBasedNotificationManager } from '../../../services/managers/QueueBasedNotificationManager';

describe('SmartNotificationManager Unit Tests', () => {
  let notificationManager: SmartNotificationManager;
  let fakeStrategy: jest.Mocked<INotificationStrategy>;
  let fakeMetricsCollector: jest.Mocked<SystemMetricsCollector>;
  let fakeUserService: jest.Mocked<IUserService>;
  let fakeNotificationRepository: jest.Mocked<INotificationRepository>;
  let fakeEnvironmentProvider: jest.Mocked<IEnvironmentProvider>;
  let fakeLoggerProvider: jest.Mocked<ILoggerProvider>;

  beforeEach(() => {
    fakeStrategy = {
      getStrategy: jest.fn().mockReturnValue('direct'),
      createContext: jest.fn().mockReturnValue({
        userId: '123',
        userType: 'standard',
        notificationType: 'NORMAL',
        priority: 'NORMAL',
        channel: 'email',
        template: 'default',
        language: 'en',
        timezone: 'UTC',
        preferences: {},
      }),
    } as any;

    fakeMetricsCollector = {
      getMetrics: jest.fn().mockResolvedValue({}),
    } as any;

    fakeUserService = {
      findById: jest.fn().mockResolvedValue({
        _id: '123',
        name: 'Test User',
        email: 'test@example.com',
        notificationPreferences: {},
      }),
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      findAll: jest.fn(),
      findActive: jest.fn(),
      countAll: jest.fn(),
    } as any;

    // Create fake managers AFTER fakeUserService is defined
    const fakeMultiChannelManager = new FakeMultiChannelNotificationManager(
      {} as any, // channelRegistry
      fakeUserService // Use the same fakeUserService instance
    );

    const fakeQueueManager = new FakeQueueBasedNotificationManager(
      {} as any, // queueProvider
      fakeUserService, // Use the same fakeUserService instance
      {} as any // logger
    );

    jest.spyOn(container, 'resolve').mockImplementation((token: any) => {
      if (
        token === 'QueueBasedNotificationManager' ||
        token === QueueBasedNotificationManager
      ) {
        return fakeQueueManager;
      }
      if (
        token === 'MultiChannelNotificationManager' ||
        token === MultiChannelNotificationManager
      ) {
        return fakeMultiChannelManager;
      }
      throw new Error(`Unknown token: ${token}`);
    });

    fakeNotificationRepository = {
      createNotification: jest.fn().mockResolvedValue({
        _id: 'notification123',
        status: 'pending',
      }),
      updateNotificationStatus: jest.fn().mockResolvedValue(true),
    } as any;

    fakeEnvironmentProvider = {
      getEnvironmentVariable: jest.fn().mockReturnValue('test@example.com'),
    } as any;

    fakeLoggerProvider = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    } as any;

    notificationManager = new SmartNotificationManager(
      fakeStrategy,
      fakeMetricsCollector,
      fakeUserService,
      fakeNotificationRepository,
      fakeEnvironmentProvider,
      fakeLoggerProvider
    );
  });

  it('should notify with direct strategy', async () => {
    const payload: NotificationPayload = {
      channel: 'email',
      to: 'test@example.com',
      subject: 'Test Subject',
      message: 'Test Message',
      userId: '123',
    };

    await notificationManager.notify(payload);

    expect(fakeStrategy.getStrategy).toHaveBeenCalled();
    expect(fakeNotificationRepository.createNotification).toHaveBeenCalled();
    expect(
      fakeNotificationRepository.updateNotificationStatus
    ).toHaveBeenCalledWith('notification123', 'sent', expect.any(Object));
  });

  it('should notify user with preferences', async () => {
    const payload = {
      subject: 'Test Subject',
      message: 'Test Message',
    };

    await notificationManager.notifyUser('123', payload);

    expect(fakeUserService.findById).toHaveBeenCalledWith('123');
    expect(fakeNotificationRepository.createNotification).toHaveBeenCalled();
  });

  it('should get user notification preferences', async () => {
    const preferences =
      await notificationManager.getUserNotificationPreferences('123');

    expect(fakeUserService.findById).toHaveBeenCalledWith('123');
    expect(preferences).toBeDefined();
  });

  it('should update user notification preferences', async () => {
    const preferences: Partial<UserNotificationPreferences> = {
      email: true,
      push: false,
    };

    await notificationManager.updateUserNotificationPreferences(
      '123',
      preferences
    );

    expect(fakeUserService.updateById).toHaveBeenCalledWith('123', {
      notificationPreferences: preferences,
    });
  });
});
