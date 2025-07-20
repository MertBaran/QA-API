import { injectable, inject } from 'tsyringe';
import { NotificationChannel } from '../contracts/NotificationChannel';
import { NotificationPayload } from '../contracts/NotificationPayload';
import { IEmailService } from '../contracts/IEmailService';

@injectable()
export class EmailChannel extends NotificationChannel {
  readonly type = 'email';
  constructor(@inject('IEmailService') private emailManager: IEmailService) {
    super();
  }

  displayName() {
    return 'E-posta';
  }

  async send(payload: NotificationPayload): Promise<void> {
    await this.emailManager.sendEmail({
      from: process.env['SMTP_USER'] || '',
      to: payload.to,
      subject: payload.subject || 'Notification',
      html: payload.html || payload.message,
    });
  }
}
