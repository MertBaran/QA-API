import { injectable, inject } from 'tsyringe';
import { INotificationService } from '../contracts/INotificationService';
import { IQueueProvider, QueueMessage } from '../contracts/IQueueProvider';
import {
  NotificationPayload,
  MultiChannelNotificationPayload,
  UserNotificationPreferences,
} from '../contracts/NotificationPayload';
import { IUserService } from '../contracts/IUserService';
import { EntityId } from '../../types/database';
// getLocalizedNotificationMessage kullanılmıyor, kaldırıldı
import { SupportedLanguage } from '../../constants/supportedLanguages';
import { ILoggerProvider } from '../../infrastructure/logging/ILoggerProvider';

export interface NotificationQueueMessage extends QueueMessage {
  type: 'notification';
  data: {
    payload: NotificationPayload | MultiChannelNotificationPayload;
    userId?: string;
    userLanguage?: SupportedLanguage;
  };
}

@injectable()
export class QueueBasedNotificationManager implements INotificationService {
  private readonly NOTIFICATION_QUEUE = 'notifications';
  private readonly NOTIFICATION_EXCHANGE = 'notification.exchange';
  private readonly DEAD_LETTER_QUEUE = 'notifications.dlq';
  private readonly DEAD_LETTER_EXCHANGE = 'notification.dlx';

  constructor(
    @inject('IQueueProvider') private queueProvider: IQueueProvider,
    @inject('IUserService') private userService: IUserService,
    @inject('ILoggerProvider') private logger: ILoggerProvider
  ) {}

  async initialize(): Promise<void> {
    try {
      // Dead letter exchange ve queue oluştur
      await this.queueProvider.createExchange(
        this.DEAD_LETTER_EXCHANGE,
        'direct',
        { durable: true }
      );
      await this.queueProvider.createQueue(this.DEAD_LETTER_QUEUE, {
        durable: true,
        autoDelete: false,
      });

      // Ana notification exchange oluştur
      await this.queueProvider.createExchange(
        this.NOTIFICATION_EXCHANGE,
        'topic',
        { durable: true }
      );

      // Ana notification queue oluştur
      await this.queueProvider.createQueue(this.NOTIFICATION_QUEUE, {
        durable: true,
        autoDelete: false,
        deadLetterExchange: this.DEAD_LETTER_EXCHANGE,
        deadLetterRoutingKey: this.DEAD_LETTER_QUEUE,
      });

      // System initialized silently
    } catch (error) {
      this.logger.error(
        'Failed to initialize queue-based notification system',
        {
          error: (error as Error).message,
        }
      );
      throw error;
    }
  }

  async notify(payload: NotificationPayload): Promise<void> {
    const message: NotificationQueueMessage = {
      id: this.generateMessageId(),
      type: 'notification',
      data: { payload },
      timestamp: new Date(),
      priority: this.getPriority(payload),
    };

    await this.queueProvider.publishToQueue(this.NOTIFICATION_QUEUE, message);
    this.logger.info('Notification queued', {
      messageId: message.id,
      channel: payload.channel,
    });
  }

  async notifyToMultipleChannels(
    payload: MultiChannelNotificationPayload
  ): Promise<void> {
    const message: NotificationQueueMessage = {
      id: this.generateMessageId(),
      type: 'notification',
      data: { payload },
      timestamp: new Date(),
      priority: this.getPriority(payload),
    };

    await this.queueProvider.publishToQueue(this.NOTIFICATION_QUEUE, message);
    this.logger.info('Multi-channel notification queued', {
      messageId: message.id,
      channels: payload.channels,
    });
  }

