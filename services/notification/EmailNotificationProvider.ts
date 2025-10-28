import { injectable } from 'tsyringe';
import {
  INotificationProvider,
  NotificationPayload,
} from './INotificationProvider';
import { createSMTPTransporter } from '../../config/smtpConfig';

@injectable()
export class EmailNotificationProvider implements INotificationProvider {
  async sendNotification(payload: NotificationPayload): Promise<void> {
    const transporter = createSMTPTransporter();

    const mailOptions = {
      from: process.env['SMTP_USER'] || '',
      to: payload.to,
      subject: payload.subject || 'Notification',
      html: payload.html || payload.message,
    };

    await transporter.sendMail(mailOptions);
  }
}
