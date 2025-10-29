import { Request, Response, NextFunction } from 'express';
import { ApplicationError } from '../../infrastructure/error/ApplicationError';
import { container } from 'tsyringe';
import { IEnvironmentProvider } from '../../services/contracts/IEnvironmentProvider';
import { ILoggerProvider } from '../../infrastructure/logging/ILoggerProvider';
import { IExceptionTracker } from '../../infrastructure/error/IExceptionTracker';

function appErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let appError = err;

  // Eğer zaten ApplicationError ise, direkt kullan
  if (err instanceof ApplicationError) {
    appError = err;
  }
  // Eğer eski CustomError ise, ApplicationError'a çevir
  else if (err.statusCode && err.message) {
    appError = ApplicationError.fromCustomError(err);
  }
  // Diğer hataları sınıflandır ve uygun hata tipine çevir
  else {
    appError = classifyAndTransformError(err);
  }

  // Hata tipine göre farklı loglama stratejisi
  handleErrorLogging(appError, req);

  // Response'u hazırla
  const response = prepareErrorResponse(appError, req);

  // Response'u gönder
  res.status(appError.statusCode || 500).json(response);
}

function handleErrorLogging(appError: ApplicationError, req: Request): void {
  try {
    const logger = container.resolve<ILoggerProvider>('ILoggerProvider');
    const exceptionTracker =
      container.resolve<IExceptionTracker>('IExceptionTracker');

    // Kullanıcı hatalarını Pino'ya logla (Sentry'ye gönderme)
    if (appError.isUserError()) {
      logger.warn('User error occurred', {
        message: appError.message,
        statusCode: appError.statusCode,
        category: appError.category,
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: (req as any).user?.id,
      });
      return;
    }

    // Sistem hatalarını Sentry'ye gönder
    if (
      appError.isSystemError() ||
      (appError.isBusinessError() && appError.severity === 'CRITICAL')
    ) {
      exceptionTracker.captureException(appError, {
        endpoint: req.originalUrl,
        method: req.method,
        userId: (req as any).user?.id,
        requestId: req.headers['x-request-id'] as string,
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        tags: {
          error_category: appError.category,
          error_severity: appError.severity,
          endpoint: req.originalUrl,
          method: req.method,
        },
        additionalData: {
          category: appError.category,
          severity: appError.severity,
          statusCode: appError.statusCode,
        },
      });
    }

    // Tüm hataları ErrorLogger ile de logla (mevcut sistem)
    // ErrorLogger.logError(appError, req); // Bu satırı kaldırıyoruz
  } catch (loggingError) {
    // Logging hatası durumunda console'a fallback
    console.error('Error logging failed:', loggingError);
    console.error('Original error:', appError);
  }
}

function classifyAndTransformError(err: any): ApplicationError {
  // MongoDB/Mongoose hataları
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val: any) => val.message)
      .join(', ');
    return ApplicationError.validationError(message);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0] || 'field';
    return ApplicationError.duplicateKeyError(field);
  }

  if (err.name === 'CastError') {
    return ApplicationError.validationError('Please provide a valid id');
  }

  // Syntax hataları
  if (err.name === 'SyntaxError') {
    return ApplicationError.userError('Invalid JSON syntax', 400);
  }

  // JWT hataları
  if (err.name === 'JsonWebTokenError') {
    return ApplicationError.authenticationError('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    return ApplicationError.authenticationError('Token expired');
  }

  // Database bağlantı hataları
  if (
    err.name === 'MongoNetworkError' ||
    err.name === 'MongooseServerSelectionError'
  ) {
    return ApplicationError.databaseError('Database connection failed', err);
  }

  if (err.name === 'MongoTimeoutError') {
    return ApplicationError.timeoutError('Database operation timeout');
  }

  // PostgreSQL hataları
  if (err.code === '23505') {
    // unique_violation
    return ApplicationError.duplicateKeyError('Resource already exists');
  }

  if (err.code === '23503') {
    // foreign_key_violation
    return ApplicationError.foreignKeyError('Referenced resource not found');
  }

  if (err.code === '42703') {
    // undefined_column
    return ApplicationError.databaseError('Database schema error', err);
  }

  // Network hataları
  if (err.code === 'ECONNREFUSED') {
    return ApplicationError.networkError('Service connection refused');
  }

  if (err.code === 'ETIMEDOUT') {
    return ApplicationError.timeoutError('Request timeout');
  }

  // Bilinmeyen hatalar için varsayılan sistem hatası
  return ApplicationError.internalServerError(
    err.message || 'Unknown error occurred'
  );
}

function prepareErrorResponse(error: ApplicationError, req: Request): any {
  const envProvider = container.resolve<IEnvironmentProvider>(
    'IEnvironmentProvider'
  );
  const nodeEnv = envProvider.getEnvironmentVariable('NODE_ENV', 'development');

  const isDevelopment = nodeEnv === 'development';
  const isTest = nodeEnv === 'test';
  const isProduction = nodeEnv === 'production';

  // Base response
  const response: any = {
    success: false,
    error: error.message,
    statusCode: error.statusCode,
  };

  // Development ortamında ek bilgiler
  if (isDevelopment || isTest) {
    response.debug = {
      category: error.category,
      severity: error.severity,
      stack: error.stack,
      timestamp: error.metadata.context.timestamp,
      endpoint: req.originalUrl,
      method: req.method,
    };
  }

  // Production ortamında sadece gerekli bilgiler
  if (isProduction) {
    // Sistem hatalarında genel mesaj göster
    if (error.category === 'SYSTEM_ERROR') {
      response.error = 'Internal server error';
      response.errorId = generateErrorId();
    }
  }

  // Kullanıcı hatalarında her zaman detaylı mesaj göster
  if (
    error.category === 'USER_ERROR' ||
    error.category === 'VALIDATION_ERROR' ||
    error.category === 'AUTHENTICATION_ERROR' ||
    error.category === 'AUTHORIZATION_ERROR'
  ) {
    response.error = error.message;
  }

  return response;
}

function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Middleware wrapper for async functions
function asyncErrorHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Request ID middleware (opsiyonel)
function addRequestId(req: Request, res: Response, next: NextFunction): void {
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] = generateRequestId();
  }
  res.setHeader('x-request-id', req.headers['x-request-id']);
  next();
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export {
  appErrorHandler,
  asyncErrorHandler,
  addRequestId,
  classifyAndTransformError,
  prepareErrorResponse,
};
