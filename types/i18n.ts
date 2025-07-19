import type { ICacheProvider } from "../infrastructure/cache/ICacheProvider";

export type Locale = "en" | "tr" | "de";

export interface L10n {
  en: string;
  tr: string;
  de: string; // artık zorunlu
}

export const supportedLocales: Locale[] = ["en", "tr", "de"];
export const fallbackLocale: Locale = "en";

export const normalizeLocale = (raw?: string): Locale => {
  if (!raw) return fallbackLocale;

  // Handle complex Accept-Language headers like "tr-TR,tr;q=0.9,en;q=0.8"
  const languages = raw
    .split(",")
    .map((lang) => {
      // Extract language code (before ;q= or -)
      const parts = lang.split(";");
      const langPart = parts[0];
      const code = langPart
        ? langPart.split("-")[0]?.trim().toLowerCase() || ""
        : "";

      // Extract quality value (q=)
      const qMatch = lang.match(/;q=([0-9.]+)/);
      const quality = qMatch?.[1] ? parseFloat(qMatch[1]) : 1.0;

      return { code, quality };
    })
    .filter(({ code }) => code) // Remove empty codes
    .sort((a, b) => b.quality - a.quality); // Sort by quality (highest first)

  // Find the first supported language
  for (const { code } of languages) {
    if (supportedLocales.includes(code as Locale)) {
      return code as Locale;
    }
  }

  // Direct check for simple cases
  if (supportedLocales.includes(raw as Locale)) {
    return raw as Locale;
  }

  return fallbackLocale;
};

// Simple memory cache for frequently used translations (fallback)
const memoryCache = new Map<string, string>();

// Redis cache instance (will be injected)
let cacheProvider: ICacheProvider | null = null;

// Set cache provider (called from container setup)
export const setI18nCacheProvider = (provider: ICacheProvider): void => {
  cacheProvider = provider;
};

// Helper function to generate cache key
const generateCacheKey = (msg: L10n, locale: Locale): string => {
  // Use hash instead of full JSON to reduce key size
  const msgHash = Buffer.from(JSON.stringify(msg))
    .toString("base64")
    .slice(0, 16);
  return `i18n:${msgHash}:${locale}`;
};

// Performance optimized i18n function with Redis + memory caching
export const i18n = async (
  msg: L10n,
  locale: Locale = fallbackLocale
): Promise<string> => {
  const cacheKey = generateCacheKey(msg, locale);

  try {
    // 1. Try Redis cache first (if available)
    if (cacheProvider) {
      const cached = await cacheProvider.get<string>(cacheKey);
      if (cached) return cached;
    }

    // 2. Fallback to memory cache
    const memoryCached = memoryCache.get(cacheKey);
    if (memoryCached) {
      // If found in memory, also save to Redis for next time
      if (cacheProvider) {
        await cacheProvider.set(cacheKey, memoryCached, 3600); // 1 hour TTL
      }
      return memoryCached;
    }

    // 3. Get translation and cache it
    const translation = msg[locale] || msg[fallbackLocale];

    // Save to both caches
    if (cacheProvider) {
      await cacheProvider.set(cacheKey, translation, 3600); // 1 hour TTL
    }

    // Limit memory cache size to prevent memory issues
    if (memoryCache.size < 500) {
      memoryCache.set(cacheKey, translation);
    }

    return translation;
  } catch (error) {
    // If cache fails, fallback to direct translation
    console.warn("i18n cache error:", error);
    return msg[locale] || msg[fallbackLocale];
  }
};

// Synchronous version for backward compatibility (uses memory cache only)
export const i18nSync = (
  msg: L10n,
  locale: Locale = fallbackLocale
): string => {
  const cacheKey = generateCacheKey(msg, locale);

  // Check memory cache first
  const cached = memoryCache.get(cacheKey);
  if (cached) return cached;

  // Get translation
  const translation = msg[locale] || msg[fallbackLocale];

  // Cache in memory only
  if (memoryCache.size < 500) {
    memoryCache.set(cacheKey, translation);
  }

  return translation;
};

// Helper functions for cache management
export const clearI18nCache = async (): Promise<void> => {
  memoryCache.clear();
  // Note: Redis cache is not cleared here as it might be shared
};

export const warmupI18nCache = async (
  messages: L10n[],
  locales: Locale[] = supportedLocales
): Promise<void> => {
  if (!cacheProvider) return;

  try {
    for (const msg of messages) {
      for (const locale of locales) {
        await i18n(msg, locale);
      }
    }
  } catch (error) {
    console.warn("i18n cache warmup error:", error);
  }
};

// Express augmentation
declare global {
  namespace Express {
    interface Request {
      locale?: Locale;
    }
  }
}
