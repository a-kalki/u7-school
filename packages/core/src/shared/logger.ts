/**
 * Уровни логирования.
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/** Запись лога */
export interface LogEntry {
  level: LogLevel;
  message: string;
  source: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

/**
 * Интерфейс логгера.
 * Все реализации должны удовлетворять этому контракту.
 */
export interface Logger {
  debug(source: string, message: string, meta?: Record<string, unknown>): void;
  info(source: string, message: string, meta?: Record<string, unknown>): void;
  warn(source: string, message: string, meta?: Record<string, unknown>): void;
  error(source: string, message: string, meta?: Record<string, unknown>): void;

  /** Установить минимальный уровень логирования */
  setLogLevel(level: LogLevel): void;

  /** Получить текущий уровень */
  getLogLevel(): LogLevel;

  /**
   * Установить минимальный уровень для конкретного источника.
   * Если не задан, используется глобальный уровень.
   */
  setSourceLevel(source: string, level: LogLevel): void;
}

/** Парсит строковое представление уровня */
export function parseLogLevel(value: string): LogLevel | undefined {
  const map: Record<string, LogLevel> = {
    debug: LogLevel.DEBUG,
    info: LogLevel.INFO,
    warn: LogLevel.WARN,
    error: LogLevel.ERROR,
    all: LogLevel.DEBUG,
  };
  return map[value.toLowerCase()];
}
