export enum ErrorCategory {
  USER_ERROR = 'USER_ERROR', // 4xx - Kullanıcı hataları
  SYSTEM_ERROR = 'SYSTEM_ERROR', // 5xx - Sistem hataları
  BUSINESS_ERROR = 'BUSINESS_ERROR', // İş mantığı hataları
  VALIDATION_ERROR = 'VALIDATION_ERROR', // Validasyon hataları
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR', // Kimlik doğrulama hataları
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR', // Yetkilendirme hataları
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  timestamp: Date;
  stack?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorMetadata {
  category: ErrorCategory;
  severity: ErrorSeverity;
  shouldLog: boolean;
  shouldAlert: boolean;
  retryable: boolean;
  context: ErrorContext;
}
