import { ILoggerProvider } from '../../../infrastructure/logging/ILoggerProvider';

export class FakeLoggerProvider implements ILoggerProvider {
  info(message: string, meta?: any) {}
  warn(message: string, meta?: any) {}
  error(message: string, meta?: any) {}
  debug(message: string, meta?: any) {}
} 