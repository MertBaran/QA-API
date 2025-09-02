import { injectable } from 'tsyringe';
import { NotificationChannel } from '../contracts/NotificationChannel';
import { NotificationPayload } from '../contracts/NotificationPayload';
import { ILoggerProvider } from '../../infrastructure/logging/ILoggerProvider';

@injectable()
export class WebhookChannel extends NotificationChannel {
  readonly type = 'webhook';
  private logger: ILoggerProvider;

  constructor(logger: ILoggerProvider) {
    super();
    this.logger = logger;
  }

  displayName() {
    return 'Webhook';
  }

  async send(payload: NotificationPayload): Promise<void> {
    // Webhook gönderme implementasyonu
    // Gerçek uygulamada HTTP POST request gönderilir
    this.logger.info(`Webhook notification sent`, {
      to: payload.to,
      message: payload.message,
      subject: payload.subject,
      channel: this.type
    });

    try {
      // Simüle edilmiş webhook gönderimi
      const _webhookData = {
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
      
      this.logger.debug(`Webhook notification completed successfully`, {
        to: payload.to,
        duration: '200ms'
      });
    } catch (error) {
      this.logger.error(`Webhook sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        to: payload.to,
        message: payload.message,
        channel: this.type,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }
}
