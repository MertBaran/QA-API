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

@injectable()
export class MultiChannelNotificationManager implements INotificationService {
  constructor(
    @inject('INotificationChannelRegistry')
    private channelRegistry: INotificationChannelRegistry,
    @inject('IUserService')
    private userService: IUserService
  ) {
    // Channel registry'ye kanalları kaydet
    this.initializeChannels();
  }

  private initializeChannels(): void {
    // Container'dan kanalları alıp registry'ye kaydet
    try {
      const { container } = require('tsyringe');

      // Email channel
      const emailChannel = container.resolve('IEmailChannel');
      this.channelRegistry.registerChannel(emailChannel);

      // SMS channel
      const smsChannel = container.resolve('ISMSChannel');
      this.channelRegistry.registerChannel(smsChannel);

      // Push channel
      const pushChannel = container.resolve('IPushChannel');
      this.channelRegistry.registerChannel(pushChannel);

      // Webhook channel
      const webhookChannel = container.resolve('IWebhookChannel');
      this.channelRegistry.registerChannel(webhookChannel);
    } catch (error) {
      console.error('❌ Failed to initialize channels:', error);
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
    const promises: Promise<void>[] = [];

    for (const channel of payload.channels) {
      if (this.channelRegistry.isChannelSupported(channel)) {
        const channelPayload: NotificationPayload = {
          channel,
          to: payload.to,
          subject: payload.subject,
          message: payload.message,
          html: payload.html,
          data: payload.data,
        };

        promises.push(
          this.channelRegistry.sendToChannel(channel, channelPayload)
        );
      }
    }

    // Tüm kanallara paralel olarak gönder
    await Promise.allSettled(promises);
  }

  async notifyUser(
    userId: string,
    payload: Omit<NotificationPayload, 'channel' | 'to'>
  ): Promise<void> {
    const user = await this.userService.findById(userId as EntityId);
    if (!user) {
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
      console.warn(`No active notification channels found for user ${userId}`);
      return;
    }

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

    await this.notifyToMultipleChannels(multiChannelPayload);
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
    _userId: string,
    _templateName: string,
    _locale: string,
    _variables: Record<string, any>
  ): Promise<void> {
    // Multi-channel manager template'i desteklemiyor, SmartNotificationManager kullanılmalı
    throw new Error(
      'Template notifications are not supported in MultiChannelNotificationManager. Use SmartNotificationManager instead.'
    );
  }
}
