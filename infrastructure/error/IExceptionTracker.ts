export interface IExceptionTracker {
  // Exception/Error tracking
  captureException(error: Error, context?: Record<string, any>): void;
  captureMessage(
    message: string,
    level?: ExceptionLevel,
    context?: Record<string, any>
  ): void;

  // Context yönetimi
  setUser(user: { id: string; email?: string; username?: string }): void;
  setTag(key: string, value: string): void;
  setContext(name: string, context: Record<string, any>): void;
  addBreadcrumb(breadcrumb: ExceptionBreadcrumb): void;

  // Performance monitoring
  startTransaction(name: string, operation?: string): ExceptionTransaction;
  startSpan(name: string, operation?: string): ExceptionSpan;

  // Utility
  isEnabled(): boolean;
}

export type ExceptionLevel = 'debug' | 'info' | 'warning' | 'error' | 'fatal';

export interface ExceptionBreadcrumb {
  category: string;
  message: string;
  data?: Record<string, any>;
  level?: ExceptionLevel;
  timestamp?: number;
}

export interface ExceptionTransaction {
  setHttpStatus(statusCode: number): void;
  setTag(key: string, value: string): void;
  setData(key: string, value: any): void;
  finish(): void;
}

export interface ExceptionSpan {
  setTag(key: string, value: string): void;
  setData(key: string, value: any): void;
  finish(): void;
}
