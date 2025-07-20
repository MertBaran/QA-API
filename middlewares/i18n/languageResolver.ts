import type { Request, Response, NextFunction } from 'express';
import type { Locale } from '../../types/i18n';

// Desteklenen diller listesi — yeni dil eklemek için diziye ekleyin
const supported: Locale[] = ['en', 'tr'];
const fallback: Locale = 'en';

const parseLocale = (acceptLang = ''): Locale => {
  // "tr-TR,tr;q=0.9" -> "tr-TR" -> "tr"
  const primary = (acceptLang.split(',')[0] ?? '').trim().toLowerCase();
  const langCode = primary.split('-')[0] as Locale;
  return supported.includes(langCode) ? langCode : fallback;
};

export const languageResolver = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const header = (req.headers['accept-language'] as string | undefined) ?? '';
  req.locale = parseLocale(header);
  next();
};
