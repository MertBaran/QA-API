export interface ILoggerProvider {
  // Temel loglama metotları
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
  trace(message: string, meta?: Record<string, any>): void;
  fatal(message: string, meta?: Record<string, any>): void;

  // Utility metotları
  isEnabled(): boolean;
  setLevel(level: LogLevel): void;
  getLevel(): LogLevel;
}

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
