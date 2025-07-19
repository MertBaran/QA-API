import { injectable, inject } from 'tsyringe';
import { INotificationProvider, NotificationPayload } from './INotificationProvider';
import { IEmailService, MailOptions } from '../contracts/IEmailService';

@injectable()
export class EmailNotificationProvider implements INotificationProvider {
  constructor(@inject('EmailManager') private emailService: IEmailService) {}

  async sendNotification(payload: NotificationPayload): Promise<void> {
    const mailOptions: MailOptions = {
      from: process.env["SMTP_USER"] || '',
      to: payload.to,
      subject: payload.subject || 'Notification',
      html: payload.html || payload.message,
    };
    await this.emailService.sendEmail(mailOptions);
  }
} 