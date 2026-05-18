import { LogLevel, type Logger } from '@u7/core/shared';
import type { Bot } from 'grammy';
import type { BotContext } from '../context';

const LEVEL_EMOJI: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '🔍',
  [LogLevel.INFO]: 'ℹ️',
  [LogLevel.WARN]: '⚠️',
  [LogLevel.ERROR]: '🚨',
};

const LEVEL_LABEL: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'ПРЕДУПРЕЖДЕНИЕ',
  [LogLevel.ERROR]: 'КРИТИЧЕСКАЯ ОШИБКА',
};

/** Источники, для которых INFO отправляется в Telegram */
const TOP_LEVEL_SOURCES: string[] = [];
// По умолчанию пусто — администратор явно добавляет источники через setSourceLevel.

/**
 * Логгер, отправляющий сообщения администраторам бота в Telegram.
 *
 * - WARN, ERROR — отправляются со всех источников
 * - INFO — только от top-level источников (top-menu, api-app)
 * - DEBUG — не отправляется
 *
 * Per-source уровни можно переопределить через setSourceLevel.
 */
export class TelegramLogger implements Logger {
  readonly #bot: Bot<BotContext>;
  readonly #adminIds: number[];
  #level: LogLevel = LogLevel.WARN; // по умолчанию — только WARN/ERROR; INFO — per-source
  readonly #sourceLevels = new Map<string, LogLevel>();

  constructor(bot: Bot<BotContext>, adminIds: number[]) {
    this.#bot = bot;
    this.#adminIds = adminIds;

    // По умолчанию: INFO только от top-level источников
    for (const src of TOP_LEVEL_SOURCES) {
      this.#sourceLevels.set(src, LogLevel.INFO);
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

  debug(
    _source: string,
    _message: string,
    _meta?: Record<string, unknown>,
  ): void {
    // Не отправляем DEBUG в Telegram
  }

  info(
    source: string,
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    if (LogLevel.INFO < this.#effectiveLevel(source)) return;
    this.#send(LogLevel.INFO, source, message, meta);
  }

  warn(
    source: string,
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    if (LogLevel.WARN < this.#effectiveLevel(source)) return;
    this.#send(LogLevel.WARN, source, message, meta);
  }

  error(
    source: string,
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    if (LogLevel.ERROR < this.#effectiveLevel(source)) return;
    this.#send(LogLevel.ERROR, source, message, meta);
  }

  #effectiveLevel(source: string): LogLevel {
    return this.#sourceLevels.get(source) ?? this.#level;
  }

  #send(
    level: LogLevel,
    source: string,
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    const emoji = LEVEL_EMOJI[level];
    const label = LEVEL_LABEL[level];
    const fullMessage = [
      `${emoji} <b>${this.#escapeHtml(label)}</b>`,
      `<b>Источник:</b> <code>${this.#escapeHtml(source)}</code>`,
      `<b>Сообщение:</b> ${this.#escapeHtml(message)}`,
      meta ? `<b>Мета:</b> <code>${this.#escapeHtml(JSON.stringify(meta))}</code>` : '',
    ].join('\n');

    for (const adminId of this.#adminIds) {
      this.#bot.api
        .sendMessage(adminId, fullMessage, { parse_mode: 'HTML' })
        .catch((err) => {
          console.error(
            `[TelegramLogger] Не удалось отправить сообщение админу ${adminId}:`,
            err,
          );
        });
    }
  }

  #escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
