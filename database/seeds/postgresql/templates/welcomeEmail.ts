import { TemplateDef } from './types';

export const welcomeEmail: TemplateDef = {
  name: 'welcome-email',
  type: 'email',
  category: 'system',
  subject: {
    en: 'Welcome to QA System!',
    tr: 'QA Sistemine Hoş Geldiniz!',
    de: 'Willkommen im QA-System!',
  },
  message: {
    en: 'Hello {{userName}}, you have successfully registered to the QA system. Please verify your email address to activate your account.',
    tr: 'Merhaba {{userName}}, QA sistemine başarıyla kayıt oldunuz. Hesabınızı aktifleştirmek için lütfen e-posta adresinizi doğrulayın.',
    de: 'Hallo {{userName}}, Sie haben sich erfolgreich im QA-System registriert. Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren.',
  },
  html: {
    en: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to QA System!</h2>
          <p>Hello <strong>{{userName}}</strong>,</p>
          <p>You have successfully registered to the QA system. Please verify your email address to activate your account.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Username:</strong> {{userName}}</p>
            <p><strong>Email:</strong> {{userEmail}}</p>
            <p><strong>Registration Date:</strong> {{registrationDate}}</p>
          </div>
          <p>If you have any questions, please contact us.</p>
          <p>Thanks,<br>QA System Team</p>
        </div>`,
    tr: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">QA Sistemine Hoş Geldiniz!</h2>
          <p>Merhaba <strong>{{userName}}</strong>,</p>
          <p>QA sistemine başarıyla kayıt oldunuz. Hesabınızı aktifleştirmek için lütfen e-posta adresinizi doğrulayın.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Kullanıcı Adı:</strong> {{userName}}</p>
            <p><strong>E-posta:</strong> {{userEmail}}</p>
            <p><strong>Kayıt Tarihi:</strong> {{registrationDate}}</p>
          </div>
          <p>Herhangi bir sorunuz varsa bizimle iletişime geçebilirsiniz.</p>
          <p>Teşekkürler,<br>QA Sistemi Ekibi</p>
        </div>`,
    de: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Willkommen im QA-System!</h2>
          <p>Hallo <strong>{{userName}}</strong>,</p>
          <p>Sie haben sich erfolgreich im QA-System registriert. Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren.</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Benutzername:</strong> {{userName}}</p>
            <p><strong>E-Mail:</strong> {{userEmail}}</p>
            <p><strong>Registrierungsdatum:</strong> {{registrationDate}}</p>
          </div>
          <p>Bei Fragen kontaktieren Sie uns bitte.</p>
          <p>Vielen Dank,<br>QA-System-Team</p>
        </div>`,
  },
  variables: ['userName', 'userEmail', 'registrationDate'],
  isActive: true,
  priority: 'normal',
  description: {
    en: 'Welcome email sent when a new user registers',
    tr: 'Yeni kullanıcı kayıt olduğunda gönderilen hoş geldin e-postası',
    de: 'Willkommens-E-Mail, die gesendet wird, wenn sich ein neuer Benutzer registriert',
  },
  tags: ['welcome', 'registration', 'email'],
};
