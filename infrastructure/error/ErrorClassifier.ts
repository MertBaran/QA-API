import { ErrorCategory, ErrorSeverity } from './ErrorTypes';
import type { ErrorMetadata, ErrorContext } from './ErrorTypes';

export class ErrorClassifier {
  public static classifyByStatusCode(statusCode: number): {
    category: ErrorCategory;
    severity: ErrorSeverity;
  } {
    if (statusCode >= 400 && statusCode < 500) {
      if (statusCode === 401) {
        return {
          category: ErrorCategory.AUTHENTICATION_ERROR,
          severity: ErrorSeverity.LOW,
        };
      }
      if (statusCode === 403) {
        return {
          category: ErrorCategory.AUTHORIZATION_ERROR,
          severity: ErrorSeverity.LOW,
        };
      }
      if (statusCode === 422) {
        return {
          category: ErrorCategory.VALIDATION_ERROR,
          severity: ErrorSeverity.LOW,
        };
      }
      return {
        category: ErrorCategory.USER_ERROR,
        severity: ErrorSeverity.LOW,
      };
    }

    if (statusCode >= 500) {
      return {
        category: ErrorCategory.SYSTEM_ERROR,
        severity: ErrorSeverity.CRITICAL,
      };
    }

    return {
      category: ErrorCategory.BUSINESS_ERROR,
      severity: ErrorSeverity.MEDIUM,
    };
  }

  private static classifyByErrorName(errorName: string): {
    category: ErrorCategory;
    severity: ErrorSeverity;
  } {
    const errorMap: Record<
      string,
      { category: ErrorCategory; severity: ErrorSeverity }
    > = {
      ValidationError: {
        category: ErrorCategory.VALIDATION_ERROR,
        severity: ErrorSeverity.LOW,
      },
      CastError: {
        category: ErrorCategory.VALIDATION_ERROR,
        severity: ErrorSeverity.LOW,
      },
      SyntaxError: {
        category: ErrorCategory.USER_ERROR,
        severity: ErrorSeverity.LOW,
      },
      ReferenceError: {
        category: ErrorCategory.SYSTEM_ERROR,
        severity: ErrorSeverity.CRITICAL,
      },
      TypeError: {
        category: ErrorCategory.SYSTEM_ERROR,
        severity: ErrorSeverity.HIGH,
      },
      RangeError: {
        category: ErrorCategory.SYSTEM_ERROR,
        severity: ErrorSeverity.HIGH,
      },
      URIError: {
        category: ErrorCategory.USER_ERROR,
        severity: ErrorSeverity.LOW,
      },
      EvalError: {
        category: ErrorCategory.SYSTEM_ERROR,
        severity: ErrorSeverity.CRITICAL,
      },
    };

    return (
      errorMap[errorName] || {
        category: ErrorCategory.BUSINESS_ERROR,
        severity: ErrorSeverity.MEDIUM,
      }
    );
  }

  private static classifyByErrorCode(errorCode: number): {
    category: ErrorCategory;
    severity: ErrorSeverity;
  } {
    const codeMap: Record<
      string | number,
      { category: ErrorCategory; severity: ErrorSeverity }
    > = {
      11000: {
        category: ErrorCategory.VALIDATION_ERROR,
        severity: ErrorSeverity.LOW,
      }, // MongoDB duplicate key
      121: {
        category: ErrorCategory.VALIDATION_ERROR,
        severity: ErrorSeverity.LOW,
      }, // PostgreSQL unique violation
      23505: {
        category: ErrorCategory.VALIDATION_ERROR,
        severity: ErrorSeverity.LOW,
      }, // PostgreSQL unique constraint
      23503: {
        category: ErrorCategory.VALIDATION_ERROR,
        severity: ErrorSeverity.LOW,
      }, // PostgreSQL foreign key
      42703: {
        category: ErrorCategory.SYSTEM_ERROR,
        severity: ErrorSeverity.HIGH,
      }, // PostgreSQL undefined column
      '42P01': {
        category: ErrorCategory.SYSTEM_ERROR,
        severity: ErrorSeverity.HIGH,
      }, // PostgreSQL undefined table
    };

    return (
      codeMap[errorCode] || {
        category: ErrorCategory.BUSINESS_ERROR,
        severity: ErrorSeverity.MEDIUM,
      }
    );
  }

  public static classifyError(
    error: any,
    context: ErrorContext
  ): ErrorMetadata {
    let category: ErrorCategory;
    let severity: ErrorSeverity;

    // Önce status code'a göre sınıflandır
    if (error.statusCode) {
      const classification = this.classifyByStatusCode(error.statusCode);
      category = classification.category;
      severity = classification.severity;
    }
    // Sonra error name'e göre sınıflandır
    else if (error.name) {
      const classification = this.classifyByErrorName(error.name);
      category = classification.category;
      severity = classification.severity;
    }
    // Son olarak error code'a göre sınıflandır
    else if (error.code) {
      const classification = this.classifyByErrorCode(error.code);
      category = classification.category;
      severity = classification.severity;
    }
    // Varsayılan olarak business error
    else {
      category = ErrorCategory.BUSINESS_ERROR;
      severity = ErrorSeverity.MEDIUM;
    }

    // Loglama ve alert kuralları
    const shouldLog =
      category !== ErrorCategory.USER_ERROR || severity === ErrorSeverity.HIGH;
    const shouldAlert =
      category === ErrorCategory.SYSTEM_ERROR &&
      severity === ErrorSeverity.CRITICAL;
    const retryable =
      category === ErrorCategory.SYSTEM_ERROR &&
      severity !== ErrorSeverity.CRITICAL;

    return {
      category,
      severity,
      shouldLog,
      shouldAlert,
      retryable,
      context,
    };
  }

  static isUserError(metadata: ErrorMetadata): boolean {
    return [
      ErrorCategory.USER_ERROR,
      ErrorCategory.VALIDATION_ERROR,
      ErrorCategory.AUTHENTICATION_ERROR,
      ErrorCategory.AUTHORIZATION_ERROR,
    ].includes(metadata.category);
  }

  static isSystemError(metadata: ErrorMetadata): boolean {
    return metadata.category === ErrorCategory.SYSTEM_ERROR;
  }

  static shouldLogError(metadata: ErrorMetadata): boolean {
    return metadata.shouldLog;
  }

  static shouldAlertError(metadata: ErrorMetadata): boolean {
    return metadata.shouldAlert;
  }
}
