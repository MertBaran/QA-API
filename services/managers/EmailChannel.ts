import { injectable, inject } from 'tsyringe';
import { NotificationChannel } from '../contracts/NotificationChannel';
import { NotificationPayload } from '../contracts/NotificationPayload';
import { createSMTPTransporter } from '../../config/smtpConfig';
import { ILoggerProvider } from '../../infrastructure/logging/ILoggerProvider';
import { TOKENS } from '../TOKENS';

@injectable()
export class EmailChannel extends NotificationChannel {
  readonly type = 'email';
  private logger: ILoggerProvider;

  constructor(@inject(TOKENS.ILoggerProvider) logger: ILoggerProvider) {
    super();
    this.logger = logger;
  }

  displayName() {
    return 'E-posta';
  }

  async send(payload: NotificationPayload): Promise<void> {
    const smtpUser = process.env['SMTP_USER'] || '';
    const smtpPass = process.env['SMTP_APP_PASS'] || '';

    this.logger.info(`Attempting to send email notification`, {
      to: payload.to,
      subject: payload.subject,
      channel: this.type,
      hasSmtpUser: !!smtpUser,
      hasSmtpPass: !!smtpPass,
    });

    if (!smtpUser) {
      const error = 'SMTP_USER environment variable is not set';
      this.logger.error(error);
      throw new Error(error);
    }

    if (!smtpPass) {
      const error = 'SMTP_APP_PASS environment variable is not set';
      this.logger.error(error);
      throw new Error(error);
    }

    if (!payload.to) {
      const error = 'Email recipient (to) is not specified';
      this.logger.error(error);
      throw new Error(error);
    }

    let transporter;
    try {
      transporter = createSMTPTransporter();
      // Verify SMTP connection
      await transporter.verify();
      this.logger.info('SMTP connection verified successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `SMTP connection verification failed: ${errorMessage}`,
        {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
        }
      );
      throw new Error(`SMTP connection failed: ${errorMessage}`);
    }

    try {
      const mailOptions = {
        from: smtpUser,
        to: payload.to,
        subject: payload.subject || 'Notification',
        html: payload.html || payload.message,
      };

      this.logger.info('Sending email', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
        hasHtml: !!mailOptions.html,
      });

      const info = await transporter.sendMail(mailOptions);

      this.logger.info(`Email notification sent successfully`, {
        to: payload.to,
        subject: payload.subject,
        channel: this.type,
        messageId: info.messageId,
        response: info.response,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Email sending failed: ${errorMessage}`, {
        to: payload.to,
        subject: payload.subject,
        channel: this.type,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw new Error(`Email sending failed: ${errorMessage}`);
    } finally {
      if (transporter) {
        transporter.close();
      }
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
