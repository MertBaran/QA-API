import { injectable, inject } from 'tsyringe';
import { INotificationChannelHandler } from '../contracts/INotificationChannelHandler';
import { NotificationPayload } from '../contracts/NotificationPayload';
import { EmailManager } from './EmailManager';

@injectable()
export class EmailNotificationHandler implements INotificationChannelHandler {
  constructor(@inject('EmailManager') private emailManager: EmailManager) {}
  canHandle(channel: string) {
    return channel === 'email';
  }
  async send(payload: NotificationPayload) {
    await this.emailManager.sendEmail({
      from: process.env['SMTP_USER'] || '',
      to: payload.to,
      subject: payload.subject || 'Notification',
      html: payload.html || payload.message,
    });
  }
}
