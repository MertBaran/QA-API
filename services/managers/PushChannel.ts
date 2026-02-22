import { injectable, inject } from 'tsyringe';
import { NotificationChannel } from '../contracts/NotificationChannel';
import { NotificationPayload } from '../contracts/NotificationPayload';
import { ILoggerProvider } from '../../infrastructure/logging/ILoggerProvider';
import { TOKENS } from '../TOKENS';

@injectable()
export class PushChannel extends NotificationChannel {
  readonly type = 'push';
  private logger: ILoggerProvider;

  constructor(@inject(TOKENS.ILoggerProvider) logger: ILoggerProvider) {
    super();
    this.logger = logger;
  }

  displayName() {
    return 'Push Notification';
  }

  async send(payload: NotificationPayload): Promise<void> {
    // Push notification gönderme implementasyonu
    // Gerçek uygulamada Firebase Cloud Messaging, OneSignal gibi servisler kullanılabilir
    this.logger.info(`Push notification sent`, {
      to: payload.to,
      message: payload.message,
      subject: payload.subject,
      channel: this.type,
    });

    try {
      // Simüle edilmiş push notification gönderimi
      await new Promise(resolve => setTimeout(resolve, 50));

      this.logger.debug(`Push notification completed successfully`, {
        to: payload.to,
        duration: '50ms',
      });
    } catch (error) {
      this.logger.error(
        `Push notification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        {
          to: payload.to,
          message: payload.message,
          channel: this.type,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      );
      throw error;
    }
  }
}
