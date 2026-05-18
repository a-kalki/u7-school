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

/**
 * Логгер, отправляющий сообщения администраторам бота в Telegram.
 *
 * - INFO → отправляется (телеметрия верхнего уровня)
 * - WARN → отправляется
 * - ERROR → отправляется с пометкой КРИТИЧЕСКАЯ ОШИБКА
 * - DEBUG → не отправляется
 */
export class TelegramLogger implements Logger {
  readonly #bot: Bot<BotContext>;
  readonly #adminIds: number[];
  #level: LogLevel = LogLevel.DEBUG;

  constructor(bot: Bot<BotContext>, adminIds: number[]) {
    this.#bot = bot;
    this.#adminIds = adminIds;
  }

  setLogLevel(level: LogLevel): void {
    this.#level = level;
  }

  getLogLevel(): LogLevel {
    return this.#level;
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
    if (LogLevel.INFO < this.#level) return;
    this.#send(LogLevel.INFO, source, message, meta);
  }

  warn(
    source: string,
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    if (LogLevel.WARN < this.#level) return;
    this.#send(LogLevel.WARN, source, message, meta);
  }

  error(
    source: string,
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    if (LogLevel.ERROR < this.#level) return;
    this.#send(LogLevel.ERROR, source, message, meta);
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
      `${emoji} *${label}*`,
      `*Источник:* \`${source}\``,
      `*Сообщение:* ${message}`,
      meta ? `*Мета:* \`${JSON.stringify(meta)}\`` : '',
    ].join('\n');

    for (const adminId of this.#adminIds) {
      this.#bot.api
        .sendMessage(adminId, fullMessage, { parse_mode: 'Markdown' })
        .catch((err) => {
          console.error(
            `[TelegramLogger] Не удалось отправить сообщение админу ${adminId}:`,
            err,
          );
        });
    }
  }
}
