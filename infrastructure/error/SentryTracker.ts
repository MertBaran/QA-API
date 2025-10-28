import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import {
  IExceptionTracker,
  ExceptionLevel,
  ExceptionBreadcrumb,
  ExceptionTransaction,
  ExceptionSpan,
} from './IExceptionTracker';
import { container } from 'tsyringe';
import { IConfigurationService } from '../../services/contracts/IConfigurationService';
import { ILoggerProvider } from '../logging/ILoggerProvider';
import { ErrorLogger } from '../../infrastructure/error/ErrorLogger';

export class SentryTracker implements IExceptionTracker {
  private isInitialized: boolean = false;
  private logger: ILoggerProvider;

  constructor() {
    this.logger = container.resolve<ILoggerProvider>('ILoggerProvider');
    this.initializeSentry();
  }

  private initializeSentry(): void {
    if (this.isInitialized) return;

    try {
      const configService = container.resolve<IConfigurationService>(
        'IConfigurationService'
      );
      const exceptionTrackingConfig =
        configService.getExceptionTrackingConfig();

      if (
        !exceptionTrackingConfig.dsn ||
        exceptionTrackingConfig.dsn === 'YOUR_EXCEPTION_TRACKING_DSN_HERE'
      ) {
        console.log(
          'Exception tracking initialized in development mode (no DSN)'
        );
        this.isInitialized = true;
        return;
      }

      Sentry.init({
        dsn: exceptionTrackingConfig.dsn,
        environment: `${exceptionTrackingConfig.environment}-backend`,
        release: `${exceptionTrackingConfig.release}-backend`,
        integrations: [
          new ProfilingIntegration(),
          new Sentry.Integrations.Http({ tracing: true }),
          new Sentry.Integrations.Express({ app: undefined }), // Will be set later
          new Sentry.Integrations.Mongo(),
          new Sentry.Integrations.Postgres(),
        ],
        tracesSampleRate: exceptionTrackingConfig.tracesSampleRate,
        profilesSampleRate: exceptionTrackingConfig.profilesSampleRate,
        sampleRate: exceptionTrackingConfig.sampleRate,

        // Error filtering
        beforeSend(event) {
          // Hassas bilgileri temizle
          if (event.request?.headers) {
            delete event.request.headers['authorization'];
            delete event.request.headers['cookie'];
          }

          // User error'ları filtrele (sadece system error'ları gönder)
          if (
            event.tags?.['error_category'] === 'USER_ERROR' ||
            event.tags?.['error_category'] === 'VALIDATION_ERROR' ||
            event.tags?.['error_category'] === 'AUTHENTICATION_ERROR' ||
            event.tags?.['error_category'] === 'AUTHORIZATION_ERROR'
          ) {
            return null;
          }

          return event;
        },

        // Breadcrumb filtering
        beforeBreadcrumb(breadcrumb) {
          // Hassas bilgileri temizle
          if (breadcrumb.data?.['password']) {
            breadcrumb.data['password'] = '[HIDDEN]';
          }
          if (breadcrumb.data?.['token']) {
            breadcrumb.data['token'] = '[HIDDEN]';
          }

          return breadcrumb;
        },
      });

      // Set platform-specific tags
      Sentry.setTag('platform', 'backend');
      Sentry.setTag('service', 'qa-api');
      Sentry.setContext('application', {
        platform: 'backend',
        service: 'qa-api',
        version: exceptionTrackingConfig.release,
        environment: exceptionTrackingConfig.environment,
      });

      this.isInitialized = true;
      console.log('✅ Sentry initialized successfully');
      // Mask DSN for security
      const maskedDsn = exceptionTrackingConfig.dsn
        ? `${exceptionTrackingConfig.dsn.substring(0, 20)}...${exceptionTrackingConfig.dsn.substring(exceptionTrackingConfig.dsn.length - 10)}`
        : 'Not configured';

      console.log(
        `🔧 Sentry Config: DSN=${maskedDsn}, Environment=${exceptionTrackingConfig.environment}-backend, Release=${exceptionTrackingConfig.release}-backend`
      );
    } catch (error) {
      console.error('Sentry initialization failed:', error);
    }
  }

  captureException(error: Error, context?: Record<string, any>): void {
    console.log('🔍 SentryTracker.captureException called:', {
      errorName: error.name,
      errorMessage: error.message,
      context: context,
      tags: context?.['tags'],
      isInitialized: this.isInitialized,
    });

    if (!this.isInitialized) {
      console.log('❌ SentryTracker not initialized, skipping...');
      return;
    }

    // Error'ın daha detaylı bilgilerini ekle
    const enhancedContext = {
      ...context,
      error_details: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        constructor: error.constructor.name,
      },
      error_metadata: {
        category: context?.['category'],
        severity: context?.['severity'],
        shouldLog: context?.['shouldLog'],
        shouldAlert: context?.['shouldAlert'],
        retryable: context?.['retryable'],
      },
      session_info: {
        applicationId: context?.['applicationId'],
        environment: context?.['environment'],
        version: context?.['version'],
        timestamp: context?.['timestamp'],
      },
    };

