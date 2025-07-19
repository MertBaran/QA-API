import type { L10n } from "../../types/i18n";

export const AdminConstants = {
  UserNotFound: {
    en: "User not found",
    tr: "Kullanıcı bulunamadı",
    de: "Benutzer nicht gefunden",
  },
  BlockToggleSuccess: {
    en: "Block / Unblock successful",
    tr: "Engelleme / Engeli kaldırma başarılı",
    de: "Blockieren / Blockierung aufheben erfolgreich",
  },
  DeleteSuccess: {
    en: "Delete operation successful",
    tr: "Silme işlemi başarılı",
    de: "Löschvorgang erfolgreich",
  },
} satisfies Record<string, L10n>;

export const UserConstants = {
  UserNotFound: {
    en: "User not found",
    tr: "Kullanıcı bulunamadı",
    de: "Benutzer nicht gefunden",
  },
} satisfies Record<string, L10n>;

export const QuestionConstants = {
  QuestionNotFound: {
    en: "Question not found",
    tr: "Soru bulunamadı",
    de: "Frage nicht gefunden",
  },
  QuestionDeleteSuccess: {
    en: "Question delete operation successful",
    tr: "Soru silme işlemi başarılı",
    de: "Frage erfolgreich gelöscht",
  },
} satisfies Record<string, L10n>;

export const AnswerConstants = {
  AnswerNotFound: {
    en: "Answer not found",
    tr: "Cevap bulunamadı",
    de: "Antwort nicht gefunden",
  },
  AnswerDeleteSuccess: {
    en: "Answer deleted successfully",
    tr: "Cevap başarıyla silindi",
    de: "Antwort erfolgreich gelöscht",
  },
} satisfies Record<string, L10n>;

export const AuthConstants = {
  InvalidCredentials: {
    en: "Invalid credentials",
    tr: "Geçersiz kimlik bilgileri",
    de: "Ungültige Anmeldedaten",
  },
  EmailAlreadyExists: {
    en: "User with this email already exists",
    tr: "Bu e-posta ile kayıtlı kullanıcı var",
    de: "Benutzer mit dieser E-Mail existiert bereits",
  },
  LogoutSuccess: {
    en: "Logout success",
    tr: "Çıkış başarılı",
    de: "Abmeldung erfolgreich",
  },
  ResetPasswordTokenSent: {
    en: "Reset password token sent to email",
    tr: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi",
    de: "Passwort-Reset-Link an E-Mail gesendet",
  },
  PasswordResetSuccess: {
    en: "Password reset successful",
    tr: "Şifre başarıyla sıfırlandı",
    de: "Passwort erfolgreich zurückgesetzt",
  },
};
