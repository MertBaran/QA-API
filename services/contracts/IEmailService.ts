export interface MailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

export interface IEmailService {
  sendEmail(mailOptions: MailOptions): Promise<any>;
}
