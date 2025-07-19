import { injectable, inject, container } from 'tsyringe';
import { INotificationProvider, NotificationPayload } from './INotificationProvider';

@injectable()
export class NotificationService {
  constructor(
    @inject('EmailNotificationProvider') private emailProvider: INotificationProvider,
    // İleride sms/whatsapp provider'lar da eklenebilir
  ) {}

  async send(payload: NotificationPayload): Promise<void> {
    // Şimdilik sadece email destekli
    if (payload.channel === 'email' || !payload.channel) {
      await this.emailProvider.sendNotification(payload);
    } else {
      throw new Error(`Notification channel '${payload.channel}' is not implemented yet.`);
    }
  }
} 