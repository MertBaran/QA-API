import { injectable } from 'tsyringe';
import { NotificationChannel } from '../contracts/NotificationChannel';
import { NotificationPayload } from '../contracts/NotificationPayload';

@injectable()
export class PushChannel extends NotificationChannel {
  readonly type = 'push';

  displayName() {
    return 'Push Notification';
  }

  async send(payload: NotificationPayload): Promise<void> {
    // Push notification gönderme implementasyonu
    // Gerçek uygulamada Firebase Cloud Messaging, OneSignal gibi servisler kullanılabilir
    console.log(`Push notification sent to ${payload.to}: ${payload.message}`);

    // Simüle edilmiş push notification gönderimi
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}
