import { ErrorCategory, ErrorSeverity, ErrorMetadata } from './ErrorTypes';
import { ErrorClassifier } from './ErrorClassifier';

export class ApplicationError extends Error {
  public readonly statusCode: number;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly metadata: ErrorMetadata;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    category?: ErrorCategory,
    severity?: ErrorSeverity,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'ApplicationError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Eğer category ve severity belirtilmemişse, status code'a göre otomatik belirle
    if (!category || !severity) {
      const classification = ErrorClassifier.classifyByStatusCode(statusCode);
      this.category = category || classification.category;
      this.severity = severity || classification.severity;
    } else {
      this.category = category;
      this.severity = severity;
    }

    // Metadata'yı oluştur
    this.metadata = {
      category: this.category,
      severity: this.severity,
      shouldLog: this.shouldLog(),
      shouldAlert: this.shouldAlert(),
      retryable: this.isRetryable(),
      context: {
        timestamp: new Date(),
        stack: this.stack,
      },
    };
  }

  private shouldLog(): boolean {
    return (
      this.category !== ErrorCategory.USER_ERROR ||
      this.severity === ErrorSeverity.HIGH
    );
  }

  private shouldAlert(): boolean {
    return (
      this.category === ErrorCategory.SYSTEM_ERROR &&
      this.severity === ErrorSeverity.CRITICAL
    );
  }

  private isRetryable(): boolean {
    return (
      this.category === ErrorCategory.SYSTEM_ERROR &&
      this.severity !== ErrorSeverity.CRITICAL
    );
  }

  // Factory methods for common error types
  static userError(
    message: string,
    statusCode: number = 400
  ): ApplicationError {
    return new ApplicationError(
      message,
      statusCode,
      ErrorCategory.USER_ERROR,
      ErrorSeverity.LOW
    );
  }

  static validationError(message: string): ApplicationError {
    return new ApplicationError(
      message,
      422,
      ErrorCategory.VALIDATION_ERROR,
      ErrorSeverity.LOW
    );
  }

  static authenticationError(
    message: string = 'Authentication failed'
  ): ApplicationError {
    return new ApplicationError(
      message,
      401,
      ErrorCategory.AUTHENTICATION_ERROR,
      ErrorSeverity.LOW
    );
  }

  static authorizationError(
    message: string = 'Access denied'
  ): ApplicationError {
    return new ApplicationError(
      message,
      403,
      ErrorCategory.AUTHORIZATION_ERROR,
      ErrorSeverity.LOW
    );
  }

  static businessError(
    message: string,
    statusCode: number = 400
  ): ApplicationError {
    return new ApplicationError(
      message,
      statusCode,
      ErrorCategory.BUSINESS_ERROR,
      ErrorSeverity.MEDIUM
    );
  }

  static systemError(
    message: string,
    statusCode: number = 500
  ): ApplicationError {
    return new ApplicationError(
      message,
      statusCode,
      ErrorCategory.SYSTEM_ERROR,
      ErrorSeverity.CRITICAL,
      false
    );
  }

  static notFoundError(
    message: string = 'Resource not found'
  ): ApplicationError {
    return new ApplicationError(
      message,
      404,
      ErrorCategory.USER_ERROR,
      ErrorSeverity.LOW
    );
  }

  static conflictError(
    message: string = 'Resource conflict'
  ): ApplicationError {
    return new ApplicationError(
      message,
      409,
      ErrorCategory.BUSINESS_ERROR,
      ErrorSeverity.MEDIUM
    );
  }

  static tooManyRequestsError(
    message: string = 'Too many requests'
  ): ApplicationError {
    return new ApplicationError(
      message,
      429,
      ErrorCategory.USER_ERROR,
      ErrorSeverity.LOW
    );
  }

  static internalServerError(
    message: string = 'Internal server error'
  ): ApplicationError {
    return new ApplicationError(
      message,
      500,
      ErrorCategory.SYSTEM_ERROR,
      ErrorSeverity.CRITICAL,
      false
    );
  }

  static serviceUnavailableError(
    message: string = 'Service unavailable'
  ): ApplicationError {
    return new ApplicationError(
      message,
      503,
      ErrorCategory.SYSTEM_ERROR,
      ErrorSeverity.HIGH,
      false
    );
  }

  // Database error factory methods
  static databaseError(message: string, originalError?: any): ApplicationError {
    const error = new ApplicationError(
      message,
      500,
      ErrorCategory.SYSTEM_ERROR,
      ErrorSeverity.HIGH,
      false
    );

    if (originalError) {
      error.metadata.context.additionalData = {
        originalError: originalError.message,
      };
    }

    return error;
  }

  static duplicateKeyError(field: string): ApplicationError {
    return new ApplicationError(
      `${field} already exists`,
      409,
      ErrorCategory.VALIDATION_ERROR,
      ErrorSeverity.LOW
    );
  }

  static foreignKeyError(
    message: string = 'Referenced resource not found'
  ): ApplicationError {
    return new ApplicationError(
      message,
      400,
      ErrorCategory.VALIDATION_ERROR,
      ErrorSeverity.LOW
    );
  }

  // Network error factory methods
  static networkError(
    message: string = 'Network error occurred'
  ): ApplicationError {
    return new ApplicationError(
      message,
      503,
      ErrorCategory.SYSTEM_ERROR,
      ErrorSeverity.HIGH,
      false
    );
  }

  static timeoutError(message: string = 'Request timeout'): ApplicationError {
    return new ApplicationError(
      message,
      408,
      ErrorCategory.SYSTEM_ERROR,
      ErrorSeverity.MEDIUM,
      false
    );
  }

  // Utility methods
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      category: this.category,
      severity: this.severity,
      isOperational: this.isOperational,
      timestamp: this.metadata.context.timestamp,
    };
  }

  // Backward compatibility with existing CustomError
  static fromCustomError(customError: any): ApplicationError {
    return new ApplicationError(
      customError.message,
      customError.statusCode,
      undefined,
      undefined,
      true
    );
  }
}
