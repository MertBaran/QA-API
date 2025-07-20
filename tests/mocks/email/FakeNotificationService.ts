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
}
