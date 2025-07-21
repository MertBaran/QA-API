import { ILoggerProvider } from '../../../infrastructure/logging/ILoggerProvider';

export class FakeLoggerProvider implements ILoggerProvider {
  log = jest.fn();
  info = jest.fn();
  warn = jest.fn();
  error = jest.fn();
  debug = jest.fn();
}
