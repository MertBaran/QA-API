import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { L10n } from '../types/i18n';
import '../models/mongodb/NotificationTemplateMongoModel';

// Environment'ı yükle
dotenv.config({ path: path.join(__dirname, '../config/env/config.env') });

// MongoDB bağlantıları
const PROD_MONGODB_URI = process.env['MONGO_URI'] || '';
const TEST_MONGODB_URI = PROD_MONGODB_URI.replace(
  '/question-answer?',
  '/question-answer-test?'
);

// Template interface
interface NotificationTemplate {
  name: string;
  type: 'email' | 'sms' | 'push' | 'webhook';
  category: 'system' | 'marketing' | 'security' | 'notification';
  subject: L10n;
  message: L10n;
  html?: L10n;
  variables: string[];
  isActive: boolean;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  description?: L10n;
  tags: string[];
}

// Template'ler
const templates: NotificationTemplate[] = [
  // Email Templates
  {
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
      en: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
        </div>
      `,
      tr: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
        </div>
      `,
      de: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
        </div>
      `,
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
  },
  {
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
      en: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">Password Reset</h2>
          <p>Hello <strong>{{userName}}</strong>,</p>
          <p>Your password reset request has been received. Click the button below to set your new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetLink}}" style="background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset My Password</a>
          </div>
          <p><strong>Important:</strong> This link is valid for 1 hour.</p>
          <p>If you did not make this request, you can ignore this email.</p>
          <p>Thanks,<br>QA System Team</p>
        </div>
      `,
      tr: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">Şifre Sıfırlama</h2>
          <p>Merhaba <strong>{{userName}}</strong>,</p>
          <p>Şifre sıfırlama talebiniz alınmıştır. Yeni şifrenizi belirlemek için aşağıdaki butona tıklayın:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetLink}}" style="background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Şifremi Sıfırla</a>
          </div>
          <p><strong>Önemli:</strong> Bu link 1 saat süreyle geçerlidir.</p>
          <p>Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
          <p>Teşekkürler,<br>QA Sistemi Ekibi</p>
        </div>
      `,
      de: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d32f2f;">Passwort-Reset</h2>
          <p>Hallo <strong>{{userName}}</strong>,</p>
          <p>Ihre Passwort-Reset-Anfrage wurde erhalten. Klicken Sie auf die Schaltfläche unten, um Ihr neues Passwort festzulegen:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{resetLink}}" style="background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Mein Passwort zurücksetzen</a>
          </div>
          <p><strong>Wichtig:</strong> Dieser Link ist 1 Stunde gültig.</p>
          <p>Wenn Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.</p>
          <p>Vielen Dank,<br>QA-System-Team</p>
        </div>
      `,
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
  },
  {
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
      en: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Password Change Verification</h2>
          <p>Hello <strong>{{userName}}</strong>,</p>
          <p>You have requested to change your password. Please use the following verification code:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h1 style="color: #1976d2; font-size: 36px; letter-spacing: 8px; margin: 0;">{{code}}</h1>
          </div>
          <p style="color: #d32f2f; font-weight: bold;">This code will expire in {{expiryMinutes}} minutes.</p>
          <p>If you did not request this password change, please ignore this email.</p>
          <p>Thanks,<br>QA System Team</p>
        </div>
      `,
      tr: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Şifre Değiştirme Doğrulaması</h2>
          <p>Merhaba <strong>{{userName}}</strong>,</p>
          <p>Şifrenizi değiştirmek için bir talep aldık. Lütfen aşağıdaki doğrulama kodunu kullanın:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h1 style="color: #1976d2; font-size: 36px; letter-spacing: 8px; margin: 0;">{{code}}</h1>
          </div>
          <p style="color: #d32f2f; font-weight: bold;">Bu kod {{expiryMinutes}} dakika içinde geçersiz olacaktır.</p>
          <p>Eğer bu şifre değişikliğini siz talep etmediyseniz, lütfen bu e-postayı görmezden gelin.</p>
          <p>Teşekkürler,<br>QA Sistemi Ekibi</p>
        </div>
      `,
      de: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Passwort-Änderungs-Bestätigung</h2>
          <p>Hallo <strong>{{userName}}</strong>,</p>
          <p>Sie haben eine Passwort-Änderung angefordert. Bitte verwenden Sie den folgenden Bestätigungscode:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h1 style="color: #1976d2; font-size: 36px; letter-spacing: 8px; margin: 0;">{{code}}</h1>
          </div>
          <p style="color: #d32f2f; font-weight: bold;">Dieser Code läuft in {{expiryMinutes}} Minuten ab.</p>
          <p>Wenn Sie diese Passwort-Änderung nicht angefordert haben, ignorieren Sie bitte diese E-Mail.</p>
          <p>Vielen Dank,<br>QA-System-Team</p>
        </div>
      `,
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
  },
  {
    name: 'question-answered',
    type: 'email',
    category: 'notification',
    subject: {
      en: 'Your Question Has Been Answered',
      tr: 'Sorunuz Yanıtlandı',
      de: 'Ihre Frage wurde beantwortet',
    },
    message: {
      en: 'Hello {{userName}}, your question "{{questionTitle}}" has been answered. Click to view the answer: {{answerLink}}',
      tr: 'Merhaba {{userName}}, "{{questionTitle}}" başlıklı sorunuz yanıtlandı. Yanıtı görmek için tıklayın: {{answerLink}}',
      de: 'Hallo {{userName}}, Ihre Frage "{{questionTitle}}" wurde beantwortet. Klicken Sie, um die Antwort zu sehen: {{answerLink}}',
    },
    html: {
      en: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Your Question Has Been Answered!</h2>
          <p>Hello <strong>{{userName}}</strong>,</p>
          <p>Your question "<strong>{{questionTitle}}</strong>" has been answered.</p>
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Question:</strong> {{questionTitle}}</p>
            <p><strong>Answered by:</strong> {{answerAuthor}}</p>
            <p><strong>Answer Date:</strong> {{answerDate}}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{answerLink}}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Answer</a>
          </div>
          <p>Thanks,<br>QA System Team</p>
        </div>
      `,
      tr: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Sorunuz Yanıtlandı!</h2>
          <p>Merhaba <strong>{{userName}}</strong>,</p>
          <p>"<strong>{{questionTitle}}</strong>" başlıklı sorunuz yanıtlandı.</p>
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Soru:</strong> {{questionTitle}}</p>
            <p><strong>Yanıtlayan:</strong> {{answerAuthor}}</p>
            <p><strong>Yanıt Tarihi:</strong> {{answerDate}}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{answerLink}}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Yanıtı Görüntüle</a>
          </div>
          <p>Teşekkürler,<br>QA Sistemi Ekibi</p>
        </div>
      `,
      de: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">Ihre Frage wurde beantwortet!</h2>
          <p>Hallo <strong>{{userName}}</strong>,</p>
          <p>Ihre Frage "<strong>{{questionTitle}}</strong>" wurde beantwortet.</p>
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Frage:</strong> {{questionTitle}}</p>
            <p><strong>Beantwortet von:</strong> {{answerAuthor}}</p>
            <p><strong>Antwortdatum:</strong> {{answerDate}}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{answerLink}}" style="background-color: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Antwort anzeigen</a>
          </div>
          <p>Vielen Dank,<br>QA-System-Team</p>
        </div>
      `,
    },
    variables: [
      'userName',
      'questionTitle',
      'answerAuthor',
      'answerDate',
      'answerLink',
    ],
    isActive: true,
    priority: 'normal',
    description: {
      en: "Notification email sent when a user's question is answered",
      tr: 'Kullanıcının sorusu yanıtlandığında gönderilen bildirim e-postası',
      de: 'Benachrichtigungs-E-Mail, die gesendet wird, wenn die Frage eines Benutzers beantwortet wird',
    },
    tags: ['question', 'answer', 'notification', 'email'],
  },
  {
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
      en: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
        </div>
      `,
      tr: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
        </div>
      `,
      de: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
        </div>
      `,
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
  },
  {
    name: 'admin-notification',
    type: 'email',
    category: 'system',
    subject: {
      en: 'System Notification: {{title}}',
      tr: 'Sistem Bildirimi: {{title}}',
      de: 'Systembenachrichtigung: {{title}}',
    },
    message: {
      en: 'Hello {{adminName}}, a new event has occurred in the system: {{description}}',
      tr: 'Merhaba {{adminName}}, sistemde yeni bir olay gerçekleşti: {{description}}',
      de: 'Hallo {{adminName}}, ein neues Ereignis ist im System aufgetreten: {{description}}',
    },
    html: {
      en: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f57c00;">System Notification</h2>
          <p>Hello <strong>{{adminName}}</strong>,</p>
          <p>A new event has occurred in the system:</p>
          <div style="background-color: #fff3e0; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>{{title}}</h3>
            <p>{{description}}</p>
            <p><strong>Event Date:</strong> {{eventDate}}</p>
            <p><strong>Priority:</strong> {{priority}}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{adminPanelLink}}" style="background-color: #f57c00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Admin Panel</a>
          </div>
          <p>Thanks,<br>QA System Team</p>
        </div>
      `,
      tr: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f57c00;">Sistem Bildirimi</h2>
          <p>Merhaba <strong>{{adminName}}</strong>,</p>
          <p>Sistemde yeni bir olay gerçekleşti:</p>
          <div style="background-color: #fff3e0; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>{{title}}</h3>
            <p>{{description}}</p>
            <p><strong>Olay Tarihi:</strong> {{eventDate}}</p>
            <p><strong>Öncelik:</strong> {{priority}}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{adminPanelLink}}" style="background-color: #f57c00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Admin Paneli</a>
          </div>
          <p>Teşekkürler,<br>QA Sistemi Ekibi</p>
        </div>
      `,
      de: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f57c00;">Systembenachrichtigung</h2>
          <p>Hallo <strong>{{adminName}}</strong>,</p>
          <p>Ein neues Ereignis ist im System aufgetreten:</p>
          <div style="background-color: #fff3e0; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>{{title}}</h3>
            <p>{{description}}</p>
            <p><strong>Ereignisdatum:</strong> {{eventDate}}</p>
            <p><strong>Priorität:</strong> {{priority}}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{adminPanelLink}}" style="background-color: #f57c00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Admin-Panel</a>
          </div>
          <p>Vielen Dank,<br>QA-System-Team</p>
        </div>
      `,
    },
    variables: [
      'adminName',
      'title',
      'description',
      'eventDate',
      'priority',
      'adminPanelLink',
    ],
    isActive: true,
    priority: 'high',
    description: {
      en: 'System notifications sent to admins',
      tr: "Admin'lere gönderilen sistem bildirimleri",
      de: 'Systembenachrichtigungen, die an Administratoren gesendet werden',
    },
    tags: ['admin', 'system', 'notification', 'email'],
  },
];

