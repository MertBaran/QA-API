import { injectable } from 'tsyringe';
import { NotificationChannel } from '../contracts/NotificationChannel';
import { NotificationPayload } from '../contracts/NotificationPayload';
import { createSMTPTransporter } from '../../helpers/smtp/smtpConfig';

@injectable()
export class EmailChannel extends NotificationChannel {
  readonly type = 'email';

  displayName() {
    return 'E-posta';
  }

  async send(payload: NotificationPayload): Promise<void> {
    const transporter = createSMTPTransporter();

    try {
      const mailOptions = {
        from: process.env['SMTP_USER'] || '',
        to: payload.to,
        subject: payload.subject || 'Notification',
        html: payload.html || payload.message,
      };

      const _info = await transporter.sendMail(mailOptions);
    } catch (_error) {
      throw new Error('Email sending failed');
    }
  }

  async sendEmailWithTemplate(
    templateName: string,
    templateData: any,
    to: string,
    subject: string
  ): Promise<void> {
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
