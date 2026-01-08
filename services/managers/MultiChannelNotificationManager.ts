import { injectable, inject } from 'tsyringe';
import { INotificationService } from '../contracts/INotificationService';
import { INotificationChannelRegistry } from '../contracts/INotificationChannelRegistry';
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
import { INotificationRepository } from '../../repositories/interfaces/INotificationRepository';

@injectable()
export class MultiChannelNotificationManager implements INotificationService {
  private logger: ILoggerProvider;

  constructor(
    @inject('INotificationChannelRegistry')
    private channelRegistry: INotificationChannelRegistry,
    @inject('IUserService')
    private userService: IUserService,
    @inject('ILoggerProvider') logger: ILoggerProvider,
    @inject('INotificationRepository')
    private notificationRepository: INotificationRepository
  ) {
    this.logger = logger;
    // Channel registry'ye kanalları kaydet
    this.initializeChannels();
  }

  private initializeChannels(): void {
    // Container'dan kanalları alıp registry'ye kaydet
    try {
      const { container } = require('tsyringe');
      const { TOKENS } = require('../TOKENS');

      // Email channel
      const emailChannel = container.resolve(TOKENS.IEmailChannel);
      this.channelRegistry.registerChannel(emailChannel);

      // SMS channel
      const smsChannel = container.resolve(TOKENS.ISMSChannel);
      this.channelRegistry.registerChannel(smsChannel);

      // Push channel
      const pushChannel = container.resolve(TOKENS.IPushChannel);
      this.channelRegistry.registerChannel(pushChannel);

      // Webhook channel
      const webhookChannel = container.resolve(TOKENS.IWebhookChannel);
      this.channelRegistry.registerChannel(webhookChannel);
    } catch (error) {
      this.logger.error('❌ Failed to initialize channels:', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async notify(payload: NotificationPayload): Promise<void> {
    if (!this.channelRegistry.isChannelSupported(payload.channel)) {
      throw new Error(
        `Notification channel '${payload.channel}' is not supported.`
      );
    }

    await this.channelRegistry.sendToChannel(payload.channel, payload);
  }

  async notifyToMultipleChannels(
    payload: MultiChannelNotificationPayload
  ): Promise<void> {
    this.logger.info('notifyToMultipleChannels called', {
      channels: payload.channels,
      to: payload.to,
      subject: payload.subject,
      supportedChannels: this.channelRegistry.getSupportedChannelTypes(),
    });

    const promises: Promise<void>[] = [];

    for (const channel of payload.channels) {
      const isSupported = this.channelRegistry.isChannelSupported(channel);
      this.logger.info(`Checking channel ${channel}`, {
        channel,
        isSupported,
      });

      if (isSupported) {
        const channelPayload: NotificationPayload = {
          channel,
          to: payload.to,
          subject: payload.subject,
          message: payload.message,
          html: payload.html,
          data: payload.data,
        };

        this.logger.info(`Sending to channel ${channel}`, {
          channel,
          to: channelPayload.to,
          subject: channelPayload.subject,
          hasHtml: !!channelPayload.html,
        });

        promises.push(
          this.channelRegistry
            .sendToChannel(channel, channelPayload)
            .then(() => {
              this.logger.info(
                `Successfully sent notification to channel ${channel}`
              );
            })
            .catch(error => {
              this.logger.error(
                `Failed to send notification to channel ${channel}`,
                {
                  channel,
                  error: error instanceof Error ? error.message : String(error),
                  stack: error instanceof Error ? error.stack : undefined,
                }
              );
              throw error; // Re-throw to ensure errors are not silently ignored
            })
        );
      } else {
        this.logger.warn(`Channel ${channel} is not supported, skipping`);
      }
    }

    if (promises.length === 0) {
      this.logger.warn('No supported channels found for notification', {
        requestedChannels: payload.channels,
        supportedChannels: this.channelRegistry.getSupportedChannelTypes(),
      });
      throw new Error('No supported channels found for notification');
    }

    // Tüm kanallara paralel olarak gönder ve hataları kontrol et
    const results = await Promise.allSettled(promises);
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const channel = payload.channels[index];
        const error =
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason);
        errors.push(`Channel ${channel}: ${error}`);
        this.logger.error(`Notification failed for channel ${channel}`, {
          channel,
          error: error,
          reason: result.reason,
        });
      }
    });

    if (errors.length > 0) {
      throw new Error(
        `Failed to send notifications to some channels: ${errors.join('; ')}`
      );
    }

