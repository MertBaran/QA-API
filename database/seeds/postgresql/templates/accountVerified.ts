import { TemplateDef } from './types';

export const accountVerified: TemplateDef = {
  name: 'account-verified',
  type: 'email',
  category: 'system',
  subject: {
    en: 'Your Account Has Been Verified',
    tr: 'Hesabınız Doğrulandı',
    de: 'Ihr Konto wurde verifiziert',
  },
  message: {
    en: 'Hello {{userName}}, your account has been successfully verified. You can now use all features of the QA system.',
    tr: 'Merhaba {{userName}}, hesabınız başarıyla doğrulandı. Artık QA sisteminin tüm özelliklerini kullanabilirsiniz.',
    de: 'Hallo {{userName}}, Ihr Konto wurde erfolgreich verifiziert. Sie können jetzt alle Funktionen des QA-Systems nutzen.',
  },
  html: {
    en: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #388e3c;">Your Account Has Been Verified!</h2>
          <p>Hello <strong>{{userName}}</strong>,</p>
          <p>Your account has been successfully verified. You can now use all features of the QA system.</p>
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Username:</strong> {{userName}}</p>
            <p><strong>Verification Date:</strong> {{verificationDate}}</p>
            <p><strong>Status:</strong> <span style="color: #388e3c;">Active</span></p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{loginLink}}" style="background-color: #388e3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Login</a>
          </div>
          <p>Thanks,<br>QA System Team</p>
        </div>`,
    tr: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #388e3c;">Hesabınız Doğrulandı!</h2>
          <p>Merhaba <strong>{{userName}}</strong>,</p>
          <p>Hesabınız başarıyla doğrulandı. Artık QA sisteminin tüm özelliklerini kullanabilirsiniz.</p>
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Kullanıcı Adı:</strong> {{userName}}</p>
            <p><strong>Doğrulama Tarihi:</strong> {{verificationDate}}</p>
            <p><strong>Durum:</strong> <span style="color: #388e3c;">Aktif</span></p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{loginLink}}" style="background-color: #388e3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Giriş Yap</a>
          </div>
          <p>Teşekkürler,<br>QA Sistemi Ekibi</p>
        </div>`,
    de: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #388e3c;">Ihr Konto wurde verifiziert!</h2>
          <p>Hallo <strong>{{userName}}</strong>,</p>
          <p>Ihr Konto wurde erfolgreich verifiziert. Sie können jetzt alle Funktionen des QA-Systems nutzen.</p>
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Benutzername:</strong> {{userName}}</p>
            <p><strong>Verifizierungsdatum:</strong> {{verificationDate}}</p>
            <p><strong>Status:</strong> <span style="color: #388e3c;">Aktiv</span></p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{loginLink}}" style="background-color: #388e3c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Anmelden</a>
          </div>
          <p>Vielen Dank,<br>QA-System-Team</p>
        </div>`,
  },
  variables: ['userName', 'verificationDate', 'loginLink'],
  isActive: true,
  priority: 'normal',
  description: {
    en: 'Email sent when account is verified',
    tr: 'Hesap doğrulandığında gönderilen e-posta',
    de: 'E-Mail, die gesendet wird, wenn das Konto verifiziert wird',
  },
  tags: ['verification', 'account', 'system', 'email'],
};
