import { ILoggerProvider, LogLevel } from '../../../infrastructure/logging/ILoggerProvider';

export class FakeLoggerProvider implements ILoggerProvider {
  info = jest.fn();
  warn = jest.fn();
  error = jest.fn();
  debug = jest.fn();
  trace = jest.fn();
  fatal = jest.fn();
  isEnabled = jest.fn().mockReturnValue(true);
  setLevel = jest.fn();
  getLevel = jest.fn().mockReturnValue('info' as LogLevel);
}
