import { IExceptionTracker, ExceptionLevel, ExceptionBreadcrumb, ExceptionTransaction, ExceptionSpan } from '../../../infrastructure/error/IExceptionTracker';

export class FakeExceptionTracker implements IExceptionTracker {
  captureException = jest.fn();
  captureMessage = jest.fn();
  setUser = jest.fn();
  setTag = jest.fn();
  setContext = jest.fn();
  addBreadcrumb = jest.fn();
  startTransaction = jest.fn().mockReturnValue({
    setHttpStatus: jest.fn(),
    setTag: jest.fn(),
    setData: jest.fn(),
    finish: jest.fn(),
  });
  startSpan = jest.fn().mockReturnValue({
    setTag: jest.fn(),
    setData: jest.fn(),
    finish: jest.fn(),
  });
  isEnabled = jest.fn().mockReturnValue(true);
} 