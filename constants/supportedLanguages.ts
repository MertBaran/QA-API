export const SUPPORTED_LANGUAGES = {
  TR: 'tr',
  EN: 'en',
  DE: 'de',
} as const;

export type SupportedLanguage =
  (typeof SUPPORTED_LANGUAGES)[keyof typeof SUPPORTED_LANGUAGES];

export const SUPPORTED_LANGUAGE_LIST: SupportedLanguage[] =
  Object.values(SUPPORTED_LANGUAGES);

export const DEFAULT_LANGUAGE: SupportedLanguage = SUPPORTED_LANGUAGES.TR;

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  [SUPPORTED_LANGUAGES.TR]: 'Türkçe',
  [SUPPORTED_LANGUAGES.EN]: 'English',
  [SUPPORTED_LANGUAGES.DE]: 'Deutsch',
};

export function isValidLanguage(
  language: string
): language is SupportedLanguage {
  return SUPPORTED_LANGUAGE_LIST.includes(language as SupportedLanguage);
}

export function getLanguageOrDefault(language?: string): SupportedLanguage {
  if (language && isValidLanguage(language)) {
    return language;
  }
  return DEFAULT_LANGUAGE;
}
