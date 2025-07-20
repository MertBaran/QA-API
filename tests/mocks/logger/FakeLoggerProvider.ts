import { ILoggerProvider } from '../../../infrastructure/logging/ILoggerProvider';

export class FakeLoggerProvider implements ILoggerProvider {
  log(_message: any, _meta?: any): void {}
  info(_message: any, _meta?: any): void {}
  warn(_message: any, _meta?: any): void {}
  error(_message: any, _meta?: any): void {}
  debug(_message: any, _meta?: any): void {}
}
