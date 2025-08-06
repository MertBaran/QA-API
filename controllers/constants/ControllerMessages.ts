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
  CaptchaRequired: {
    en: 'reCAPTCHA verification required',
    tr: 'reCAPTCHA doğrulaması gerekli',
    de: 'reCAPTCHA-Verifizierung erforderlich',
  },
  CaptchaInvalid: {
    en: 'Invalid reCAPTCHA token',
    tr: 'Geçersiz reCAPTCHA token',
    de: 'Ungültiger reCAPTCHA-Token',
  },
} satisfies Record<string, L10n>;

export const BookmarkConstants = {
  BookmarkAdded: {
    en: 'Bookmark added successfully',
    tr: 'Bookmark başarıyla eklendi',
    de: 'Lesezeichen erfolgreich hinzugefügt',
  },
  BookmarkRemoved: {
    en: 'Bookmark removed successfully',
    tr: 'Bookmark başarıyla kaldırıldı',
    de: 'Lesezeichen erfolgreich entfernt',
  },
  BookmarkNotFound: {
    en: 'Bookmark not found',
    tr: 'Bookmark bulunamadı',
    de: 'Lesezeichen nicht gefunden',
  },
  CollectionCreated: {
    en: 'Collection created successfully',
    tr: 'Koleksiyon başarıyla oluşturuldu',
    de: 'Sammlung erfolgreich erstellt',
  },
  CollectionDeleted: {
    en: 'Collection deleted successfully',
    tr: 'Koleksiyon başarıyla silindi',
    de: 'Sammlung erfolgreich gelöscht',
  },
  BookmarkAddedToCollection: {
    en: 'Bookmark added to collection successfully',
    tr: 'Bookmark koleksiyona başarıyla eklendi',
    de: 'Lesezeichen erfolgreich zur Sammlung hinzugefügt',
  },
  BookmarkRemovedFromCollection: {
    en: 'Bookmark removed from collection successfully',
    tr: 'Bookmark koleksiyondan başarıyla kaldırıldı',
    de: 'Lesezeichen erfolgreich aus der Sammlung entfernt',
  },
} satisfies Record<string, L10n>;

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

export const PermissionConstants = {
  UserNotFound: {
    en: 'User not found',
    tr: 'Kullanıcı bulunamadı',
    de: 'Benutzer nicht gefunden',
  },
  RoleNotFound: {
    en: 'Role not found',
    tr: 'Rol bulunamadı',
    de: 'Rolle nicht gefunden',
  },
  RoleNotActive: {
    en: 'Role is not active',
    tr: 'Rol aktif değil',
    de: 'Rolle ist nicht aktiv',
  },
  RoleAssignedSuccess: {
    en: 'Role assigned successfully',
    tr: 'Rol başarıyla atandı',
    de: 'Rolle erfolgreich zugewiesen',
  },
  RoleAssignmentFailed: {
    en: 'Failed to assign role to user',
    tr: 'Kullanıcıya rol atama başarısız',
    de: 'Fehler beim Zuweisen der Rolle zum Benutzer',
  },
  RoleRemovedSuccess: {
    en: 'Role removed successfully',
    tr: 'Rol başarıyla kaldırıldı',
    de: 'Rolle erfolgreich entfernt',
  },
  RoleRemovalFailed: {
    en: 'Failed to remove role from user',
    tr: 'Kullanıcıdan rol kaldırma başarısız',
    de: 'Fehler beim Entfernen der Rolle vom Benutzer',
  },
  UserDoesNotHaveRole: {
    en: 'User does not have this role',
    tr: 'Kullanıcının bu rolü yok',
    de: 'Benutzer hat diese Rolle nicht',
  },
  UserRolesRetrievedSuccess: {
    en: 'User roles retrieved successfully',
    tr: 'Kullanıcı rolleri başarıyla alındı',
    de: 'Benutzerrollen erfolgreich abgerufen',
  },
  UserRolesRetrievalFailed: {
    en: 'Failed to get user roles',
    tr: 'Kullanıcı rolleri alınamadı',
    de: 'Fehler beim Abrufen der Benutzerrollen',
  },
  RolesRetrievedSuccess: {
    en: 'Roles retrieved successfully',
    tr: 'Roller başarıyla alındı',
    de: 'Rollen erfolgreich abgerufen',
  },
  RolesRetrievalFailed: {
    en: 'Failed to get roles',
    tr: 'Roller alınamadı',
    de: 'Fehler beim Abrufen der Rollen',
  },
  PermissionsRetrievedSuccess: {
    en: 'Permissions retrieved successfully',
    tr: 'İzinler başarıyla alındı',
    de: 'Berechtigungen erfolgreich abgerufen',
  },
  PermissionsRetrievalFailed: {
    en: 'Failed to get permissions',
    tr: 'İzinler alınamadı',
    de: 'Fehler beim Abrufen der Berechtigungen',
  },
  PermissionsAddedToRoleSuccess: {
    en: 'Permissions added to role successfully',
    tr: 'İzinler role başarıyla eklendi',
    de: 'Berechtigungen erfolgreich zur Rolle hinzugefügt',
  },
  PermissionsAddedToRoleFailed: {
    en: 'Failed to add permissions to role',
    tr: 'İzinleri role ekleme başarısız',
    de: 'Fehler beim Hinzufügen von Berechtigungen zur Rolle',
  },
  PermissionsRemovedFromRoleSuccess: {
    en: 'Permissions removed from role successfully',
    tr: 'İzinler rolden başarıyla kaldırıldı',
    de: 'Berechtigungen erfolgreich von der Rolle entfernt',
  },
  PermissionsRemovedFromRoleFailed: {
    en: 'Failed to remove permissions from role',
    tr: 'İzinleri rolden kaldırma başarısız',
    de: 'Fehler beim Entfernen von Berechtigungen von der Rolle',
  },
  SomePermissionsNotFound: {
    en: 'Some permissions not found',
    tr: 'Bazı izinler bulunamadı',
    de: 'Einige Berechtigungen nicht gefunden',
  },
  UserPermissionsRetrievedSuccess: {
    en: 'User permissions retrieved successfully',
    tr: 'Kullanıcı izinleri başarıyla alındı',
    de: 'Benutzerberechtigungen erfolgreich abgerufen',
  },
  UserPermissionsRetrievalFailed: {
    en: 'Failed to get user permissions',
    tr: 'Kullanıcı izinleri alınamadı',
    de: 'Fehler beim Abrufen der Benutzerberechtigungen',
  },
} satisfies Record<string, L10n>;
