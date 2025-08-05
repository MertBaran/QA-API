import { QueueBasedNotificationManager } from '../../../services/managers/QueueBasedNotificationManager';
import { IQueueProvider } from '../../../services/contracts/IQueueProvider';
import { IUserService } from '../../../services/contracts/IUserService';
import { ILoggerProvider } from '../../../infrastructure/logging/ILoggerProvider';
import {
  NotificationPayload,
  MultiChannelNotificationPayload,
} from '../../../services/contracts/NotificationPayload';

// Mock dependencies
const mockQueueProvider = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  isConnected: jest.fn(),
  createQueue: jest.fn(),
  deleteQueue: jest.fn(),
  purgeQueue: jest.fn(),
  createExchange: jest.fn(),
  deleteExchange: jest.fn(),
  publish: jest.fn(),
  publishToQueue: jest.fn(),
  consume: jest.fn(),
  cancel: jest.fn(),
  ack: jest.fn(),
  nack: jest.fn(),
  getQueueInfo: jest.fn(),
  healthCheck: jest.fn(),
} as IQueueProvider;

const mockUserService = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByEmailWithPassword: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
  findAll: jest.fn(),
  findActive: jest.fn(),
  countAll: jest.fn(),
} as unknown as IUserService;

const mockLogger: ILoggerProvider = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  trace: jest.fn(),
  fatal: jest.fn(),
  isEnabled: jest.fn().mockReturnValue(true),
  setLevel: jest.fn(),
  getLevel: jest.fn().mockReturnValue('info'),
};

describe('QueueBasedNotificationManager', () => {
  let notificationManager: QueueBasedNotificationManager;

  beforeEach(() => {
    notificationManager = new QueueBasedNotificationManager(
      mockQueueProvider,
      mockUserService,
      mockLogger
    );
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize queue system successfully', async () => {
      await notificationManager.initialize();

      expect(mockQueueProvider.createExchange).toHaveBeenCalledWith(
        'notification.dlx',
        'direct',
        { durable: true }
      );
      expect(mockQueueProvider.createQueue).toHaveBeenCalledWith(
        'notifications.dlq',
        { durable: true, autoDelete: false }
      );
      expect(mockQueueProvider.createExchange).toHaveBeenCalledWith(
        'notification.exchange',
        'topic',
        { durable: true }
      );
      expect(mockQueueProvider.createQueue).toHaveBeenCalledWith(
        'notifications',
        {
          durable: true,
          autoDelete: false,
          deadLetterExchange: 'notification.dlx',
          deadLetterRoutingKey: 'notifications.dlq',
        }
      );
    });

    it('should handle initialization errors', async () => {
      (mockQueueProvider.createExchange as jest.Mock).mockRejectedValueOnce(
        new Error('init error')
      );

      await expect(notificationManager.initialize()).rejects.toThrow('init error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to initialize queue-based notification system',
        { error: 'init error' }
      );
    });
  });

  describe('Notification Methods', () => {
    beforeEach(async () => {
      // Initialize mock'ları sıfırla
      jest.clearAllMocks();
    });

    it('should queue single channel notification', async () => {
      const payload: NotificationPayload = {
        channel: 'email',
        to: 'test@example.com',
        subject: 'Test',
        message: 'Test message',
      };

      // Mock the queue provider to not throw
      (mockQueueProvider.publishToQueue as jest.Mock).mockResolvedValue(
        undefined
      );

      await notificationManager.notify(payload);

      expect(mockQueueProvider.publishToQueue).toHaveBeenCalledWith(
        'notifications',
        expect.objectContaining({
          type: 'notification',
          data: { payload },
        })
      );
    });

    it('should queue multi-channel notification', async () => {
      const payload: MultiChannelNotificationPayload = {
        channels: ['email', 'sms'],
        to: 'test@example.com',
        subject: 'Test',
        message: 'Test message',
      };

      // Mock the queue provider to not throw
      (mockQueueProvider.publishToQueue as jest.Mock).mockResolvedValue(
        undefined
      );

      await notificationManager.notifyToMultipleChannels(payload);

      expect(mockQueueProvider.publishToQueue).toHaveBeenCalledWith(
        'notifications',
        expect.objectContaining({
          type: 'notification',
          data: { payload },
        })
      );
    });

    it('should queue user notification with active channels', async () => {
      const mockUser = {
        id: 'user123',
        email: 'user@example.com',
        phoneNumber: '+1234567890',
        language: 'tr',
      };

      (mockUserService.findById as jest.Mock).mockResolvedValue(mockUser);
      (mockQueueProvider.publishToQueue as jest.Mock).mockResolvedValue(
        undefined
      );

      await notificationManager.notifyUser('user123', {
        subject: 'Test',
        message: 'Test message',
      });

      expect(mockQueueProvider.publishToQueue).toHaveBeenCalledWith(
        'notifications',
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user123',
            userLanguage: 'tr',
          }),
        })
      );
    });
  });

  describe('Queue Status', () => {
    it('should get queue status successfully', async () => {
      (mockQueueProvider.getQueueInfo as jest.Mock)
        .mockResolvedValueOnce({ messageCount: 5, consumerCount: 2 })
        .mockResolvedValueOnce({ messageCount: 1, consumerCount: 0 });

      const status = await notificationManager.getQueueStatus();

      expect(status).toEqual({
        messageCount: 5,
        consumerCount: 2,
        deadLetterCount: 1,
      });
    });
  });

  describe('Message Processing', () => {
    beforeEach(async () => {
      await notificationManager.initialize();
    });

    it('should process single channel notification message', async () => {
      const payload: NotificationPayload = {
        channel: 'email',
        to: 'test@example.com',
        subject: 'Test',
        message: 'Msg',
      };

      const sendEmailSpy = jest
        .spyOn(notificationManager as any, 'sendEmailNotification')
        .mockResolvedValue(undefined);

      await (notificationManager as any).processSingleChannelNotification(payload);

      expect(sendEmailSpy).toHaveBeenCalledWith(payload);
    });

    it('should process multi-channel notification message', async () => {
      const payload: MultiChannelNotificationPayload = {
        channels: ['email', 'sms'],
        to: 'test@example.com',
        subject: 'Test',
        message: 'Msg',
      };

      const emailSpy = jest
        .spyOn(notificationManager as any, 'sendEmailNotification')
        .mockResolvedValue(undefined);
      const smsSpy = jest
        .spyOn(notificationManager as any, 'sendSMSNotification')
        .mockResolvedValue(undefined);

      await (notificationManager as any).processMultiChannelNotification(payload);

      expect(emailSpy).toHaveBeenCalled();
      expect(smsSpy).toHaveBeenCalled();
    });
  });

  describe('Priority Logic', () => {
    it('should assign correct priorities', async () => {
      (mockQueueProvider.publishToQueue as jest.Mock).mockResolvedValue(undefined);

      const payload: NotificationPayload = {
        channel: 'email',
        to: 'test@example.com',
        subject: 'T',
        message: 'M',
        data: { priority: 'urgent' },
      };

      await notificationManager.notify(payload);

      const publishArg = (
        mockQueueProvider.publishToQueue as jest.Mock
      ).mock.calls[0][1];
      expect(publishArg.priority).toBe(10);
    });
  });
});
