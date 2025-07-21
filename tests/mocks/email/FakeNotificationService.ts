import {
  NotificationPayload,
  MultiChannelNotificationPayload,
  UserNotificationPreferences,
} from '../../../services/contracts/NotificationPayload';
import { INotificationService } from '../../../services/contracts/INotificationService';

export class FakeNotificationService implements INotificationService {
  public sent: NotificationPayload[] = [];
  public multiChannelSent: MultiChannelNotificationPayload[] = [];
  public userNotifications: Map<
    string,
    Omit<NotificationPayload, 'channel' | 'to'>[]
  > = new Map();

  async notify(payload: NotificationPayload): Promise<void> {
    this.sent.push(payload);
  }

  async notifyToMultipleChannels(
    payload: MultiChannelNotificationPayload
  ): Promise<void> {
    this.multiChannelSent.push(payload);
  }

  async notifyUser(
    userId: string,
    payload: Omit<NotificationPayload, 'channel' | 'to'>
  ): Promise<void> {
    if (!this.userNotifications.has(userId)) {
      this.userNotifications.set(userId, []);
    }
    this.userNotifications.get(userId)!.push(payload);
  }

  async getUserNotificationPreferences(
    userId: string
  ): Promise<UserNotificationPreferences> {
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
    // Mock implementation - preferences güncelleme
  }

  async getQueueStatus() {
    return {
      messageCount: 0,
      consumerCount: 0,
      deadLetterCount: 0,
    };
  }

  // Database operations - Mock implementation
  async getUserNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    return [];
  }

  async getNotificationStats(userId?: string): Promise<any> {
    return {
      total: 0,
      pending: 0,
      sent: 0,
      failed: 0,
      delivered: 0,
      read: 0,
    };
  }

  async notifyUserWithTemplate(
    userId: string,
    templateName: string,
    locale: string,
    variables: Record<string, any>
  ): Promise<void> {
    // Mock implementation
    console.log(
      `Mock: Template notification sent to user ${userId} using template ${templateName} in locale ${locale}`
    );
  }
}
