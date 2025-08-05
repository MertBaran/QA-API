# Error Handling Sistemi

Bu sistem, uygulamanızda hataları kategorilere ayırarak farklı şekillerde loglama ve yönetim sağlar.

## 🎯 Amaç

- **Kullanıcı hatalarını** (4xx) sistem hatalarından ayırmak
- **Sistem hatalarını** (5xx) Sentry ile loglamak
- **Business logic hatalarını** ayrı kategoride yönetmek
- **Hassas bilgileri** korumak
- **Development/Production** ortamlarında farklı davranış sergilemek

## 📁 Dosya Yapısı

```
helpers/error/
├── ErrorTypes.ts              # Error kategorileri ve tipleri
├── ErrorClassifier.ts         # Hataları sınıflandıran sınıf
├── ErrorLogger.ts             # Sentry ve console loglama
├── EnhancedCustomError.ts     # Gelişmiş error sınıfı
├── CustomError.ts             # Eski error sınıfı (backward compatibility)
└── index.ts                   # Export dosyası
```

## 🏷️ Error Kategorileri

### 1. USER_ERROR (4xx)

- **Açıklama**: Kullanıcının sebep olduğu hatalar
- **Örnekler**: Yanlış şifre, eksik alan, geçersiz format
- **Loglama**: Hayır (sadece yüksek severity'de)
- **Sentry**: Hayır

### 2. SYSTEM_ERROR (5xx)

- **Açıklama**: Uygulama/sistem hataları
- **Örnekler**: Database bağlantı hatası, memory leak, crash
- **Loglama**: Evet (her zaman)
- **Sentry**: Evet (kritik olanlar)

### 3. BUSINESS_ERROR

- **Açıklama**: İş mantığı hataları
- **Örnekler**: Yetersiz bakiye, kullanıcı bloklanmış
- **Loglama**: Evet (yüksek severity'de)
- **Sentry**: Evet (kritik olanlar)

### 4. VALIDATION_ERROR

- **Açıklama**: Veri doğrulama hataları
- **Örnekler**: Email formatı, required alanlar
- **Loglama**: Hayır
- **Sentry**: Hayır

### 5. AUTHENTICATION_ERROR

- **Açıklama**: Kimlik doğrulama hataları
- **Örnekler**: Geçersiz token, expired token
- **Loglama**: Hayır
- **Sentry**: Hayır

### 6. AUTHORIZATION_ERROR

- **Açıklama**: Yetkilendirme hataları
- **Örnekler**: Yetkisiz erişim, role yetersiz
- **Loglama**: Hayır
- **Sentry**: Hayır

## 🚀 Kullanım

### 1. EnhancedCustomError Kullanımı

```typescript
import { EnhancedCustomError } from '../helpers/error';

// Factory methods ile hızlı hata oluşturma
throw EnhancedCustomError.userError('Invalid email format');
throw EnhancedCustomError.authenticationError('Token expired');
throw EnhancedCustomError.systemError('Database connection failed');
throw EnhancedCustomError.validationError('Email is required');

// Manuel hata oluşturma
throw new EnhancedCustomError(
  'Custom error message',
  400,
  ErrorCategory.BUSINESS_ERROR,
  ErrorSeverity.MEDIUM
);
```

### 2. Error Logger Kullanımı

```typescript
import { ErrorLogger } from '../helpers/error';

// Request context ile loglama
ErrorLogger.logError(error, req);

// Sistem hatası loglama
ErrorLogger.logSystemError(error, 'Database operation', { table: 'users' });

// Business hatası loglama
ErrorLogger.logBusinessError(error, 'Payment processing', { userId: '123' });
```

### 3. Middleware Entegrasyonu

```typescript
import { appErrorHandler } from '../middlewares/errors/appErrorHandler';

// App.ts'de
app.use(appErrorHandler);
```

### 4. Sentry Entegrasyonu

```typescript
import { initSentry } from '../config/sentry';

// App.ts'de başlangıçta
initSentry();
```

## 🔧 Konfigürasyon

### Environment Variables

```env
# Sentry
SENTRY_DSN=your_sentry_dsn_here
NODE_ENV=production
APP_VERSION=1.0.0

# Error Logging
LOG_LEVEL=error
ENABLE_ERROR_ALERTS=true
```

### Sentry Filtreleme

Sentry'ye sadece şu hatalar gönderilir:

- SYSTEM_ERROR (tümü)
- BUSINESS_ERROR (sadece CRITICAL severity)
- shouldAlert=true olan hatalar

## 📊 Loglama Kuralları

| Error Category       | Console Log        | Sentry        | Alert         |
| -------------------- | ------------------ | ------------- | ------------- |
| USER_ERROR           | ❌                 | ❌            | ❌            |
| VALIDATION_ERROR     | ❌                 | ❌            | ❌            |
| AUTHENTICATION_ERROR | ❌                 | ❌            | ❌            |
| AUTHORIZATION_ERROR  | ❌                 | ❌            | ❌            |
| BUSINESS_ERROR       | ⚠️ (HIGH/CRITICAL) | ⚠️ (CRITICAL) | ❌            |
| SYSTEM_ERROR         | ✅                 | ✅            | ⚠️ (CRITICAL) |

## 🔄 Migration Guide

### Eski CustomError'dan Geçiş

```typescript
// Eski kullanım
throw new CustomError('User not found', 404);

// Yeni kullanım
throw EnhancedCustomError.notFoundError('User not found');
// veya
throw EnhancedCustomError.userError('User not found', 404);
```

### Eski Error Handler'dan Geçiş

```typescript
// Eski
import customErrorHandler from '../middlewares/errors/customErrorHandler';
app.use(customErrorHandler);

// Yeni
import { appErrorHandler } from '../middlewares/errors/appErrorHandler';
app.use(appErrorHandler);
```

## 🧪 Test Örnekleri

```typescript
import { EnhancedCustomError, ErrorLogger } from '../helpers/error';

describe('Error Handling', () => {
  test('should classify user errors correctly', () => {
    const error = EnhancedCustomError.userError('Invalid input');
    expect(error.category).toBe(ErrorCategory.USER_ERROR);
    expect(error.metadata.shouldLog).toBe(false);
  });

  test('should classify system errors correctly', () => {
    const error = EnhancedCustomError.systemError('Database failed');
    expect(error.category).toBe(ErrorCategory.SYSTEM_ERROR);
    expect(error.metadata.shouldLog).toBe(true);
    expect(error.metadata.shouldAlert).toBe(true);
  });
});
```

## 🔒 Güvenlik

- Hassas bilgiler (password, token) otomatik olarak gizlenir
- User error'ları Sentry'ye gönderilmez
- Production'da stack trace gizlenir
- Request ID'ler eklenir

## 📈 Monitoring

Sentry'de şu metrikleri takip edebilirsiniz:

- Error rate by category
- Error rate by severity
- Most common system errors
- Performance impact of errors
- User impact analysis
