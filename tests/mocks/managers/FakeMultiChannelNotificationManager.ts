import { INotificationService } from '../../../services/contracts/INotificationService';
import { INotificationChannelRegistry } from '../../../services/contracts/INotificationChannelRegistry';
import { IUserService } from '../../../services/contracts/IUserService';
import {
  NotificationPayload,
  MultiChannelNotificationPayload,
} from '../../../services/contracts/NotificationPayload';

export class FakeMultiChannelNotificationManager
  implements INotificationService
{
  constructor(
    private channelRegistry: INotificationChannelRegistry,
    private userService: IUserService
  ) {}

  async notify(payload: NotificationPayload): Promise<void> {
    // Mock implementation
    console.log(
      `Fake notification sent to ${payload.channel}: ${payload.message}`
    );
  }

  async notifyToMultipleChannels(
    payload: MultiChannelNotificationPayload
  ): Promise<void> {
    // Mock implementation
    console.log(
      `Fake multi-channel notification sent to: ${payload.channels.join(', ')}`
    );
  }

  async notifyUser(
    userId: string,
    payload: Omit<NotificationPayload, 'channel' | 'to'>
  ): Promise<void> {
    // Mock implementation
    console.log(`Fake user notification sent to user ${userId}`);
  }

  async getUserNotificationPreferences(userId: string): Promise<any> {
    // Get user and return preferences
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }
    return {
      userId,
      email: user.notificationPreferences?.email ?? true,
      push: user.notificationPreferences?.push ?? true,
      sms: user.notificationPreferences?.sms ?? false,
      webhook: user.notificationPreferences?.webhook ?? false,
    };
  }

  async updateUserNotificationPreferences(
    userId: string,
    preferences: any
  ): Promise<void> {
    // Update user with preferences
    await this.userService.updateById(userId, {
      notificationPreferences: preferences,
    });
  }

  async getQueueStatus(): Promise<any> {
    // Mock implementation
    return {
      messageCount: 0,
      consumerCount: 0,
      deadLetterCount: 0,
    };
  }

  async getUserNotifications(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    // Mock implementation
    return [];
  }

  async getNotificationStats(userId: string): Promise<any> {
    // Mock implementation
    return {
      total: 0,
      sent: 0,
      failed: 0,
    };
  }

  async notifyUserWithTemplate(
    userId: string,
    templateName: string,
    locale: string,
    variables: any
  ): Promise<void> {
    // Mock implementation
    console.log(`Fake template notification sent to user ${userId}`);
  }
}
