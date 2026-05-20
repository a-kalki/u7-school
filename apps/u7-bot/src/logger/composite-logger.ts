import { type Logger, LogLevel } from '@u7-scl/core/shared';

/**
 * Составной логгер — пробрасывает вызовы всем зарегистрированным логгерам.
 */
export class CompositeLogger implements Logger {
  readonly #loggers: Logger[];

  constructor(loggers: Logger[]) {
    this.#loggers = loggers;
  }

  addLogger(logger: Logger): void {
    this.#loggers.push(logger);
  }

  setLogLevel(level: LogLevel): void {
    for (const l of this.#loggers) {
      l.setLogLevel(level);
    }
  }

  setSourceLevel(source: string, level: LogLevel): void {
    for (const l of this.#loggers) {
      l.setSourceLevel(source, level);
    }
  }

  getLogLevel(): LogLevel {
    // Возвращаем минимальный из всех
    let min = LogLevel.ERROR;
    for (const l of this.#loggers) {
      const lvl = l.getLogLevel();
      if (lvl < min) min = lvl;
    }
    return min;
  }

  debug(source: string, message: string, meta?: Record<string, unknown>): void {
    for (const l of this.#loggers) l.debug(source, message, meta);
  }

  info(source: string, message: string, meta?: Record<string, unknown>): void {
    for (const l of this.#loggers) l.info(source, message, meta);
  }

  warn(source: string, message: string, meta?: Record<string, unknown>): void {
    for (const l of this.#loggers) l.warn(source, message, meta);
  }

  error(source: string, message: string, meta?: Record<string, unknown>): void {
    for (const l of this.#loggers) l.error(source, message, meta);
  }
}