    this.logger.info('All notifications sent successfully', {
      channels: payload.channels,
    });
  }

  async notifyUser(
    userId: string,
    payload: Omit<NotificationPayload, 'channel' | 'to'>
  ): Promise<void> {
    const user = await this.userService.findById(userId as EntityId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    if (!user.email) {
      throw new Error(`User ${userId} does not have an email address`);
    }

    const preferences = await this.getUserNotificationPreferences(userId);
    const activeChannels: string[] = [];

    // Email channel - varsayılan olarak aktif (eğer kullanıcı tercihi yoksa)
    if (user.email) {
      if (preferences.email !== false) {
        // undefined veya true ise aktif
        activeChannels.push('email');
      }
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
      console.warn(`No active notification channels found for user ${userId}`, {
        userId,
        hasEmail: !!user.email,
        preferences,
      });
      throw new Error(
        `No active notification channels found for user ${userId}`
      );
    }

    console.log(
      `Sending notification to user ${userId} via channels:`,
      activeChannels
    );

    // Kullanıcının dil tercihini al
    const userLanguage = user.language as SupportedLanguage;

    const multiChannelPayload: MultiChannelNotificationPayload = {
      channels: activeChannels as any,
      to: user.email || userId,
      subject: payload.subject,
      message: payload.message,
      html: payload.html,
      data: {
        ...payload.data,
        userLanguage, // Dil bilgisini data'ya ekle
      },
    };

    try {
      await this.notifyToMultipleChannels(multiChannelPayload);
      console.log(
        `Notification sent successfully to user ${userId} via channels:`,
        activeChannels
      );
    } catch (error) {
      console.error(`Failed to send notification to user ${userId}:`, error);
      throw error;
    }
  }

  async getUserNotificationPreferences(
    userId: string
  ): Promise<UserNotificationPreferences> {
    const user = await this.userService.findById(userId as EntityId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    // Varsayılan tercihler - gerçek uygulamada bu veriler user model'inde tutulabilir
    return {
      userId,
      email: user.notificationPreferences?.email ?? true,
      push: user.notificationPreferences?.push ?? true,
      sms: user.notificationPreferences?.sms ?? false,
      webhook: user.notificationPreferences?.webhook ?? false,
      emailAddress: user.email,
      phoneNumber: user.phoneNumber,
      webhookUrl: user.webhookUrl,
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

    // User model'ini güncelle - gerçek uygulamada notificationPreferences field'ı eklenebilir
    const updateData: any = {};

    if (preferences.email !== undefined) {
      updateData['notificationPreferences.email'] = preferences.email;
    }
    if (preferences.push !== undefined) {
      updateData['notificationPreferences.push'] = preferences.push;
    }
    if (preferences.sms !== undefined) {
      updateData['notificationPreferences.sms'] = preferences.sms;
    }
    if (preferences.webhook !== undefined) {
      updateData['notificationPreferences.webhook'] = preferences.webhook;
    }

    await this.userService.updateById(userId as EntityId, updateData);
  }

  // Direct notification sistemi için queue status yok
  async getQueueStatus(): Promise<{
    messageCount: number;
    consumerCount: number;
    deadLetterCount: number;
  }> {
    throw new Error('Queue status not available in direct notification system');
  }

  // Database operations - Not implemented for direct manager
  async getUserNotifications(
    _userId: string,
    _limit: number = 50,
    _offset: number = 0
  ): Promise<any[]> {
    throw new Error(
      'getUserNotifications not implemented for MultiChannelNotificationManager'
    );
  }

  async getNotificationStats(_userId?: string): Promise<any> {
    throw new Error(
      'getNotificationStats not implemented for MultiChannelNotificationManager'
    );
  }

  async notifyUserWithTemplate(
    userId: string,
    templateName: string,
    locale: string,
    variables: Record<string, any>
  ): Promise<void> {
    try {
      this.logger.info('notifyUserWithTemplate called', {
        userId,
        templateName,
        locale,
        variables: Object.keys(variables),
      });

      // Template'i veritabanından al
      const template =
        await this.notificationRepository.getTemplateByName(templateName);
      if (!template) {
        throw new Error(`Template '${templateName}' not found`);
      }

      if (!template.isActive) {
        throw new Error(`Template '${templateName}' is not active`);
      }

      // Template içeriğini locale'e göre al
      const subject =
        template.subject[locale as keyof typeof template.subject] ||
        template.subject.en;
      const message =
        template.message[locale as keyof typeof template.message] ||
        template.message.en;
      const html =
        template.html?.[locale as keyof typeof template.html] ||
        template.html?.en;

      // Template variables'ları replace et
      let processedSubject = subject;
      let processedMessage = message;
      let processedHtml = html;

      for (const [key, value] of Object.entries(variables)) {
        const placeholder = `{{${key}}}`;
        processedSubject = processedSubject.replace(
          new RegExp(placeholder, 'g'),
          String(value)
        );
        processedMessage = processedMessage.replace(
          new RegExp(placeholder, 'g'),
          String(value)
        );
        if (processedHtml) {
          processedHtml = processedHtml.replace(
            new RegExp(placeholder, 'g'),
            String(value)
          );
        }
      }

      this.logger.info('Template processed successfully', {
        templateName,
        locale,
        hasSubject: !!processedSubject,
        hasMessage: !!processedMessage,
        hasHtml: !!processedHtml,
      });

      // Notification gönder
      await this.notifyUser(userId, {
        subject: processedSubject,
        message: processedMessage,
        html: processedHtml,
        data: variables,
      });

      this.logger.info('Template notification sent successfully', {
        userId,
        templateName,
      });
    } catch (error) {
      this.logger.error('Template notification failed', {
        userId,
        templateName,
        locale,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }
}
