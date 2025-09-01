import {
  ILoggerProvider,
  LogLevel,
} from '../../../infrastructure/logging/ILoggerProvider';

export class FakeLoggerProvider implements ILoggerProvider {
  info(message: string, meta?: any): void {
    // Test ortamında hiçbir şey yapma
  }

  error(message: string, meta?: any): void {
    // Test ortamında hiçbir şey yapma
  }

  warn(message: string, meta?: any): void {
    // Test ortamında hiçbir şey yapma
  }

  debug(message: string, meta?: any): void {
    // Test ortamında hiçbir şey yapma
  }

  trace(message: string, meta?: any): void {
    // Test ortamında hiçbir şey yapma
  }

  fatal(message: string, meta?: any): void {
    // Test ortamında hiçbir şey yapma
  }

  log(level: string, message: string, meta?: any): void {
    // Test ortamında hiçbir şey yapma
  }

  setLevel(level: LogLevel): void {
    // Test ortamında hiçbir şey yapma
  }

  getLevel(): LogLevel {
    return 'info';
  }

  isEnabled(): boolean {
    return true;
  }

  isLevelEnabled(level: string): boolean {
    return true;
  }

  addContext(key: string, value: any): void {
    // Test ortamında hiçbir şey yapma
  }

  removeContext(key: string): void {
    // Test ortamında hiçbir şey yapma
  }

  clearContext(key: string): void {
    // Test ortamında hiçbir şey yapma
  }

  createChildLogger(context: Record<string, any>): ILoggerProvider {
    return this;
  }
}
