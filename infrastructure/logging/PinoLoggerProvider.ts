import { injectable } from 'tsyringe';
import pino, { Logger } from 'pino';
import { ILoggerProvider, LogLevel } from './ILoggerProvider';

@injectable()
export class PinoLoggerProvider implements ILoggerProvider {
  private logger: Logger;

  constructor() {
    this.logger = pino({
      level: 'debug',
      timestamp: pino.stdTimeFunctions.isoTime,
      formatters: {
        level(label) {
          return { level: label };
        },
        bindings(bindings) {
          return { pid: bindings['pid'], hostname: bindings['hostname'] };
        },
        log(object) {
          // context ve meta'yı ayrı alanlarda göster
          const { context, meta, ...rest } = object;
          return {
            ...rest,
            ...(context ? { context } : {}),
            ...(meta ? { meta } : {}),
          };
        },
      },
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    });
  }

  info(message: string, meta?: any, context?: string) {
    this.logger.info({ meta, context }, message);
  }
  warn(message: string, meta?: any, context?: string) {
    this.logger.warn({ meta, context }, message);
  }
  error(message: string, meta?: any, context?: string) {
    // Hata objesi varsa stack trace'i de ekle
    if (meta instanceof Error) {
      const { message: _msg, ...restMeta } = meta;
      this.logger.error(
        {
          meta: {
            stack: meta.stack,
            ...restMeta,
          },
          context,
        },
        message
      );
    } else {
      this.logger.error({ meta, context }, message);
    }
  }
  debug(message: string, meta?: any, context?: string) {
    this.logger.debug({ meta, context }, message);
  }

  trace(message: string, meta?: any, context?: string) {
    this.logger.trace({ meta, context }, message);
  }

  fatal(message: string, meta?: any, context?: string) {
    this.logger.fatal({ meta, context }, message);
  }

  isEnabled(): boolean {
    return true; // Pino her zaman enabled
  }

  setLevel(level: LogLevel): void {
    // Pino'da runtime'da level değiştirme desteklenmiyor
    console.warn('setLevel is not supported in Pino at runtime');
  }

  getLevel(): LogLevel {
    return 'debug'; // Constructor'da set edilen level
  }
}
