import type { L10n } from '../../types/i18n';

export const AdminServiceMessages = {
  UserNotFound: {
    en: 'User not found',
    tr: 'Kullanıcı bulunamadı',
    de: 'Benutzer nicht gefunden',
  },
} satisfies Record<string, L10n>;

export const AuthServiceMessages = {
  EmailExists: {
    en: 'User with this email already exists',
    tr: 'Bu e-posta ile kayıtlı kullanıcı var',
    de: 'Benutzer mit dieser E-Mail existiert bereits',
  },
  RegistrationDbError: {
    en: 'Database error during registration',
    tr: 'Kayıt sırasında veritabanı hatası',
    de: 'Datenbankfehler bei der Registrierung',
  },
  CredentialsMissing: {
    en: 'Please provide an email and password',
    tr: 'Lütfen e-posta ve şifre girin',
    de: 'Bitte E-Mail und Passwort angeben',
  },
  InvalidCredentials: {
    en: 'Invalid credentials',
    tr: 'Geçersiz kimlik bilgileri',
    de: 'Ungültige Anmeldedaten',
  },
  LoginDbError: {
    en: 'Database error during login',
    tr: 'Giriş sırasında veritabanı hatası',
    de: 'Datenbankfehler bei der Anmeldung',
  },
  GooglePayloadMissing: {
    en: 'Google payload missing',
    tr: 'Google payload alınamadı',
    de: 'Google-Payload fehlt',
  },
  GoogleEmailMissing: {
    en: 'Email not found in Google account',
    tr: 'Google hesabında email bulunamadı',
    de: 'E-Mail im Google-Konto nicht gefunden',
  },
  GoogleLoginFailed: {
    en: 'Google login failed',
    tr: 'Google ile giriş başarısız oldu',
    de: 'Google-Anmeldung fehlgeschlagen',
  },
  EmailNotFound: {
    en: 'There is no user with that email',
    tr: 'Bu e-posta ile kullanıcı bulunamadı',
    de: 'Kein Benutzer mit dieser E-Mail gefunden',
  },
  EmailSendError: {
    en: 'Email could not be sent',
    tr: 'E-posta gönderilemedi',
    de: 'E-Mail konnte nicht gesendet werden',
  },
  ForgotPasswordDbError: {
    en: 'Database error during forgot password',
    tr: 'Şifre sıfırlama talebinde veritabanı hatası',
    de: 'Datenbankfehler beim Passwort vergessen',
  },
  InvalidOrExpiredToken: {
    en: 'Invalid token or token expired',
    tr: 'Geçersiz veya süresi dolmuş token',
    de: 'Ungültiger oder abgelaufener Token',
  },
  ResetPasswordDbError: {
    en: 'Database error during reset password',
    tr: 'Şifre sıfırlanırken veritabanı hatası',
    de: 'Datenbankfehler beim Passwort zurücksetzen',
  },
  ResetPasswordEmailSubject: {
    en: 'Password Reset Request',
    tr: 'Şifre Sıfırlama Talebi',
    de: 'Passwort zurücksetzen',
  },
  UserNotFound: {
    en: 'User not found',
    tr: 'Kullanıcı bulunamadı',
    de: 'Benutzer nicht gefunden',
  },
  ProfileImageUpdateDbError: {
    en: 'Database error during profile image update',
    tr: 'Profil resmi güncelleme sırasında veritabanı hatası',
    de: 'Datenbankfehler beim Profilbild-Update',
  },
  GetUserDbError: {
    en: 'Database error during get user by id',
    tr: 'Kullanıcı bilgisi alınırken veritabanı hatası',
    de: 'Datenbankfehler beim Abrufen des Benutzers',
  },
  UpdateProfileError: {
    en: 'Database error during profile update',
    tr: 'Profil güncelleme sırasında veritabanı hatası',
    de: 'Datenbankfehler beim Profil-Update',
  },
} satisfies Record<string, L10n>;

export const AnswerServiceMessages = {
  AnswerCreationDbError: {
    en: 'Database error during answer creation',
    tr: 'Cevap oluşturulurken veritabanı hatası',
    de: 'Datenbankfehler beim Erstellen der Antwort',
  },
  GetAnswersDbError: {
    en: 'Database error during get answers by question',
    tr: 'Sorunun cevapları alınırken veritabanı hatası',
    de: 'Datenbankfehler beim Abrufen der Antworten',
  },
  AnswerNotFound: {
    en: 'Answer not found',
    tr: 'Cevap bulunamadı',
    de: 'Antwort nicht gefunden',
  },
  GetAnswerDbError: {
    en: 'Database error during get answer by id',
    tr: 'Cevap bilgisi alınırken veritabanı hatası',
    de: 'Datenbankfehler beim Abrufen der Antwort',
  },
  ContentRequired: {
    en: 'Content is required',
    tr: 'İçerik alanı zorunludur',
    de: 'Inhalt ist erforderlich',
  },
  UpdateAnswerDbError: {
    en: 'Database error during update answer',
    tr: 'Cevap güncellenirken veritabanı hatası',
    de: 'Datenbankfehler beim Aktualisieren der Antwort',
  },
  DeleteAnswerDbError: {
    en: 'Database error during delete answer',
    tr: 'Cevap silinirken veritabanı hatası',
    de: 'Datenbankfehler beim Löschen der Antwort',
  },
  AlreadyLiked: {
    en: 'You already like this answer',
    tr: 'Bu cevabı zaten beğendiniz',
    de: 'Sie haben diese Antwort bereits bewertet',
  },
  LikeAnswerDbError: {
    en: 'Database error during like answer',
    tr: 'Cevap beğenirken veritabanı hatası',
    de: 'Datenbankfehler beim Bewerten der Antwort',
  },
  CannotUndoLike: {
    en: 'You can not undo like operation for this answer',
    tr: 'Bu cevaptaki beğeninizi geri alamazsınız',
    de: 'Sie können die Bewertung für diese Antwort nicht rückgängig machen',
  },
  UndoLikeDbError: {
    en: 'Database error during undo like answer',
    tr: 'Beğeni geri alınırken veritabanı hatası',
    de: 'Datenbankfehler beim Rückgängigmachen der Bewertung',
  },
} satisfies Record<string, L10n>;

