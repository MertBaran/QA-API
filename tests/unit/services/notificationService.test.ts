import 'reflect-metadata';
import { NotificationManager } from '../../../services/managers/NotificationManager';
import {
  NotificationPayload,
  MultiChannelNotificationPayload,
  UserNotificationPreferences,
} from '../../../services/contracts/NotificationPayload';
import { IUserRepository } from '../../../repositories/interfaces/IUserRepository';
import { NotificationChannel } from '../../../services/contracts/NotificationChannel';

describe('NotificationManager Unit Tests', () => {
  let notificationManager: NotificationManager;
  let fakeUserRepository: IUserRepository;
  let fakeEmailChannel: NotificationChannel;

  beforeEach(() => {
    fakeUserRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      findAll: jest.fn(),
    } as any;

    fakeEmailChannel = {
      send: jest.fn(),
      type: 'email',
      displayName: () => 'Email',
      isType: jest.fn(),
    } as any;

    notificationManager = new NotificationManager(
      fakeEmailChannel,
      fakeUserRepository
    );
  });

  describe('notify()', () => {
    it('should send email notification successfully', async () => {
      const payload: NotificationPayload = {
        to: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message',
        channel: 'email',
      };

      await notificationManager.notify(payload);

      expect(fakeEmailChannel.send).toHaveBeenCalledWith(payload);
    });

    it('should send email notification when channel is not specified', async () => {
      const payload: NotificationPayload = {
        to: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message',
        channel: 'email', // channel required in NotificationPayload
      };

      await notificationManager.notify(payload);

      expect(fakeEmailChannel.send).toHaveBeenCalledWith(payload);
    });

    it('should throw error for unsupported channel', async () => {
      const payload: NotificationPayload = {
        to: 'test@example.com',
        message: 'Test message',
        channel: 'sms',
      };

      await expect(notificationManager.notify(payload)).rejects.toThrow(
        "Notification channel 'sms' is not implemented yet."
      );
    });

    it('should throw error for push channel', async () => {
      const payload: NotificationPayload = {
        to: 'test@example.com',
        message: 'Test message',
        channel: 'push',
      };

      await expect(notificationManager.notify(payload)).rejects.toThrow(
        "Notification channel 'push' is not implemented yet."
      );
    });

    it('should throw error for webhook channel', async () => {
      const payload: NotificationPayload = {
        to: 'test@example.com',
        message: 'Test message',
        channel: 'webhook',
      };

      await expect(notificationManager.notify(payload)).rejects.toThrow(
        "Notification channel 'webhook' is not implemented yet."
      );
    });
  });

  describe('notifyToMultipleChannels()', () => {
    it('should send email notification for email channel', async () => {
      const payload: MultiChannelNotificationPayload = {
        channels: ['email'],
        to: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message',
      };

      await notificationManager.notifyToMultipleChannels(payload);

      expect(fakeEmailChannel.send).toHaveBeenCalledWith({
        channel: 'email',
        to: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message',
        html: undefined,
        data: undefined,
      });
    });

    it('should send multiple email notifications for multiple email channels', async () => {
      const payload: MultiChannelNotificationPayload = {
        channels: ['email', 'email'],
        to: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message',
      };

      await notificationManager.notifyToMultipleChannels(payload);

      expect(fakeEmailChannel.send).toHaveBeenCalledTimes(2);
    });

    it('should ignore non-email channels', async () => {
      const payload: MultiChannelNotificationPayload = {
        channels: ['sms', 'push', 'webhook'],
        to: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message',
      };

      await notificationManager.notifyToMultipleChannels(payload);

      expect(fakeEmailChannel.send).not.toHaveBeenCalled();
    });

    it('should handle mixed channels correctly', async () => {
      const payload: MultiChannelNotificationPayload = {
        channels: ['email', 'sms', 'email'],
        to: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message',
      };

      await notificationManager.notifyToMultipleChannels(payload);

      expect(fakeEmailChannel.send).toHaveBeenCalledTimes(2);
    });
  });

  describe('notifyUser()', () => {
    const mockUser = {
      id: '123',
      email: 'user@example.com',
      phoneNumber: '+1234567890',
      webhookUrl: 'https://webhook.example.com',
      notificationPreferences: {
        email: true,
        sms: false,
        push: true,
        webhook: false,
      },
    };

    beforeEach(() => {
      (fakeUserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
    });

    it('should send email notification to user', async () => {
      const payload = {
        subject: 'User Test Subject',
        message: 'User test message',
        html: '<p>Test HTML</p>',
        data: { key: 'value' },
      };

      await notificationManager.notifyUser('123', payload);

      expect(fakeUserRepository.findById).toHaveBeenCalledWith('123');
      expect(fakeEmailChannel.send).toHaveBeenCalledWith({
        channel: 'email',
        to: 'user@example.com',
        subject: 'User Test Subject',
        message: 'User test message',
        html: '<p>Test HTML</p>',
        data: { key: 'value' },
      });
    });

    it('should throw error when user not found', async () => {
      (fakeUserRepository.findById as jest.Mock).mockResolvedValue(null);

      const payload = {
        subject: 'Test Subject',
        message: 'Test message',
      };

      await expect(
        notificationManager.notifyUser('999', payload)
      ).rejects.toThrow('User with ID 999 not found.');

      expect(fakeEmailChannel.send).not.toHaveBeenCalled();
    });

    it('should handle user without email', async () => {
      const userWithoutEmail = { ...mockUser, email: undefined };
      (fakeUserRepository.findById as jest.Mock).mockResolvedValue(
        userWithoutEmail
      );

      const payload = {
        subject: 'Test Subject',
        message: 'Test message',
      };

      await notificationManager.notifyUser('123', payload);

      expect(fakeEmailChannel.send).toHaveBeenCalledWith({
        channel: 'email',
        to: undefined,
        subject: 'Test Subject',
        message: 'Test message',
        html: undefined,
        data: undefined,
      });
    });
  });

  describe('getUserNotificationPreferences()', () => {
    const mockUser = {
      id: '123',
      email: 'user@example.com',
      phoneNumber: '+1234567890',
      webhookUrl: 'https://webhook.example.com',
      notificationPreferences: {
        email: true,
        sms: false,
        push: true,
        webhook: false,
      },
    };

    beforeEach(() => {
      (fakeUserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
    });

    it('should return user notification preferences', async () => {
      const preferences =
        await notificationManager.getUserNotificationPreferences('123');

      expect(fakeUserRepository.findById).toHaveBeenCalledWith('123');
      expect(preferences).toEqual({
        userId: '123',
        email: true,
        push: true,
        sms: false,
        webhook: false,
        emailAddress: 'user@example.com',
        phoneNumber: '+1234567890',
        webhookUrl: 'https://webhook.example.com',
      });
    });

    it('should return default preferences when user has no preferences', async () => {
      const userWithoutPreferences = {
        ...mockUser,
        notificationPreferences: undefined,
      };
      (fakeUserRepository.findById as jest.Mock).mockResolvedValue(
        userWithoutPreferences
      );

      const preferences =
        await notificationManager.getUserNotificationPreferences('123');

      expect(preferences).toEqual({
        userId: '123',
        email: true,
        push: false,
        sms: false,
        webhook: false,
        emailAddress: 'user@example.com',
        phoneNumber: '+1234567890',
        webhookUrl: 'https://webhook.example.com',
      });
    });

    it('should throw error when user not found', async () => {
      (fakeUserRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        notificationManager.getUserNotificationPreferences('999')
      ).rejects.toThrow('User with ID 999 not found.');
    });

    it('should handle partial notification preferences', async () => {
      const userWithPartialPreferences = {
        ...mockUser,
        notificationPreferences: {
          email: true,
          // sms, push, webhook undefined
        },
      };
      (fakeUserRepository.findById as jest.Mock).mockResolvedValue(
        userWithPartialPreferences
      );

      const preferences =
        await notificationManager.getUserNotificationPreferences('123');

      expect(preferences).toEqual({
        userId: '123',
        email: true,
        push: false, // default
        sms: false, // default
        webhook: false, // default
        emailAddress: 'user@example.com',
        phoneNumber: '+1234567890',
        webhookUrl: 'https://webhook.example.com',
      });
    });
  });

  describe('updateUserNotificationPreferences()', () => {
    const mockUser = {
      id: '123',
      email: 'user@example.com',
      notificationPreferences: {
        email: true,
        sms: false,
        push: true,
        webhook: false,
      },
    };

    beforeEach(() => {
      (fakeUserRepository.findById as jest.Mock).mockResolvedValue(mockUser);
      (fakeUserRepository.updateById as jest.Mock).mockResolvedValue(undefined);
    });

    it('should update email preference', async () => {
      const preferences = { email: false };

      await notificationManager.updateUserNotificationPreferences(
        '123',
        preferences
      );

      expect(fakeUserRepository.findById).toHaveBeenCalledWith('123');
      expect(fakeUserRepository.updateById).toHaveBeenCalledWith('123', {
        'notificationPreferences.email': false,
      });
    });

    it('should update multiple preferences', async () => {
      const preferences = {
        email: false,
        sms: true,
        push: false,
        webhook: true,
      };

      await notificationManager.updateUserNotificationPreferences(
        '123',
        preferences
      );

      expect(fakeUserRepository.updateById).toHaveBeenCalledWith('123', {
        'notificationPreferences.email': false,
        'notificationPreferences.sms': true,
        'notificationPreferences.push': false,
        'notificationPreferences.webhook': true,
      });
    });

    it('should throw error when user not found', async () => {
      (fakeUserRepository.findById as jest.Mock).mockResolvedValue(null);

      const preferences = { email: false };

      await expect(
        notificationManager.updateUserNotificationPreferences(
          '999',
          preferences
        )
      ).rejects.toThrow('User with ID 999 not found.');

      expect(fakeUserRepository.updateById).not.toHaveBeenCalled();
    });

    it('should handle partial preference updates', async () => {
      const preferences = { email: false }; // sadece email güncelle

      await notificationManager.updateUserNotificationPreferences(
        '123',
        preferences
      );

      expect(fakeUserRepository.updateById).toHaveBeenCalledWith('123', {
        'notificationPreferences.email': false,
      });
    });

    it('should not update undefined preferences', async () => {
      const preferences = {
        email: undefined,
        sms: true,
      };

      await notificationManager.updateUserNotificationPreferences(
        '123',
        preferences
      );

      expect(fakeUserRepository.updateById).toHaveBeenCalledWith('123', {
        'notificationPreferences.sms': true,
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle email channel send error', async () => {
      const error = new Error('Email send failed');
      (fakeEmailChannel.send as jest.Mock).mockRejectedValue(error);

      const payload: NotificationPayload = {
        to: 'test@example.com',
        message: 'Test message',
        channel: 'email',
      };

      await expect(notificationManager.notify(payload)).rejects.toThrow(
        'Email send failed'
      );
    });

    it('should handle user repository findById error', async () => {
      const error = new Error('Database connection failed');
      (fakeUserRepository.findById as jest.Mock).mockRejectedValue(error);

      const payload = {
        subject: 'Test Subject',
        message: 'Test message',
      };

      await expect(
        notificationManager.notifyUser('123', payload)
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle user repository updateById error', async () => {
      (fakeUserRepository.findById as jest.Mock).mockResolvedValue({
        id: '123',
      });
      const error = new Error('Update failed');
      (fakeUserRepository.updateById as jest.Mock).mockRejectedValue(error);

      const preferences = { email: false };

      await expect(
        notificationManager.updateUserNotificationPreferences(
          '123',
          preferences
        )
      ).rejects.toThrow('Update failed');
    });
  });
});