  async notifyUser(
    userId: string,
    payload: Omit<NotificationPayload, 'channel' | 'to'>
  ): Promise<void> {
    const user = await this.userService.findById(userId as EntityId);
    if (!user) {
      this.logger.error('User not found', { userId });
      throw new Error(`User with ID ${userId} not found.`);
    }

    const preferences = await this.getUserNotificationPreferences(userId);

    const activeChannels: string[] = [];

    if (preferences.email && user.email) {
      activeChannels.push('email');
    }
    if (preferences.push) {
      activeChannels.push('push');
    }
    if (preferences.sms && user.phoneNumber) {
      activeChannels.push('sms');
    }
    if (preferences.webhook && user.webhookUrl) {
      activeChannels.push('webhook');
    }

    if (activeChannels.length === 0) {
      this.logger.warn(
        `No active notification channels found for user ${userId}`
      );
      return;
    }

    const userLanguage = user.language as SupportedLanguage;
    const multiChannelPayload: MultiChannelNotificationPayload = {
      channels: activeChannels as any,
      to: user.email || userId,
      subject: payload.subject,
      message: payload.message,
      html: payload.html,
      data: {
        ...payload.data,
        userLanguage,
      },
    };

    const message: NotificationQueueMessage = {
      id: this.generateMessageId(),
      type: 'notification',
      data: {
        payload: multiChannelPayload,
        userId,
        userLanguage,
      },
      timestamp: new Date(),
      priority: this.getPriority(multiChannelPayload),
    };

    await this.queueProvider.publishToQueue(this.NOTIFICATION_QUEUE, message);
  }

