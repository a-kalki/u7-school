import { LogLevel, type Logger } from './logger';

const LEVEL_LABELS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
};

/**
 * Логгер в консоль.
 * Использует console.log / console.warn / console.error.
 */
export class ConsoleLogger implements Logger {
  #level: LogLevel = LogLevel.DEBUG;

  setLogLevel(level: LogLevel): void {
    this.#level = level;
  }

  getLogLevel(): LogLevel {
    return this.#level;
  }

  debug(source: string, message: string, meta?: Record<string, unknown>): void {
    this.#log(LogLevel.DEBUG, source, message, meta);
  }

  info(source: string, message: string, meta?: Record<string, unknown>): void {
    this.#log(LogLevel.INFO, source, message, meta);
  }

  warn(source: string, message: string, meta?: Record<string, unknown>): void {
    this.#log(LogLevel.WARN, source, message, meta);
  }

  error(source: string, message: string, meta?: Record<string, unknown>): void {
    this.#log(LogLevel.ERROR, source, message, meta);
  }

  #log(level: LogLevel, source: string, message: string, meta?: Record<string, unknown>): void {
    if (level < this.#level) return;

    const ts = new Date().toISOString();
    const label = LEVEL_LABELS[level];
    const prefix = `[${ts}] [${label}] [${source}]`;
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';

    if (level >= LogLevel.ERROR) {
      console.error(prefix, message, metaStr);
    } else if (level >= LogLevel.WARN) {
      console.warn(prefix, message, metaStr);
    } else {
      console.log(prefix, message, metaStr);
    }
  }
}
