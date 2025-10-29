import { injectable } from 'tsyringe';
import { INotificationChannelHandler } from '../contracts/INotificationChannelHandler';
import { NotificationPayload } from '../contracts/NotificationPayload';
import { createSMTPTransporter } from '../../config/smtpConfig';

@injectable()
export class EmailNotificationHandler implements INotificationChannelHandler {
  canHandle(channel: string) {
    return channel === 'email';
  }

  async send(payload: NotificationPayload) {
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
