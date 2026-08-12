import { Bot, session } from 'grammy';
import type { BotContext, SessionData } from './context';

/**
 * Фабрика создания Grammy-бота.
 *
 * @param token — Telegram Bot API токен.
 *               Для основного бота — BOT_TOKEN.
 *               Для TelegramLogger — LOGGER_BOT_TOKEN.
 * @param sessionMap — общий Map для хранения сессий (ключ: telegramId).
 *                     Передаётся в Grammy session middleware как storage.
 *                     Может использоваться извне для чтения/записи сессий.
 */
export function createBot(
  token: string,
  sessionMap?: Map<number, SessionData>,
) {
  const bot = new Bot<BotContext>(token);

  // ══ Session middleware ══
  const storage = sessionMap
    ? {
        read: (key: string) => {
          const id = Number.parseInt(key, 10);
          return Promise.resolve(sessionMap.get(id) ?? undefined);
        },
        write: (key: string, value: SessionData) => {
          const id = Number.parseInt(key, 10);
          sessionMap.set(id, value);
          return Promise.resolve();
        },
        delete: (key: string) => {
          const id = Number.parseInt(key, 10);
          sessionMap.delete(id);
          return Promise.resolve();
        },
      }
    : undefined;

  bot.use(
    session({
      initial: (): SessionData => ({ activeHandler: null }),
      storage: storage as never,
    }),
  );

  return bot;
}
