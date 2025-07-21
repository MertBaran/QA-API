import {
  INotificationProvider,
  NotificationPayload,
} from '../../../services/notification/INotificationProvider';
import { INotificationService } from '../../../services/contracts/INotificationService';

export class FakeNotificationProvider
  implements INotificationProvider, INotificationService
{
  public sent: NotificationPayload[] = [];

  // INotificationService interface'i için
  public notify = jest
    .fn()
    .mockImplementation(async (payload: NotificationPayload): Promise<void> => {
      this.sent.push(payload);
    });

  // INotificationProvider interface'i için
  async sendNotification(payload: NotificationPayload): Promise<void> {
    this.sent.push(payload);
  }

  // INotificationService'in diğer metodları (mock implementations)
  async notifyToMultipleChannels(): Promise<void> {}
  async notifyUser(): Promise<void> {}
  async getUserNotificationPreferences(): Promise<any> {
    return {};
  }
  async updateUserNotificationPreferences(): Promise<void> {}
  async getUserNotifications(): Promise<any[]> {
    return [];
  }
  async getNotificationStats(): Promise<any> {
    return {};
  }
  async notifyUserWithTemplate(): Promise<void> {}
}
