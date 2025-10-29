import { L10n } from '../../types/i18n';
import {
  SupportedLanguage,
  DEFAULT_LANGUAGE,
  getLanguageOrDefault,
} from '../../constants/supportedLanguages';

export function getLocalizedMessage(
  messages: L10n,
  language?: SupportedLanguage
): string {
  const validLanguage = getLanguageOrDefault(language);
  return (
    messages[validLanguage] ||
    messages[DEFAULT_LANGUAGE] ||
    Object.values(messages)[0] ||
    ''
  );
}

export function getLocalizedNotificationMessage(
  messages: L10n,
  userLanguage?: SupportedLanguage
): string {
  return getLocalizedMessage(messages, userLanguage);
}