    try {
      // Sentry'ye gönder
      const result = Sentry.captureException(error, {
        extra: enhancedContext,
        tags: context?.['tags'] || {},
        level: context?.['level'] || 'error',
        user: context?.['user'],
        contexts: context?.['contexts'],
      });

      // File log'a yaz (başarılı durumda sadece file log)
      this.logToFile('SENTRY_SUCCESS', {
        eventId: result,
        errorCategory: context?.['tags']?.['error_category'] || 'UNKNOWN',
        errorMessage: error.message,
        environment: enhancedContext.session_info?.environment || 'unknown',
        timestamp: new Date().toISOString(),
      });

      // Sentry'nin flush işlemini bekle
      Sentry.flush(2000)
        .then(() => {
          // Flush başarılı - sadece file log
          this.logToFile('SENTRY_FLUSH_SUCCESS', {
            eventId: result,
            timestamp: new Date().toISOString(),
          });
        })
        .catch(flushError => {
          // Flush başarısız - console + file log
          console.error(`❌ [SENTRY] Flush failed: ${flushError.message}`);
          this.logToFile('SENTRY_FLUSH_FAILED', {
            eventId: result,
            error: flushError.message,
            timestamp: new Date().toISOString(),
          });
        });
    } catch (sentryError) {
      // Sentry gönderimi başarısız - console + file log
      console.error(
        `❌ [SENTRY] Send failed: ${sentryError instanceof Error ? sentryError.message : String(sentryError)}`
      );
      this.logToFile('SENTRY_SEND_FAILED', {
        error:
          sentryError instanceof Error
            ? sentryError.message
            : String(sentryError),
        errorCategory: context?.['tags']?.['error_category'] || 'UNKNOWN',
        errorMessage: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  captureMessage(
    message: string,
    level: ExceptionLevel = 'info',
    context?: Record<string, any>
  ): void {
    if (!this.isInitialized) return;

    Sentry.captureMessage(message, {
      level,
      extra: context,
      tags: context?.['tags'] || {},
    });
  }

  setUser(user: { id: string; email?: string; username?: string }): void {
    if (!this.isInitialized) return;

    Sentry.setUser(user);
  }

  setTag(key: string, value: string): void {
    if (!this.isInitialized) return;

    Sentry.setTag(key, value);
  }

  setContext(name: string, context: Record<string, any>): void {
    if (!this.isInitialized) return;

    Sentry.setContext(name, context);
  }

  addBreadcrumb(breadcrumb: ExceptionBreadcrumb): void {
    if (!this.isInitialized) return;

    Sentry.addBreadcrumb({
      category: breadcrumb.category,
      message: breadcrumb.message,
      data: breadcrumb.data,
      level: breadcrumb.level || 'info',
      timestamp: breadcrumb.timestamp,
    });
  }

  startTransaction(name: string, operation?: string): ExceptionTransaction {
    if (!this.isInitialized) {
      return this.createDummyTransaction();
    }

    const transaction = Sentry.startTransaction({
      name,
      op: operation || 'http.server',
    });

    return {
      setHttpStatus: (statusCode: number) =>
        transaction.setHttpStatus(statusCode),
      setTag: (key: string, value: string) => transaction.setTag(key, value),
      setData: (key: string, value: any) => transaction.setData(key, value),
      finish: () => transaction.finish(),
    };
  }

  startSpan(name: string, operation?: string): ExceptionSpan {
    if (!this.isInitialized) {
      return this.createDummySpan();
    }

    // Sentry'de span oluşturma için transaction gerekli
    const transaction = Sentry.getCurrentHub().getScope().getTransaction();
    if (!transaction) {
      return this.createDummySpan();
    }

    const span = transaction.startChild({
      name,
      op: operation || 'http.server',
    });

    return {
      setTag: (key: string, value: string) => span.setTag(key, value),
      setData: (key: string, value: any) => span.setData(key, value),
      finish: () => span.finish(),
    };
  }

  isEnabled(): boolean {
    return this.isInitialized;
  }

  private logToFile(type: string, data: Record<string, any>): void {
    try {
      // Mevcut file logging sistemini kullan
      const error = new Error(
        `Sentry ${type}: ${data['errorMessage'] || 'Unknown error'}`
      );
      const metadata = {
        category: data['errorCategory'] || 'UNKNOWN',
        severity: 'CRITICAL',
        shouldLog: true,
        shouldAlert: true,
        context: {
          endpoint: '/sentry-tracker',
          method: 'POST',
          userAgent: 'SentryTracker',
          ip: '127.0.0.1',
          timestamp: new Date().toISOString(),
        },
      };

      // ErrorLogger'ın file logging sistemini kullan
      ErrorLogger.logError(error, undefined, {
        sentryType: type,
        sentryData: data,
      });
    } catch (error) {
      console.error('❌ [SENTRY_LOG] Failed to log to file:', error);
    }
  }

  private createDummyTransaction(): ExceptionTransaction {
    return {
      setHttpStatus: () => {},
      setTag: () => {},
      setData: () => {},
      finish: () => {},
    };
  }

  private createDummySpan(): ExceptionSpan {
    return {
      setTag: () => {},
      setData: () => {},
      finish: () => {},
    };
  }
}
