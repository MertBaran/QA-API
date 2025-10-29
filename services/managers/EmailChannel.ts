import { injectable } from 'tsyringe';
import { NotificationChannel } from '../contracts/NotificationChannel';
import { NotificationPayload } from '../contracts/NotificationPayload';
import { createSMTPTransporter } from '../../config/smtpConfig';
import { ILoggerProvider } from '../../infrastructure/logging/ILoggerProvider';

@injectable()
export class EmailChannel extends NotificationChannel {
  readonly type = 'email';
  private logger: ILoggerProvider;

  constructor(logger: ILoggerProvider) {
    super();
    this.logger = logger;
  }

  displayName() {
    return 'E-posta';
  }

  async send(payload: NotificationPayload): Promise<void> {
    this.logger.info(`Email notification sent`, {
      to: payload.to,
      subject: payload.subject,
      channel: this.type,
    });

    const transporter = createSMTPTransporter();

    try {
      const mailOptions = {
        from: process.env['SMTP_USER'] || '',
        to: payload.to,
        subject: payload.subject || 'Notification',
        html: payload.html || payload.message,
      };

      const _info = await transporter.sendMail(mailOptions);

      this.logger.debug(`Email notification completed successfully`, {
        to: payload.to,
        subject: payload.subject,
        channel: this.type,
      });
    } catch (_error) {
      this.logger.error(
        `Email sending failed: ${_error instanceof Error ? _error.message : 'Unknown error'}`,
        {
          to: payload.to,
          subject: payload.subject,
          channel: this.type,
          error: _error instanceof Error ? _error.message : 'Unknown error',
        }
      );
      throw new Error('Email sending failed');
    }
  }

  async sendEmailWithTemplate(
    templateName: string,
    templateData: any,
    to: string,
    subject: string
  ): Promise<void> {
    this.logger.info(`Email template notification sent`, {
      to,
      subject,
      template: templateName,
      channel: this.type,
    });

    const html = this.generateTemplate(templateName, templateData);

    await this.send({
      channel: 'email',
      to,
      subject,
      message: '',
      html,
    });
  }

  private generateTemplate(templateName: string, templateData: any): string {
    // Basit template generation - gerçek uygulamada template engine kullanılmalı
    switch (templateName) {
      case 'reset-password':
        return `
          <h1>Şifre Sıfırlama</h1>
          <p>Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:</p>
          <a href="${templateData.resetUrl}">Şifremi Sıfırla</a>
        `;
      case 'welcome':
        return `
          <h1>Hoş Geldiniz!</h1>
          <p>Merhaba ${templateData.name},</p>
          <p>Hesabınız başarıyla oluşturuldu.</p>
        `;
      default:
        return `
          <h1>Bildirim</h1>
          <p>${templateData.message || 'Bu bir bildirimdir.'}</p>
        `;
    }
  }
}
