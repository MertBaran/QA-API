import {
  ErrorMetadata,
  ErrorCategory,
  ErrorSeverity,
  ErrorContext,
} from './ErrorTypes';
import { ErrorClassifier } from './ErrorClassifier';
import { Request } from 'express';
import { container } from 'tsyringe';
import { IExceptionTracker } from './IExceptionTracker';
import { IConfigurationService } from '../../services/contracts/IConfigurationService';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Extend Request type to include user property
interface AuthenticatedRequest extends Request {
  user?: { id: string };
}

export class ErrorLogger {
  private static applicationId: string = uuidv4();
  private static currentLogFile: string | null = null;

  private static getExceptionTracker(): IExceptionTracker {
    return container.resolve<IExceptionTracker>('IExceptionTracker');
  }

  private static getConfigurationService(): IConfigurationService {
    return container.resolve<IConfigurationService>('IConfigurationService');
  }

  private static formatErrorForLogging(
    error: any,
    metadata: ErrorMetadata
  ): string {
    const { category, severity, context } = metadata;

    return `[${severity}] ${category}: ${error.message || error.name || 'Unknown Error'}
    Stack: ${error.stack || 'No stack trace'}
    Context: ${JSON.stringify(context, null, 2)}
    Timestamp: ${context.timestamp.toISOString()}`;
  }

  private static shouldLogToSentry(metadata: ErrorMetadata): boolean {
    // Sadece sistem hatalarını ve kritik business hatalarını Sentry'ye gönder
    return (
      metadata.category === ErrorCategory.SYSTEM_ERROR ||
      (metadata.category === ErrorCategory.BUSINESS_ERROR &&
        metadata.severity === ErrorSeverity.CRITICAL) ||
      metadata.shouldAlert
    );
  }

  private static shouldLogToConsole(metadata: ErrorMetadata): boolean {
    // Sentry'ye giden hataları console'a yazdırma
    return !this.shouldLogToSentry(metadata);
  }

  private static logToConsole(error: any, metadata: ErrorMetadata): void {
    const logMessage = this.formatErrorForLogging(error, metadata);

    switch (metadata.severity) {
      case ErrorSeverity.LOW:
        console.log(logMessage);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(logMessage);
        break;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        console.error(logMessage);
        break;
    }
  }

  private static logToSentry(error: any, metadata: ErrorMetadata): void {
    // ErrorLogger artık Sentry'ye göndermeyecek
    // Sentry işlemleri sadece appErrorHandler'da yapılacak
    return;
  }

  private static logToFile(error: any, metadata: ErrorMetadata): void {
    try {
      const configService = this.getConfigurationService();
      const fileLoggingConfig = configService.getFileLoggingConfig();

      // File logging devre dışıysa çık
      if (!fileLoggingConfig.enabled) {
        return;
      }

      const now = new Date();
      const timestamp = now.toISOString();
      const dateStr = timestamp.split('T')[0] || 'unknown'; // YYYY-MM-DD

      // ConfigurationManager'dan bilgileri al
      const environment = fileLoggingConfig.environment;
      const version = fileLoggingConfig.version;

      // Log dizin yapısı: basePath/version/environment/
      const logDir = path.join(
        fileLoggingConfig.basePath,
        version,
        environment
      );
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      // Dosya adı: YYYY-MM-DD_applicationId.json
      const fileName = `${dateStr}_${this.applicationId}.json`;
      const logFile = path.join(logDir, fileName);

      const logEntry = {
        id: `${this.applicationId}_${timestamp.replace(/[:.]/g, '-')}`,
        applicationId: this.applicationId,
        timestamp: timestamp,
        environment: environment,
        version: version,
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack,
        },
        metadata: {
          category: metadata.category,
          severity: metadata.severity,
          shouldLog: metadata.shouldLog,
          shouldAlert: metadata.shouldAlert,
        },
        context: {
          endpoint: metadata.context.endpoint,
          method: metadata.context.method,
          userAgent: metadata.context.userAgent,
          ip: metadata.context.ip,
          timestamp: metadata.context.timestamp,
        },
      };

      // Mevcut dosyayı oku veya yeni oluştur
      let logData = [];
      if (fs.existsSync(logFile)) {
        try {
          const existingContent = fs.readFileSync(logFile, 'utf8');
          logData = JSON.parse(existingContent);
        } catch (parseError) {
          logData = [];
        }
      }

      // Yeni entry'yi ekle
      logData.push(logEntry);

      // Dosyaya yaz
      fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
    } catch (fileError) {
      console.error('Failed to write error to file:', fileError);
    }
  }

  private static mapSeverityToSentryLevel(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'info';
      case ErrorSeverity.MEDIUM:
        return 'warning';
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.CRITICAL:
        return 'fatal';
      default:
        return 'error';
    }
  }

  static logError(
    error: any,
    req?: AuthenticatedRequest,
    additionalData?: Record<string, any>
  ): void {
    // Request context'ini oluştur
    const context: ErrorContext = {
      userId: req?.user?.id,
      requestId: req?.headers['x-request-id'] as string,
      endpoint: req?.originalUrl,
      method: req?.method,
      userAgent: req?.headers['user-agent'],
      ip: req?.ip || req?.connection?.remoteAddress,
      timestamp: new Date(),
      stack: error.stack,
      additionalData,
    };

    // Hatayı sınıflandır
    const metadata = ErrorClassifier.classifyError(error, context);

    // Loglama kurallarını kontrol et
    if (!metadata.shouldLog) {
      return;
    }

    // Console'a logla (sadece Sentry'ye gitmeyen hatalar)
    if (this.shouldLogToConsole(metadata)) {
      this.logToConsole(error, metadata);
    }

    // Sentry'ye gönder
    this.logToSentry(error, metadata);
  }

  static logSystemError(
    error: any,
    context: string,
    additionalData?: Record<string, any>
  ): void {
    const errorContext = {
      timestamp: new Date(),
      stack: error.stack,
      additionalData: { ...additionalData, context },
    };

    const metadata = ErrorClassifier.classifyError(
      error,
      errorContext as ErrorContext
    );

    // Sistem hatalarını her zaman logla
    metadata.shouldLog = true;
    metadata.shouldAlert = true;

    this.logToConsole(error, metadata);
    this.logToSentry(error, metadata);
  }

  static logBusinessError(
    error: any,
    businessContext: string,
    additionalData?: Record<string, any>
  ): void {
    const errorContext = {
      timestamp: new Date(),
      stack: error.stack,
      additionalData: { ...additionalData, businessContext },
    };

    const metadata = ErrorClassifier.classifyError(error, errorContext);

    // Business hatalarını sadece yüksek severity'de logla
    if (
      metadata.severity === ErrorSeverity.HIGH ||
      metadata.severity === ErrorSeverity.CRITICAL
    ) {
      this.logToConsole(error, metadata);
      this.logToSentry(error, metadata);
    }
  }
}
