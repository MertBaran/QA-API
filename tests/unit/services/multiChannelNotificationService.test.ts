import 'reflect-metadata';
import { MultiChannelNotificationManager } from '../../../services/managers/MultiChannelNotificationManager';
import {
  NotificationPayload,
  MultiChannelNotificationPayload,
} from '../../../services/contracts/NotificationPayload';
import { INotificationChannelRegistry } from '../../../services/contracts/INotificationChannelRegistry';
import { IUserService } from '../../../services/contracts/IUserService';
import { NotificationChannel } from '../../../services/contracts/NotificationChannel';

describe('MultiChannelNotificationManager Unit Tests', () => {
  let multiChannelNotificationManager: MultiChannelNotificationManager;
  let fakeChannelRegistry: INotificationChannelRegistry;
  let fakeUserService: IUserService;
  let fakeEmailChannel: NotificationChannel;
  let fakeSMSChannel: NotificationChannel;
  let fakePushChannel: NotificationChannel;
  let fakeWebhookChannel: NotificationChannel;

  beforeEach(() => {
    fakeEmailChannel = {
      type: 'email',
      displayName: () => 'Email',
      send: jest.fn(),
      isType: jest.fn(),
    } as any;

    fakeSMSChannel = {
      type: 'sms',
      displayName: () => 'SMS',
      send: jest.fn(),
      isType: jest.fn(),
    } as any;

    fakePushChannel = {
      type: 'push',
      displayName: () => 'Push',
      send: jest.fn(),
      isType: jest.fn(),
    } as any;

    fakeWebhookChannel = {
      type: 'webhook',
      displayName: () => 'Webhook',
      send: jest.fn(),
      isType: jest.fn(),
    } as any;

    fakeChannelRegistry = {
      registerChannel: jest.fn(),
      unregisterChannel: jest.fn(),
      getChannel: jest.fn(),
      getAllChannels: jest.fn(),
      getSupportedChannelTypes: jest.fn(),
      isChannelSupported: jest.fn(),
      sendToChannel: jest.fn(),
    } as any;

    fakeUserService = {
      findById: jest.fn(),
      create: jest.fn(),
      updateById: jest.fn(),
      deleteById: jest.fn(),
      findAll: jest.fn(),
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      findActive: jest.fn(),
      countAll: jest.fn(),
    } as any;

    // Channel registry'yi mock'la
    (fakeChannelRegistry.getChannel as jest.Mock).mockImplementation(
      (type: string) => {
        const channels = {
          email: fakeEmailChannel,
          sms: fakeSMSChannel,
          push: fakePushChannel,
          webhook: fakeWebhookChannel,
        };
        return channels[type as keyof typeof channels] || null;
      }
    );

    (fakeChannelRegistry.isChannelSupported as jest.Mock).mockImplementation(
      (type: string) => {
        return ['email', 'sms', 'push', 'webhook'].includes(type);
      }
    );

    (fakeChannelRegistry.getSupportedChannelTypes as jest.Mock).mockReturnValue(
      ['email', 'sms', 'push', 'webhook']
    );

    multiChannelNotificationManager = new MultiChannelNotificationManager(
      fakeChannelRegistry,
      fakeUserService
    );
  });

  describe('notify()', () => {
    it('should send notification to supported channel', async () => {
      const payload: NotificationPayload = {
        channel: 'email',
        to: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message',
      };

      await multiChannelNotificationManager.notify(payload);

      expect(fakeChannelRegistry.sendToChannel).toHaveBeenCalledWith(
        'email',
        payload
      );
    });

    it('should throw error for unsupported channel', async () => {
      const payload: NotificationPayload = {
        channel: 'unsupported' as any,
        to: 'test@example.com',
        message: 'Test message',
      };

      await expect(
        multiChannelNotificationManager.notify(payload)
      ).rejects.toThrow("Notification channel 'unsupported' is not supported.");

      expect(fakeChannelRegistry.sendToChannel).not.toHaveBeenCalled();
    });

    it('should send notification to SMS channel', async () => {
      const payload: NotificationPayload = {
        channel: 'sms',
        to: '+1234567890',
        message: 'SMS test message',
      };

      await multiChannelNotificationManager.notify(payload);

      expect(fakeChannelRegistry.sendToChannel).toHaveBeenCalledWith(
        'sms',
        payload
      );
    });

    it('should send notification to push channel', async () => {
      const payload: NotificationPayload = {
        channel: 'push',
        to: 'device-token-123',
        message: 'Push test message',
      };

      await multiChannelNotificationManager.notify(payload);

      expect(fakeChannelRegistry.sendToChannel).toHaveBeenCalledWith(
        'push',
        payload
      );
    });

    it('should send notification to webhook channel', async () => {
      const payload: NotificationPayload = {
        channel: 'webhook',
        to: 'https://webhook.example.com',
        message: 'Webhook test message',
      };

      await multiChannelNotificationManager.notify(payload);

      expect(fakeChannelRegistry.sendToChannel).toHaveBeenCalledWith(
        'webhook',
        payload
      );
    });
  });

  describe('notifyToMultipleChannels()', () => {
    it('should send notification to multiple channels', async () => {
      const payload: MultiChannelNotificationPayload = {
        channels: ['email', 'sms'],
        to: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message',
      };

      await multiChannelNotificationManager.notifyToMultipleChannels(payload);

      expect(fakeChannelRegistry.sendToChannel).toHaveBeenCalledTimes(2);
      expect(fakeChannelRegistry.sendToChannel).toHaveBeenCalledWith('email', {
        channel: 'email',
        to: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message',
        html: undefined,
        data: undefined,
      });
      expect(fakeChannelRegistry.sendToChannel).toHaveBeenCalledWith('sms', {
        channel: 'sms',
        to: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message',
        html: undefined,
        data: undefined,
      });
    });

    it('should send notification to all supported channels', async () => {
      const payload: MultiChannelNotificationPayload = {
        channels: ['email', 'sms', 'push', 'webhook'],
        to: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message',
      };

      await multiChannelNotificationManager.notifyToMultipleChannels(payload);

      expect(fakeChannelRegistry.sendToChannel).toHaveBeenCalledTimes(4);
    });

    it('should handle empty channels array', async () => {
      const payload: MultiChannelNotificationPayload = {
        channels: [],
        to: 'test@example.com',
        message: 'Test message',
      };

      await multiChannelNotificationManager.notifyToMultipleChannels(payload);

      expect(fakeChannelRegistry.sendToChannel).not.toHaveBeenCalled();
    });

    it('should include HTML and data in payload', async () => {
      const payload: MultiChannelNotificationPayload = {
        channels: ['email'],
        to: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message',
        html: '<p>Test HTML</p>',
        data: { key: 'value' },
      };

      await multiChannelNotificationManager.notifyToMultipleChannels(payload);

      expect(fakeChannelRegistry.sendToChannel).toHaveBeenCalledWith('email', {
        channel: 'email',
        to: 'test@example.com',
        subject: 'Test Subject',
        message: 'Test message',
        html: '<p>Test HTML</p>',
        data: { key: 'value' },
      });
    });
  });

  describe('notifyUser()', () => {
    const mockUser = {
      id: '123',
      email: 'user@example.com',
      phoneNumber: '+1234567890',
      webhookUrl: 'https://webhook.example.com',
      language: 'tr',
      notificationPreferences: {
        email: true,
        sms: true,
        push: false,
        webhook: true,
      },
    };

    beforeEach(() => {
      (fakeUserService.findById as jest.Mock).mockResolvedValue(mockUser);
    });

    it('should send notification to user active channels', async () => {
      const payload = {
        subject: 'User Test Subject',
        message: 'User test message',
        html: '<p>Test HTML</p>',
        data: { key: 'value' },
      };

      await multiChannelNotificationManager.notifyUser('123', payload);

      expect(fakeUserService.findById).toHaveBeenCalledWith('123');
      expect(fakeChannelRegistry.sendToChannel).toHaveBeenCalledTimes(3); // email, sms, webhook

      // Email channel
      expect(fakeChannelRegistry.sendToChannel).toHaveBeenCalledWith('email', {
        channel: 'email',
        to: 'user@example.com',
        subject: 'User Test Subject',
        message: 'User test message',
        html: '<p>Test HTML</p>',
        data: { key: 'value', userLanguage: 'tr' },
      });

      // SMS channel
      expect(fakeChannelRegistry.sendToChannel).toHaveBeenCalledWith('sms', {
        channel: 'sms',
        to: 'user@example.com', // notifyToMultipleChannels uses the same 'to' for all channels
        subject: 'User Test Subject',
        message: 'User test message',
        html: '<p>Test HTML</p>',
        data: { key: 'value', userLanguage: 'tr' },
      });

      // Webhook channel
      expect(fakeChannelRegistry.sendToChannel).toHaveBeenCalledWith(
        'webhook',
        {
          channel: 'webhook',
          to: 'user@example.com', // notifyToMultipleChannels uses the same 'to' for all channels
          subject: 'User Test Subject',
          message: 'User test message',
          html: '<p>Test HTML</p>',
          data: { key: 'value', userLanguage: 'tr' },
        }
      );
    });

    it('should throw error when user not found', async () => {
      (fakeUserService.findById as jest.Mock).mockResolvedValue(null);

      const payload = {
        subject: 'Test Subject',
        message: 'Test message',
      };

      await expect(
        multiChannelNotificationManager.notifyUser('999', payload)
      ).rejects.toThrow('User with ID 999 not found.');

      expect(fakeChannelRegistry.sendToChannel).not.toHaveBeenCalled();
    });

    it('should handle user with no active channels', async () => {
      const userWithNoActiveChannels = {
        ...mockUser,
        notificationPreferences: {
          email: false,
          sms: false,
          push: false,
          webhook: false,
        },
      };
      (fakeUserService.findById as jest.Mock).mockResolvedValue(
        userWithNoActiveChannels
      );

      const payload = {
        subject: 'Test Subject',
        message: 'Test message',
      };

      await multiChannelNotificationManager.notifyUser('123', payload);

      expect(fakeChannelRegistry.sendToChannel).not.toHaveBeenCalled();
    });

    it('should handle user without contact information', async () => {
      const userWithoutContact = {
        ...mockUser,
        email: undefined,
        phoneNumber: undefined,
        webhookUrl: undefined,
        notificationPreferences: {
          email: true,
          sms: true,
          push: true,
          webhook: true,
        },
      };
      (fakeUserService.findById as jest.Mock).mockResolvedValue(
        userWithoutContact
      );

      const payload = {
        subject: 'Test Subject',
        message: 'Test message',
      };

      await multiChannelNotificationManager.notifyUser('123', payload);

      // Push channel should still work even without contact info
      expect(fakeChannelRegistry.sendToChannel).toHaveBeenCalledWith('push', {
        channel: 'push',
        to: '123', // userId is used as fallback
        subject: 'Test Subject',
        message: 'Test message',
        html: undefined,
        data: { userLanguage: 'tr' },
      });
    });

    it('should include user language in data', async () => {
      const userWithLanguage = {
        ...mockUser,
        language: 'en',
      };
      (fakeUserService.findById as jest.Mock).mockResolvedValue(
        userWithLanguage
      );

      const payload = {
        subject: 'Test Subject',
        message: 'Test message',
        data: { originalKey: 'originalValue' },
      };

      await multiChannelNotificationManager.notifyUser('123', payload);

      expect(fakeChannelRegistry.sendToChannel).toHaveBeenCalledWith('email', {
        channel: 'email',
        to: 'user@example.com',
        subject: 'Test Subject',
        message: 'Test message',
        html: undefined,
        data: { originalKey: 'originalValue', userLanguage: 'en' },
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
      (fakeUserService.findById as jest.Mock).mockResolvedValue(mockUser);
    });

    it('should return user notification preferences', async () => {
      const preferences =
        await multiChannelNotificationManager.getUserNotificationPreferences(
          '123'
        );

      expect(fakeUserService.findById).toHaveBeenCalledWith('123');
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
      (fakeUserService.findById as jest.Mock).mockResolvedValue(
        userWithoutPreferences
      );

      const preferences =
        await multiChannelNotificationManager.getUserNotificationPreferences(
          '123'
        );

      expect(preferences).toEqual({
        userId: '123',
        email: true,
        push: true, // Default is true in the implementation
        sms: false,
        webhook: false,
        emailAddress: 'user@example.com',
        phoneNumber: '+1234567890',
        webhookUrl: 'https://webhook.example.com',
      });
    });

    it('should throw error when user not found', async () => {
      (fakeUserService.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        multiChannelNotificationManager.getUserNotificationPreferences('999')
      ).rejects.toThrow('User with ID 999 not found.');
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
      (fakeUserService.findById as jest.Mock).mockResolvedValue(mockUser);
      (fakeUserService.updateById as jest.Mock).mockResolvedValue(undefined);
    });

    it('should update user notification preferences', async () => {
      const preferences = {
        email: false,
        sms: true,
        push: false,
        webhook: true,
      };

      await multiChannelNotificationManager.updateUserNotificationPreferences(
        '123',
        preferences
      );

      expect(fakeUserService.findById).toHaveBeenCalledWith('123');
      expect(fakeUserService.updateById).toHaveBeenCalledWith('123', {
        'notificationPreferences.email': false,
        'notificationPreferences.sms': true,
        'notificationPreferences.push': false,
        'notificationPreferences.webhook': true,
      });
    });

    it('should throw error when user not found', async () => {
      (fakeUserService.findById as jest.Mock).mockResolvedValue(null);

      const preferences = { email: false };

      await expect(
        multiChannelNotificationManager.updateUserNotificationPreferences(
          '999',
          preferences
        )
      ).rejects.toThrow('User with ID 999 not found.');

      expect(fakeUserService.updateById).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle channel registry sendToChannel error', async () => {
      const error = new Error('Channel send failed');
      (fakeChannelRegistry.sendToChannel as jest.Mock).mockRejectedValue(error);

      const payload: NotificationPayload = {
        channel: 'email',
        to: 'test@example.com',
        message: 'Test message',
      };

      await expect(
        multiChannelNotificationManager.notify(payload)
      ).rejects.toThrow('Channel send failed');
    });

    it('should handle user repository findById error', async () => {
      const error = new Error('Database connection failed');
      (fakeUserService.findById as jest.Mock).mockRejectedValue(error);

      const payload = {
        subject: 'Test Subject',
        message: 'Test message',
      };

      await expect(
        multiChannelNotificationManager.notifyUser('123', payload)
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle user repository updateById error', async () => {
      (fakeUserService.findById as jest.Mock).mockResolvedValue({
        id: '123',
      });
      const error = new Error('Update failed');
      (fakeUserService.updateById as jest.Mock).mockRejectedValue(error);

      const preferences = { email: false };

      await expect(
        multiChannelNotificationManager.updateUserNotificationPreferences(
          '123',
          preferences
        )
      ).rejects.toThrow('Update failed');
    });
  });
});
