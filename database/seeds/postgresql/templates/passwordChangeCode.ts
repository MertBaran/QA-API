import { TemplateDef } from './types';

export const passwordChangeCode: TemplateDef = {
  name: 'password-change-code',
  type: 'email',
  category: 'security',
  subject: {
    en: 'Password Change Verification Code',
    tr: 'Şifre Değiştirme Doğrulama Kodu',
    de: 'Passwort-Änderungs-Bestätigungscode',
  },
  message: {
    en: 'Hello {{userName}}, your password change verification code is: {{code}}. This code will expire in {{expiryMinutes}} minutes.',
    tr: 'Merhaba {{userName}}, şifre değiştirme doğrulama kodunuz: {{code}}. Bu kod {{expiryMinutes}} dakika içinde geçersiz olacaktır.',
    de: 'Hallo {{userName}}, Ihr Passwort-Änderungs-Bestätigungscode lautet: {{code}}. Dieser Code läuft in {{expiryMinutes}} Minuten ab.',
  },
  html: {
    en: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Password Change Verification</h2>
          <p>Hello <strong>{{userName}}</strong>,</p>
          <p>You have requested to change your password. Please use the following verification code:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h1 style="color: #1976d2; font-size: 36px; letter-spacing: 8px; margin: 0;">{{code}}</h1>
          </div>
          <p style="color: #d32f2f; font-weight: bold;">This code will expire in {{expiryMinutes}} minutes.</p>
          <p>If you did not request this password change, please ignore this email.</p>
          <p>Thanks,<br>QA System Team</p>
        </div>`,
    tr: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Şifre Değiştirme Doğrulaması</h2>
          <p>Merhaba <strong>{{userName}}</strong>,</p>
          <p>Şifrenizi değiştirmek için bir talep aldık. Lütfen aşağıdaki doğrulama kodunu kullanın:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h1 style="color: #1976d2; font-size: 36px; letter-spacing: 8px; margin: 0;">{{code}}</h1>
          </div>
          <p style="color: #d32f2f; font-weight: bold;">Bu kod {{expiryMinutes}} dakika içinde geçersiz olacaktır.</p>
          <p>Eğer bu şifre değişikliğini siz talep etmediyseniz, lütfen bu e-postayı görmezden gelin.</p>
          <p>Teşekkürler,<br>QA Sistemi Ekibi</p>
        </div>`,
    de: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Passwort-Änderungs-Bestätigung</h2>
          <p>Hallo <strong>{{userName}}</strong>,</p>
          <p>Sie haben eine Passwort-Änderung angefordert. Bitte verwenden Sie den folgenden Bestätigungscode:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h1 style="color: #1976d2; font-size: 36px; letter-spacing: 8px; margin: 0;">{{code}}</h1>
          </div>
          <p style="color: #d32f2f; font-weight: bold;">Dieser Code läuft in {{expiryMinutes}} Minuten ab.</p>
          <p>Wenn Sie diese Passwort-Änderung nicht angefordert haben, ignorieren Sie bitte diese E-Mail.</p>
          <p>Vielen Dank,<br>QA-System-Team</p>
        </div>`,
  },
  variables: ['userName', 'code', 'expiryMinutes'],
  isActive: true,
  priority: 'high',
  description: {
    en: 'Email sent when user requests password change with 6-digit verification code',
    tr: 'Kullanıcı şifre değiştirme talep ettiğinde 6 haneli doğrulama kodu ile gönderilen e-posta',
    de: 'E-Mail, die gesendet wird, wenn der Benutzer eine Passwort-Änderung mit 6-stelligem Bestätigungscode anfordert',
  },
  tags: ['password', 'change', 'verification', 'code', 'security', 'email'],
};
