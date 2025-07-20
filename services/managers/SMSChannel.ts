import { injectable } from 'tsyringe';
import { NotificationChannel } from '../contracts/NotificationChannel';
import { NotificationPayload } from '../contracts/NotificationPayload';

@injectable()
export class SMSChannel extends NotificationChannel {
  readonly type = 'sms';

  displayName() {
    return 'SMS';
  }

  async send(payload: NotificationPayload): Promise<void> {
    // SMS gönderme implementasyonu
    // Gerçek uygulamada Twilio, AWS SNS gibi servisler kullanılabilir
    console.log(`SMS sent to ${payload.to}: ${payload.message}`);

    // Simüle edilmiş SMS gönderimi
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
