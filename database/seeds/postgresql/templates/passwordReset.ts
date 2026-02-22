import { TemplateDef } from './types';

export const passwordReset: TemplateDef = {
  name: 'password-reset',
  type: 'email',
  category: 'security',
  subject: {
    en: 'Password Reset Request',
    tr: 'Şifre Sıfırlama Talebi',
    de: 'Passwort-Reset-Anfrage',
  },
  message: {
    en: 'Hello {{userName}}, your password reset request has been received. Click the following link to set your new password: {{resetLink}}',
    tr: 'Merhaba {{userName}}, şifre sıfırlama talebiniz alınmıştır. Yeni şifrenizi belirlemek için aşağıdaki linke tıklayın: {{resetLink}}',
    de: 'Hallo {{userName}}, Ihre Passwort-Reset-Anfrage wurde erhalten. Klicken Sie auf den folgenden Link, um Ihr neues Passwort festzulegen: {{resetLink}}',
  },
  html: {
    en: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">Password Reset</h2>
          <p>Hello <strong>{{userName}}</strong>,</p>
          <p>Your password reset request has been received. Click the button below to set your new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetLink}}" style="background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset My Password</a>
          </div>
          <p><strong>Important:</strong> This link is valid for 1 hour.</p>
          <p>If you did not make this request, you can ignore this email.</p>
          <p>Thanks,<br>QA System Team</p>
        </div>`,
    tr: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">Şifre Sıfırlama</h2>
          <p>Merhaba <strong>{{userName}}</strong>,</p>
          <p>Şifre sıfırlama talebiniz alınmıştır. Yeni şifrenizi belirlemek için aşağıdaki butona tıklayın:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetLink}}" style="background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Şifremi Sıfırla</a>
          </div>
          <p><strong>Önemli:</strong> Bu link 1 saat süreyle geçerlidir.</p>
          <p>Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
          <p>Teşekkürler,<br>QA Sistemi Ekibi</p>
        </div>`,
    de: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">Passwort-Reset</h2>
          <p>Hallo <strong>{{userName}}</strong>,</p>
          <p>Ihre Passwort-Reset-Anfrage wurde erhalten. Klicken Sie auf die Schaltfläche unten, um Ihr neues Passwort festzulegen:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetLink}}" style="background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Mein Passwort zurücksetzen</a>
          </div>
          <p><strong>Wichtig:</strong> Dieser Link ist 1 Stunde gültig.</p>
          <p>Wenn Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.</p>
          <p>Vielen Dank,<br>QA-System-Team</p>
        </div>`,
  },
  variables: ['userName', 'resetLink'],
  isActive: true,
  priority: 'high',
  description: {
    en: 'Email sent for password reset requests',
    tr: 'Şifre sıfırlama talebi için gönderilen e-posta',
    de: 'E-Mail, die für Passwort-Reset-Anfragen gesendet wird',
  },
  tags: ['password', 'reset', 'security', 'email'],
};
