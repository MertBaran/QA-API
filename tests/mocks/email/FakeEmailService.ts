import { MailOptions } from '../../../services/contracts/IEmailService';
import { SentMessageInfo } from 'nodemailer';
import { NotificationPayload } from '../../../services/contracts/NotificationPayload';

export class FakeEmailService {
  public sent: MailOptions[] = [];
  async sendEmail(mailOptions: MailOptions): Promise<SentMessageInfo> {
    this.sent.push(mailOptions);
    // Fake SentMessageInfo
    return {
      envelope: {},
      messageId: '',
      accepted: [],
      rejected: [],
      pending: [],
      response: 'fake'
    } as SentMessageInfo;
  }

  async notify(payload: NotificationPayload): Promise<void> {
    // Test için isterseniz sent arrayine ekleyebilirsiniz veya boş bırakabilirsiniz
  }
} 