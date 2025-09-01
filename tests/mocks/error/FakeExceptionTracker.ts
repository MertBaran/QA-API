import {
  IExceptionTracker,
  ExceptionLevel,
  ExceptionBreadcrumb,
  ExceptionTransaction,
  ExceptionSpan,
} from '../../../infrastructure/error/IExceptionTracker';

export class FakeExceptionTracker implements IExceptionTracker {
  captureException(error: Error, context?: Record<string, any>): void {
    // Test ortamında hiçbir şey yapma
  }

  captureMessage(
    message: string,
    level?: ExceptionLevel,
    context?: Record<string, any>
  ): void {
    // Test ortamında hiçbir şey yapma
  }

  setUser(user: { id: string; email?: string; username?: string }): void {
    // Test ortamında hiçbir şey yapma
  }

  setTag(key: string, value: string): void {
    // Test ortamında hiçbir şey yapma
  }

  setContext(name: string, context: Record<string, any>): void {
    // Test ortamında hiçbir şey yapma
  }

  addBreadcrumb(breadcrumb: ExceptionBreadcrumb): void {
    // Test ortamında hiçbir şey yapma
  }

  startTransaction(name: string, operation?: string): ExceptionTransaction {
    return {
      setHttpStatus: () => {},
      setTag: () => {},
      setData: () => {},
      finish: () => {},
    };
  }

  startSpan(name: string, operation?: string): ExceptionSpan {
    return {
      setTag: () => {},
      setData: () => {},
      finish: () => {},
    };
  }

  isEnabled(): boolean {
    return false; // Test ortamında disabled
  }
}