export const QuestionServiceMessages = {
  QuestionCreationDbError: {
    en: 'Database error during question creation',
    tr: 'Soru oluşturulurken veritabanı hatası',
    de: 'Datenbankfehler beim Erstellen der Frage',
  },
  GetAllQuestionsDbError: {
    en: 'Database or cache error during get all questions',
    tr: 'Sorular alınırken veritabanı/önbellek hatası',
    de: 'Datenbank- oder Cache-Fehler beim Abrufen aller Fragen',
  },
  QuestionNotFound: {
    en: 'Question not found',
    tr: 'Soru bulunamadı',
    de: 'Frage nicht gefunden',
  },
  GetQuestionDbError: {
    en: 'Database error during get question by id',
    tr: 'Soru bilgisi alınırken veritabanı hatası',
    de: 'Datenbankfehler beim Abrufen der Frage',
  },
  UpdateQuestionDbError: {
    en: 'Database error during update question',
    tr: 'Soru güncellenirken veritabanı hatası',
    de: 'Datenbankfehler beim Aktualisieren der Frage',
  },
  DeleteQuestionDbError: {
    en: 'Database error during delete question',
    tr: 'Soru silinirken veritabanı hatası',
    de: 'Datenbankfehler beim Löschen der Frage',
  },
  AlreadyLiked: {
    en: 'You already like this question',
    tr: 'Bu soruyu zaten beğendiniz',
    de: 'Sie haben diese Frage bereits bewertet',
  },
  LikeQuestionDbError: {
    en: 'Database error during like question',
    tr: 'Soru beğenirken veritabanı hatası',
    de: 'Datenbankfehler beim Bewerten der Frage',
  },
  NotLikedYet: {
    en: 'You have not liked this question',
    tr: 'Bu soruyu henüz beğenmediniz',
    de: 'Sie haben diese Frage noch nicht bewertet',
  },
  UndoLikeDbError: {
    en: 'Database error during undo like question',
    tr: 'Beğeni geri alınırken veritabanı hatası',
    de: 'Datenbankfehler beim Rückgängigmachen der Bewertung',
  },
};

// Email Templates (separate from L10n types)
export const EmailTemplates = {
  ResetPasswordTemplate: {
    en: (resetUrl: string): string => `
      <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 32px; border-radius: 8px; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Password Reset Request</h2>
        <p>We received a password reset request for your account. Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #1976d2; color: #fff; border-radius: 4px; text-decoration: none; font-weight: bold; margin: 16px 0;">Reset Password</a>
        <p style="font-size: 14px; color: #555;">If the button doesn't work, copy and paste the following link into your browser:</p>
        <div style="background: #eee; padding: 8px; border-radius: 4px; word-break: break-all; font-size: 13px;">${resetUrl}</div>
        <p style="font-size: 13px; color: #888; margin-top: 24px;">This link is valid for 1 hour. If you didn't request this, please ignore this email.</p>
      </div>
    `,
    tr: (resetUrl: string): string => `
      <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 32px; border-radius: 8px; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Şifre Sıfırlama Talebi</h2>
        <p>Hesabınız için bir şifre sıfırlama isteği aldık. Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #1976d2; color: #fff; border-radius: 4px; text-decoration: none; font-weight: bold; margin: 16px 0;">Şifreyi Sıfırla</a>
        <p style="font-size: 14px; color: #555;">Eğer buton çalışmazsa, aşağıdaki bağlantıyı kopyalayıp tarayıcınıza yapıştırabilirsiniz:</p>
        <div style="background: #eee; padding: 8px; border-radius: 4px; word-break: break-all; font-size: 13px;">${resetUrl}</div>
        <p style="font-size: 13px; color: #888; margin-top: 24px;">Bu bağlantı 1 saat boyunca geçerlidir. Eğer bu işlemi siz başlatmadıysanız, bu e-postayı dikkate almayabilirsiniz.</p>
      </div>
    `,
    de: (resetUrl: string): string => `
      <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 32px; border-radius: 8px; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1976d2;">Passwort zurücksetzen</h2>
        <p>Wir haben eine Anfrage zum Zurücksetzen des Passworts für Ihr Konto erhalten. Klicken Sie auf die Schaltfläche unten, um Ihr Passwort zurückzusetzen:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #1976d2; color: #fff; border-radius: 4px; text-decoration: none; font-weight: bold; margin: 16px 0;">Passwort zurücksetzen</a>
        <p style="font-size: 14px; color: #555;">Wenn die Schaltfläche nicht funktioniert, kopieren Sie den folgenden Link und fügen Sie ihn in Ihren Browser ein:</p>
        <div style="background: #eee; padding: 8px; border-radius: 4px; word-break: break-all; font-size: 13px;">${resetUrl}</div>
        <p style="font-size: 13px; color: #888; margin-top: 24px;">Dieser Link ist 1 Stunde gültig. Wenn Sie dies nicht angefordert haben, ignorieren Sie diese E-Mail.</p>
      </div>
    `,
  },
};
