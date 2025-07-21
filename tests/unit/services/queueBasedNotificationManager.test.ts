import { QueueBasedNotificationManager } from '../../../services/managers/QueueBasedNotificationManager';
import { IQueueProvider } from '../../../services/contracts/IQueueProvider';
import { IUserRepository } from '../../../repositories/interfaces/IUserRepository';
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

const mockUserRepository = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByEmailWithPassword: jest.fn(),
  findByResetToken: jest.fn(),
  updateResetToken: jest.fn(),
  clearResetToken: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  findAll: jest.fn(),
  findByUsername: jest.fn(),
  exists: jest.fn(),
} as unknown as IUserRepository;

const mockLogger: ILoggerProvider = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

describe('QueueBasedNotificationManager', () => {
  let notificationManager: QueueBasedNotificationManager;

  beforeEach(() => {
    notificationManager = new QueueBasedNotificationManager(
      mockQueueProvider,
      mockUserRepository,
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
      const newNotificationManager = new QueueBasedNotificationManager(
        mockQueueProvider,
        mockUserRepository,
        mockLogger
      );

      (mockQueueProvider.createExchange as jest.Mock).mockRejectedValue(
        new Error('Init failed')
      );

      await expect(newNotificationManager.initialize()).rejects.toThrow(
        'Init failed'
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to initialize queue-based notification system',
        { error: 'Init failed' }
      );
    });
  });

  describe('Notification Methods', () => {
    beforeEach(async () => {
      await notificationManager.initialize();
    });

    it('should queue single channel notification', async () => {
      const payload: NotificationPayload = {
        channel: 'email',
        to: 'test@example.com',
        subject: 'Test',
        message: 'Test message',
      };

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

      (mockUserRepository.findById as jest.Mock).mockResolvedValue(mockUser);

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
      const message = {
        id: 'msg123',
        type: 'notification',
        data: {
          payload: {
            channel: 'email',
            to: 'test@example.com',
            subject: 'Test',
            message: 'Test message',
          },
        },
        timestamp: new Date(),
      };

      // Mock the private method by accessing it through the instance
      const processMethod = (
        notificationManager as any
      ).processNotificationMessage.bind(notificationManager);
      await processMethod(message);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Single channel notification processed',
        expect.objectContaining({
          channel: 'email',
          to: 'test@example.com',
        })
      );
    });

    it('should process multi-channel notification message', async () => {
      const message = {
        id: 'msg123',
        type: 'notification',
        data: {
          payload: {
            channels: ['email', 'sms'],
            to: 'test@example.com',
            subject: 'Test',
            message: 'Test message',
          },
        },
        timestamp: new Date(),
      };

      const processMethod = (
        notificationManager as any
      ).processNotificationMessage.bind(notificationManager);
      await processMethod(message);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Multi-channel notification processed',
        expect.objectContaining({
          channels: ['email', 'sms'],
          to: 'test@example.com',
        })
      );
    });
  });

  describe('Priority Logic', () => {
    it('should assign correct priorities', () => {
      const urgentPayload = { data: { priority: 'urgent' } };
      const highPayload = { data: { priority: 'high' } };
      const normalPayload = { data: { priority: 'normal' } };
      const lowPayload = { data: { priority: 'low' } };

      const getPriority = (notificationManager as any).getPriority.bind(
        notificationManager
      );

      expect(getPriority(urgentPayload)).toBe(10);
      expect(getPriority(highPayload)).toBe(8);
      expect(getPriority(normalPayload)).toBe(5);
      expect(getPriority(lowPayload)).toBe(1);
    });
  });
});