  async getUserNotificationPreferences(
    userId: string
  ): Promise<UserNotificationPreferences> {
    const user = await this.userService.findById(userId as EntityId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    // Kullanıcının notification preferences'ını döndür
    // Gerçek uygulamada bu bilgi user model'inde veya ayrı bir tabloda saklanır
    return {
      userId,
      email: true,
      push: false,
      sms: false,
      webhook: false,
    };
  }

  async updateUserNotificationPreferences(
    userId: string,
    preferences: Partial<UserNotificationPreferences>
  ): Promise<void> {
    const user = await this.userService.findById(userId as EntityId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    // Kullanıcının notification preferences'ını güncelle
    // Gerçek uygulamada bu bilgi user model'inde veya ayrı bir tabloda saklanır
    this.logger.info('User notification preferences updated', {
      userId,
      preferences,
    });
  }

  // Queue consumer'ı başlat
  async startConsumer(): Promise<void> {
    await this.queueProvider.consume(
      this.NOTIFICATION_QUEUE,
      async (message: QueueMessage) => {
        await this.processNotificationMessage(
          message as NotificationQueueMessage
        );
      },
      { prefetch: 10 }
    );

    // Consumer started silently
  }

  // Queue'dan gelen mesajları işle
  private async processNotificationMessage(
    message: NotificationQueueMessage
  ): Promise<void> {
    try {
      if ('channels' in message.data.payload) {
        // Multi-channel notification
        await this.processMultiChannelNotification(
          message.data.payload as MultiChannelNotificationPayload
        );
      } else {
        // Single channel notification
        await this.processSingleChannelNotification(
          message.data.payload as NotificationPayload
        );
      }
    } catch (error) {
      this.logger.error('Failed to process notification message', {
        messageId: message.id,
        error: (error as Error).message,
      });
      throw error; // Requeue message
    }
  }

  private async processSingleChannelNotification(
    payload: NotificationPayload
  ): Promise<void> {
    try {
      this.logger.info('Processing single channel notification', {
        channel: payload.channel,
        to: payload.to,
        subject: payload.subject,
      });

      // Channel'a göre notification gönder
      switch (payload.channel) {
        case 'email':
          await this.sendEmailNotification(payload);
          break;
        case 'sms':
          await this.sendSMSNotification(payload);
          break;
        case 'push':
          await this.sendPushNotification(payload);
          break;
        default:
          this.logger.warn('Unsupported notification channel', {
            channel: payload.channel,
          });
      }
    } catch (error) {
      this.logger.error('Failed to send single channel notification', {
        channel: payload.channel,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private async processMultiChannelNotification(
    payload: MultiChannelNotificationPayload
  ): Promise<void> {
    try {
      // Her channel için notification gönder
      for (const channel of payload.channels) {
        try {
          const channelPayload: NotificationPayload = {
            channel,
            to: payload.to,
            subject: payload.subject,
            message: payload.message,
            html: payload.html,
            data: payload.data,
          };

          switch (channel) {
            case 'email':
              await this.sendEmailNotification(channelPayload);
              break;
            case 'sms':
              await this.sendSMSNotification(channelPayload);
              break;
            case 'push':
              await this.sendPushNotification(channelPayload);
              break;
            case 'webhook':
              await this.sendWebhookNotification(channelPayload);
              break;
            default:
              this.logger.warn('Unsupported notification channel', {
                channel,
              });
          }
        } catch (error) {
          this.logger.error('Failed to send notification to channel', {
            channel,
            error: (error as Error).message,
          });
          // Bir channel başarısız olsa bile diğerlerini denemeye devam et
        }
      }
    } catch (error) {
      this.logger.error('Failed to send multi-channel notification', {
        channels: payload.channels,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private async sendEmailNotification(
    payload: NotificationPayload
  ): Promise<void> {
    const { container } = await import('tsyringe');
    const emailChannel = container.resolve('IEmailChannel') as any;
    await emailChannel.send(payload);
  }

  private async sendSMSNotification(
    payload: NotificationPayload
  ): Promise<void> {
    const { container } = await import('tsyringe');
    const smsChannel = container.resolve('ISMSChannel') as any;
    await smsChannel.send(payload);
  }

  private async sendPushNotification(
    payload: NotificationPayload
  ): Promise<void> {
    const { container } = await import('tsyringe');
    const pushChannel = container.resolve('IPushChannel') as any;
    await pushChannel.send(payload);
  }

  private async sendWebhookNotification(
    payload: NotificationPayload
  ): Promise<void> {
    const { container } = await import('tsyringe');
    const webhookChannel = container.resolve('IWebhookChannel') as any;
    await webhookChannel.send(payload);
  }

  private generateMessageId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getPriority(
    payload: NotificationPayload | MultiChannelNotificationPayload
  ): number {
    // Priority logic - urgent notifications get higher priority
    if (payload.data?.priority === 'urgent') return 10;
    if (payload.data?.priority === 'high') return 8;
    if (payload.data?.priority === 'normal') return 5;
    return 1; // low priority
  }

  // Queue durumunu kontrol et
  async getQueueStatus(): Promise<{
    messageCount: number;
    consumerCount: number;
    deadLetterCount: number;
  }> {
    const mainQueueInfo = await this.queueProvider.getQueueInfo(
      this.NOTIFICATION_QUEUE
    );
    const deadLetterInfo = await this.queueProvider.getQueueInfo(
      this.DEAD_LETTER_QUEUE
    );

    return {
      messageCount: mainQueueInfo.messageCount,
      consumerCount: mainQueueInfo.consumerCount,
      deadLetterCount: deadLetterInfo.messageCount,
    };
  }

  // Database operations - Not implemented for queue manager
  async getUserNotifications(
    _userId: string,
    _limit: number = 50,
    _offset: number = 0
  ): Promise<any[]> {
    throw new Error(
      'getUserNotifications not implemented for QueueBasedNotificationManager'
    );
  }

  async getNotificationStats(_userId?: string): Promise<any> {
    throw new Error(
      'getNotificationStats not implemented for QueueBasedNotificationManager'
    );
  }

  async notifyUserWithTemplate(
    _userId: string,
    _templateName: string,
    _locale: string,
    _variables: Record<string, any>
  ): Promise<void> {
    // Queue-based manager template'i desteklemiyor, SmartNotificationManager kullanılmalı
    throw new Error(
      'Template notifications are not supported in QueueBasedNotificationManager. Use SmartNotificationManager instead.'
    );
  }
}
