import nodemailer from 'nodemailer';

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export function getSMTPConfig(): SMTPConfig {
  const host = process.env['SMTP_HOST'] || 'smtp.gmail.com';
  const port = parseInt(process.env['SMTP_PORT'] || '465');
  const secure = port === 465; // 465 için SSL, 587 için TLS

  return {
    host,
    port,
    secure,
    auth: {
      user: process.env['SMTP_USER'] || '',
      pass: process.env['SMTP_APP_PASS'] || '',
    },
  };
}

export function createSMTPTransporter() {
  const config = getSMTPConfig();
  return nodemailer.createTransport(config);
}

// Farklı SMTP servisleri için preset konfigürasyonlar
export const SMTP_PRESETS = {
  GMAIL: {
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
  },
  OUTLOOK: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
  },
  YAHOO: {
    host: 'smtp.mail.yahoo.com',
    port: 465,
    secure: true,
  },
  SENDGRID: {
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
  },
  MAILGUN: {
    host: 'smtp.mailgun.org',
    port: 587,
    secure: false,
  },
  CUSTOM: {
    host: process.env['SMTP_HOST'] || 'smtp.gmail.com',
    port: parseInt(process.env['SMTP_PORT'] || '465'),
    secure: parseInt(process.env['SMTP_PORT'] || '465') === 465,
  },
};
