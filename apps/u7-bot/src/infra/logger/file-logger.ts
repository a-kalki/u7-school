import { appendFileSync, writeFileSync } from 'node:fs';
import { type Logger, LogLevel, now } from '@u7-scl/core/shared';

const LEVEL_LABELS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
};

/**
 * Логгер в файл для dev-режима и отладки.
 * Очищает файл при инициализации и мгновенно дописывает строки.
 */
export class FileLogger implements Logger {
  readonly #filePath: string;
  #level: LogLevel = LogLevel.DEBUG;
  readonly #sourceLevels = new Map<string, LogLevel>();

  constructor(filePath: string) {
    this.#filePath = filePath;
    try {
      writeFileSync(this.#filePath, '', 'utf-8');
    } catch {
      // Игнорируем ошибку очистки, если путь пока недоступен
    }
  }

  setLogLevel(level: LogLevel): void {
    this.#level = level;
  }

  getLogLevel(): LogLevel {
    return this.#level;
  }

  setSourceLevel(source: string, level: LogLevel): void {
    this.#sourceLevels.set(source, level);
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

  #getEffectiveLevel(source: string): LogLevel {
    return this.#sourceLevels.get(source) ?? this.#level;
  }

  #log(
    level: LogLevel,
    source: string,
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    if (level < this.#getEffectiveLevel(source)) return;

    const ts = now().toISOString();
    const label = LEVEL_LABELS[level];
    const metaStr = meta ? `  ${JSON.stringify(meta)}` : '';
    const line = `[${ts}] [${label}] [${source}] ${message}${metaStr}\n`;

    try {
      appendFileSync(this.#filePath, line, 'utf-8');
    } catch {
      // Ошибки записи в лог-файл не должны ронять приложение
    }
  }
}
