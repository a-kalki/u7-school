import { Bot, session } from 'grammy';
import type { BotContext } from './context';

/**
 * Фабрика создания Grammy-бота.
 *
 * @param token — Telegram Bot API токен.
 *               Для основного бота — BOT_TOKEN.
 *               Для TelegramLogger — LOGGER_BOT_TOKEN.
 */
export function createBot(token: string) {
  const bot = new Bot<BotContext>(token);

  // ══ Session middleware ══
  bot.use(
    session({
      initial: (): { menu: 'main' | 'onboarding' } => ({ menu: 'main' }),
    }),
  );

  return bot;
}
