import { injectable } from 'tsyringe';
import { NotificationChannel } from '../contracts/NotificationChannel';
import { NotificationPayload } from '../contracts/NotificationPayload';

@injectable()
export class WebhookChannel extends NotificationChannel {
  readonly type = 'webhook';

  displayName() {
    return 'Webhook';
  }

  async send(payload: NotificationPayload): Promise<void> {
    // Webhook gönderme implementasyonu
    // Gerçek uygulamada HTTP POST request gönderilir
    console.log(`Webhook sent to ${payload.to}: ${payload.message}`);

    try {
      // Simüle edilmiş webhook gönderimi
      const webhookData = {
        message: payload.message,
        subject: payload.subject,
        data: payload.data,
        timestamp: new Date().toISOString(),
      };

      // Gerçek implementasyonda fetch veya axios kullanılır
      // await fetch(payload.to, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(webhookData)
      // });

      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error('Webhook sending failed:', error);
      throw error;
    }
  }
}
