import { injectable, inject } from 'tsyringe';
import {
  NotificationPayload,
  MultiChannelNotificationPayload,
  UserNotificationPreferences,
} from '../contracts/NotificationPayload';
import { NotificationChannel } from '../contracts/NotificationChannel';
import { INotificationService } from '../contracts/INotificationService';
import { IUserRepository } from '../../repositories/interfaces/IUserRepository';
import { EntityId } from '../../types/database';

@injectable()
export class NotificationManager implements INotificationService {
  constructor(
    @inject('IEmailChannel') private emailChannel: NotificationChannel,
    @inject('IUserRepository') private userRepository: IUserRepository
  ) {}

  async notify(payload: NotificationPayload): Promise<void> {
    // Şimdilik sadece email destekli
    if (payload.channel === 'email' || !payload.channel) {
      await this.emailChannel.send(payload);
    } else {
      throw new Error(
        `Notification channel '${payload.channel}' is not implemented yet.`
      );
    }
  }

  async notifyToMultipleChannels(
    payload: MultiChannelNotificationPayload
  ): Promise<void> {
    // Legacy implementation - sadece email kanalını destekler
    for (const channel of payload.channels) {
      if (channel === 'email') {
        await this.emailChannel.send({
          channel: 'email',
          to: payload.to,
          subject: payload.subject,
          message: payload.message,
          html: payload.html,
          data: payload.data,
        });
      }
    }
  }

  async notifyUser(
    userId: string,
    payload: Omit<NotificationPayload, 'channel' | 'to'>
  ): Promise<void> {
    const user = await this.userRepository.findById(userId as EntityId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    // Legacy implementation - sadece email gönder
    await this.emailChannel.send({
      channel: 'email',
      to: user.email,
      subject: payload.subject,
      message: payload.message,
      html: payload.html,
      data: payload.data,
    });
  }

  async getUserNotificationPreferences(
    userId: string
  ): Promise<UserNotificationPreferences> {
    const user = await this.userRepository.findById(userId as EntityId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    return {
      userId,
      email: user.notificationPreferences?.email ?? true,
      push: user.notificationPreferences?.push ?? false,
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
    const user = await this.userRepository.findById(userId as EntityId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

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

    await this.userRepository.updateById(userId as EntityId, updateData);
  }

  async getQueueStatus() {
    return {
      messageCount: 0,
      consumerCount: 0,
      deadLetterCount: 0,
    };
  }

  // Database operations - Not implemented for legacy manager
  async getUserNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    throw new Error(
      'getUserNotifications not implemented for NotificationManager'
    );
  }

  async getNotificationStats(userId?: string): Promise<any> {
    throw new Error(
      'getNotificationStats not implemented for NotificationManager'
    );
  }

  async notifyUserWithTemplate(
    userId: string,
    templateName: string,
    locale: string,
    variables: Record<string, any>
  ): Promise<void> {
    // Basic manager template'i desteklemiyor, SmartNotificationManager kullanılmalı
    throw new Error(
      'Template notifications are not supported in NotificationManager. Use SmartNotificationManager instead.'
    );
  }
}
