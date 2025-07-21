import type { L10n } from '../../types/i18n';

export const AdminConstants = {
  UserNotFound: {
    en: 'User not found',
    tr: 'Kullanıcı bulunamadı',
    de: 'Benutzer nicht gefunden',
  },
  BlockToggleSuccess: {
    en: 'Block / Unblock successful',
    tr: 'Engelleme / Engeli kaldırma başarılı',
    de: 'Blockieren / Blockierung aufheben erfolgreich',
  },
  DeleteSuccess: {
    en: 'Delete operation successful',
    tr: 'Silme işlemi başarılı',
    de: 'Löschvorgang erfolgreich',
  },
} satisfies Record<string, L10n>;

export const UserConstants = {
  UserNotFound: {
    en: 'User not found',
    tr: 'Kullanıcı bulunamadı',
    de: 'Benutzer nicht gefunden',
  },
} satisfies Record<string, L10n>;

export const QuestionConstants = {
  QuestionNotFound: {
    en: 'Question not found',
    tr: 'Soru bulunamadı',
    de: 'Frage nicht gefunden',
  },
  QuestionDeleteSuccess: {
    en: 'Question delete operation successful',
    tr: 'Soru silme işlemi başarılı',
    de: 'Frage erfolgreich gelöscht',
  },
} satisfies Record<string, L10n>;

export const AnswerConstants = {
  AnswerNotFound: {
    en: 'Answer not found',
    tr: 'Cevap bulunamadı',
    de: 'Antwort nicht gefunden',
  },
  AnswerDeleteSuccess: {
    en: 'Answer deleted successfully',
    tr: 'Cevap başarıyla silindi',
    de: 'Antwort erfolgreich gelöscht',
  },
} satisfies Record<string, L10n>;

export const AuthConstants = {
  InvalidCredentials: {
    en: 'Invalid credentials',
    tr: 'Geçersiz kimlik bilgileri',
    de: 'Ungültige Anmeldedaten',
  },
  EmailAlreadyExists: {
    en: 'User with this email already exists',
    tr: 'Bu e-posta ile kayıtlı kullanıcı var',
    de: 'Benutzer mit dieser E-Mail existiert bereits',
  },
  LogoutSuccess: {
    en: 'Logout success',
    tr: 'Çıkış başarılı',
    de: 'Abmeldung erfolgreich',
  },
  NotLoggedIn: {
    en: 'User is not logged in',
    tr: 'Kullanıcı giriş yapmamış',
    de: 'Benutzer ist nicht angemeldet',
  },
  LogoutError: {
    en: 'Error occurred during logout',
    tr: 'Çıkış sırasında hata oluştu',
    de: 'Fehler beim Abmelden',
  },
  ResetPasswordTokenSent: {
    en: 'Reset password token sent to email',
    tr: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi',
    de: 'Passwort-Reset-Link an E-Mail gesendet',
  },
  PasswordResetSuccess: {
    en: 'Password reset successful',
    tr: 'Şifre başarıyla sıfırlandı',
    de: 'Passwort erfolgreich zurückgesetzt',
  },
};

export const NotificationConstants = {
  NotificationSentSuccess: {
    en: 'Notification sent successfully',
    tr: 'Bildirim başarıyla gönderildi',
    de: 'Benachrichtigung erfolgreich gesendet',
  },
  NotificationsSentSuccess: {
    en: 'Notifications sent successfully',
    tr: 'Bildirimler başarıyla gönderildi',
    de: 'Benachrichtigungen erfolgreich gesendet',
  },
  NotificationSendError: {
    en: 'Error occurred while sending notification',
    tr: 'Bildirim gönderilirken hata oluştu',
    de: 'Fehler beim Senden der Benachrichtigung',
  },
  NotificationsSendError: {
    en: 'Error occurred while sending notifications',
    tr: 'Bildirimler gönderilirken hata oluştu',
    de: 'Fehler beim Senden der Benachrichtigungen',
  },
  PreferencesGetError: {
    en: 'Error occurred while getting notification preferences',
    tr: 'Bildirim tercihleri alınırken hata oluştu',
    de: 'Fehler beim Abrufen der Benachrichtigungseinstellungen',
  },
  PreferencesUpdateError: {
    en: 'Error occurred while updating notification preferences',
    tr: 'Bildirim tercihleri güncellenirken hata oluştu',
    de: 'Fehler beim Aktualisieren der Benachrichtigungseinstellungen',
  },
  PreferencesUpdateSuccess: {
    en: 'Notification preferences updated successfully',
    tr: 'Bildirim tercihleri başarıyla güncellendi',
    de: 'Benachrichtigungseinstellungen erfolgreich aktualisiert',
  },
  TestNotificationSentSuccess: {
    en: 'Test notification sent successfully',
    tr: 'Test bildirimi başarıyla gönderildi',
    de: 'Testbenachrichtigung erfolgreich gesendet',
  },
  TestNotificationSendError: {
    en: 'Error occurred while sending test notification',
    tr: 'Test bildirimi gönderilirken hata oluştu',
    de: 'Fehler beim Senden der Testbenachrichtigung',
  },
  UserIdRequired: {
    en: 'User ID is required',
    tr: 'User ID gerekli',
    de: 'Benutzer-ID ist erforderlich',
  },
  UnknownError: {
    en: 'Unknown error',
    tr: 'Bilinmeyen hata',
    de: 'Unbekannter Fehler',
  },
  NotificationsRetrievedSuccess: {
    en: 'Notifications retrieved successfully',
    tr: 'Bildirimler başarıyla alındı',
    de: 'Benachrichtigungen erfolgreich abgerufen',
  },
  StatsRetrievedSuccess: {
    en: 'Notification statistics retrieved successfully',
    tr: 'Bildirim istatistikleri başarıyla alındı',
    de: 'Benachrichtigungsstatistiken erfolgreich abgerufen',
  },
  TemplateNotificationSentSuccess: {
    en: 'Template notification sent successfully',
    tr: 'Template bildirimi başarıyla gönderildi',
    de: 'Template-Benachrichtigung erfolgreich gesendet',
  },
  TemplateNotificationSendError: {
    en: 'Error occurred while sending template notification',
    tr: 'Template bildirimi gönderilirken hata oluştu',
    de: 'Fehler beim Senden der Template-Benachrichtigung',
  },
  TemplateNameRequired: {
    en: 'Template name is required',
    tr: 'Template adı gerekli',
    de: 'Template-Name ist erforderlich',
  },
  TemplateNotFound: {
    en: 'Template not found',
    tr: 'Template bulunamadı',
    de: 'Template nicht gefunden',
  },
};
