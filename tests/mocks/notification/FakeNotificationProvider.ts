import { INotificationProvider, NotificationPayload } from '../../../services/notification/INotificationProvider';

export class FakeNotificationProvider implements INotificationProvider {
  public sent: NotificationPayload[] = [];
  async sendNotification(payload: NotificationPayload): Promise<void> {
    this.sent.push(payload);
  }
} 