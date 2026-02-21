import { injectable, inject } from 'tsyringe';
import { NotificationChannel } from '../contracts/NotificationChannel';
import { NotificationPayload } from '../contracts/NotificationPayload';
import { ILoggerProvider } from '../../infrastructure/logging/ILoggerProvider';
import { TOKENS } from '../TOKENS';

@injectable()
export class SMSChannel extends NotificationChannel {
  readonly type = 'sms';
  private logger: ILoggerProvider;

  constructor(@inject(TOKENS.ILoggerProvider) logger: ILoggerProvider) {
    super();
    this.logger = logger;
  }

  displayName() {
    return 'SMS';
  }

  async send(payload: NotificationPayload): Promise<void> {
    // SMS gönderme implementasyonu
    // Gerçek uygulamada Twilio, AWS SNS gibi servisler kullanılabilir
    this.logger.info(`SMS notification sent`, {
      to: payload.to,
      message: payload.message,
      subject: payload.subject,
      channel: this.type,
    });

    try {
      // Simüle edilmiş SMS gönderimi
      await new Promise(resolve => setTimeout(resolve, 100));

      this.logger.debug(`SMS notification completed successfully`, {
        to: payload.to,
        duration: '100ms',
      });
    } catch (error) {
      this.logger.error(
        `SMS notification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
