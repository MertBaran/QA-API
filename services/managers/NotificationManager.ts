import { injectable, inject } from 'tsyringe';
import { NotificationPayload } from '../contracts/NotificationPayload';
import { NotificationChannel } from '../contracts/NotificationChannel';
import { INotificationService } from '../contracts/INotificationService';

@injectable()
export class NotificationManager implements INotificationService {
  constructor(
    @inject('IEmailChannel') private emailChannel: NotificationChannel
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
}
