import { Bot } from 'grammy';
import type { BotContext } from './context';

/**
 * Фабрика создания Grammy-бота.
 *
 * @param token — Telegram Bot API токен.
 *               Для основного бота — BOT_TOKEN.
 *               Для TelegramLogger — LOGGER_BOT_TOKEN.
 *
 * Сессии Grammy не используются: состоянием диалога (BotSession) владеет
 * BotTransport — Grammy-слой остаётся чистым адаптером апдейтов.
 */
export function createBot(token: string) {
  return new Bot<BotContext>(token);
}