async function setupTemplates() {
  try {
    console.log("🔗 MongoDB Atlas'a bağlanılıyor...");

    // Test database'e bağlan
    console.log("📝 Test database'e template'ler ekleniyor...");
    await mongoose.connect(TEST_MONGODB_URI);
    console.log('✅ Test database bağlantısı başarılı');

    await setupTemplatesForDatabase('TEST');
    await mongoose.disconnect();

    // Production database'e bağlan
    console.log("🚀 Production database'e template'ler ekleniyor...");
    await mongoose.connect(PROD_MONGODB_URI);
    console.log('✅ Production database bağlantısı başarılı');

    await setupTemplatesForDatabase('PRODUCTION');
    await mongoose.disconnect();

    console.log("🎉 Tüm template'ler başarıyla oluşturuldu!");
  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
}

async function setupTemplatesForDatabase(dbType: string) {
  // Template model'ini import et
  const NotificationTemplate = mongoose.model('NotificationTemplate');

  console.log(`📝 ${dbType} database için template'ler oluşturuluyor...`);

  for (const template of templates) {
    // Template var mı kontrol et
    const existingTemplate = await NotificationTemplate.findOne({
      name: template.name,
    });

    if (existingTemplate) {
      console.log(
        `⚠️  ${dbType}: Template "${template.name}" zaten mevcut, güncelleniyor...`
      );
      await NotificationTemplate.updateOne(
        { name: template.name },
        { ...template, updatedAt: new Date() }
      );
    } else {
      console.log(`✅ ${dbType}: Template "${template.name}" oluşturuluyor...`);
      await NotificationTemplate.create(template);
    }
  }

  // Template'leri listele
  const allTemplates = await NotificationTemplate.find(
    {},
    'name type category isActive'
  );
  console.log(`\n📋 ${dbType} Database Mevcut Template'ler:`);
  allTemplates.forEach(template => {
    console.log(
      `  - ${template.name} (${template.type}/${template.category}) - ${template.isActive ? 'Aktif' : 'Pasif'}`
    );
  });
}

// Script'i çalıştır
setupTemplates();
