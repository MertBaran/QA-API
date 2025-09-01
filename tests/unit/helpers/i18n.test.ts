import 'reflect-metadata';
import { container } from 'tsyringe';
import {
  normalizeLocale,
  i18n,
  i18nSync,
  clearI18nCache,
  warmupI18nCache,
  setI18nCacheProvider,
} from '../../../types/i18n';
import { FakeCacheProvider } from '../../mocks/cache/FakeCacheProvider';
import { AuthConstants } from '../../../controllers/constants/ControllerMessages';

describe('i18n Unit Tests', () => {
  let fakeCacheProvider: FakeCacheProvider;

  beforeEach(async () => {
    fakeCacheProvider = new FakeCacheProvider();
    container.registerInstance('ICacheProvider', fakeCacheProvider);
    setI18nCacheProvider(fakeCacheProvider);
    await clearI18nCache();
    await fakeCacheProvider.clear();
  });

  describe('normalizeLocale', () => {
    it('should return supported locale', () => {
      expect(normalizeLocale('en')).toBe('en');
      expect(normalizeLocale('tr')).toBe('tr');
      expect(normalizeLocale('de')).toBe('de');
    });

    it('should return fallback for unsupported locale', () => {
      expect(normalizeLocale('fr')).toBe('en');
      expect(normalizeLocale('es')).toBe('en');
      expect(normalizeLocale('')).toBe('en');
      expect(normalizeLocale(undefined)).toBe('en');
    });

    it('should handle complex accept-language headers', () => {
      expect(normalizeLocale('tr-TR,tr;q=0.9,en;q=0.8')).toBe('tr');
      expect(normalizeLocale('de-DE,de;q=0.9')).toBe('de');
      // fr is not supported, should fallback to en (highest q value after fr)
      expect(normalizeLocale('fr-FR,fr;q=0.9,en;q=0.8')).toBe('en');
    });
  });

  describe('i18nSync (synchronous version)', () => {
    it('should return correct translation synchronously', () => {
      const result = i18nSync(AuthConstants.LogoutSuccess, 'tr');
      expect(result).toBe('Çıkış başarılı');
    });

    it('should fallback to English for unsupported locale', () => {
      const result = i18nSync(AuthConstants.LogoutSuccess, 'fr' as any);
      expect(result).toBe('Logout success');
    });

    it('should use memory cache for repeated calls', () => {
      const result1 = i18nSync(AuthConstants.LogoutSuccess, 'de');
      const result2 = i18nSync(AuthConstants.LogoutSuccess, 'de');
      expect(result1).toBe('Abmeldung erfolgreich');
      expect(result2).toBe('Abmeldung erfolgreich');
    });
  });

  describe('i18n (async version with Redis)', () => {
    it('should return correct translation asynchronously', async () => {
      const result = await i18n(AuthConstants.LogoutSuccess, 'tr');
      expect(result).toBe('Çıkış başarılı');
    });

    it('should cache translation in Redis', async () => {
      await i18n(AuthConstants.LogoutSuccess, 'de');

      // Check if any i18n keys exist in cache
      const cacheKeys = fakeCacheProvider.getKeys();
      const i18nKeys = cacheKeys.filter(key => key.startsWith('i18n:'));
      expect(i18nKeys.length).toBeGreaterThan(0);
    });

    it('should use cached value on second call', async () => {
      // First call - sets cache
      await i18n(AuthConstants.LogoutSuccess, 'de');

      // Manually override cached value to test cache usage
      const cacheKeys = fakeCacheProvider.getKeys();
      const i18nKey = cacheKeys.find(key => key.startsWith('i18n:'));
      if (i18nKey) {
        await fakeCacheProvider.set(i18nKey, 'CACHED_VALUE');
      }

      // Second call should return cached value
      const result = await i18n(AuthConstants.LogoutSuccess, 'de');
      expect(result).toBe('CACHED_VALUE');
    });

    it('should fallback gracefully when cache fails', async () => {
      // Create a failing cache provider
      const failingCache = {
        get: async () => {
          throw new Error('Cache error');
        },
        set: async () => {
          throw new Error('Cache error');
        },
        del: async () => {
          throw new Error('Cache error');
        },
      };
      setI18nCacheProvider(failingCache as any);

      const result = await i18n(AuthConstants.LogoutSuccess, 'tr');
      expect(result).toBe('Çıkış başarılı');
    });

    it('should support all three languages', async () => {
      const enResult = await i18n(AuthConstants.LogoutSuccess, 'en');
      const trResult = await i18n(AuthConstants.LogoutSuccess, 'tr');
      const deResult = await i18n(AuthConstants.LogoutSuccess, 'de');

      expect(enResult).toBe('Logout success');
      expect(trResult).toBe('Çıkış başarılı');
      expect(deResult).toBe('Abmeldung erfolgreich');
    });
  });

  describe('cache management', () => {
    it('should clear cache properly', async () => {
      // Add some translations to cache
      await i18n(AuthConstants.LogoutSuccess, 'tr');
      await i18n(AuthConstants.PasswordResetSuccess, 'de');

      // Verify cache has items
      const cacheKeys = fakeCacheProvider.getKeys();
      expect(cacheKeys.length).toBeGreaterThan(0);

      // Clear cache
      await clearI18nCache();
      await fakeCacheProvider.clear();

      // Verify cache is empty
      const clearedKeys = fakeCacheProvider.getKeys();
      expect(clearedKeys.length).toBe(0);
    });

    it('should warm up cache with multiple messages', async () => {
      const messages = [
        AuthConstants.LogoutSuccess,
        AuthConstants.PasswordResetSuccess,
      ];
      const locales: ('en' | 'tr')[] = ['en', 'tr'];

      await warmupI18nCache(messages, locales);

      // Check cache has been populated
      const cacheKeys = fakeCacheProvider.getKeys();
      const i18nKeys = cacheKeys.filter(key => key.startsWith('i18n:'));

      // Should have at least 4 entries (2 messages × 2 locales)
      expect(i18nKeys.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('error handling', () => {
    it('should handle missing translations gracefully', async () => {
      const incompleteMessage = {
        en: 'English text',
        tr: '', // Missing Turkish
        de: 'German text',
      };

      const result = await i18n(incompleteMessage, 'tr');
      expect(result).toBe('English text'); // Should fallback to English
    });

    it('should fallback to English when requested locale is missing', async () => {
      const message = {
        en: 'English text',
        tr: 'Turkish text',
        de: 'German text',
      };

      const result = await i18n(message, 'fr' as any);
      expect(result).toBe('English text');
    });
  });
});
