import { Bot, session } from 'grammy';
import type { BotConfig } from './config';
import type { BotContext } from './context';

/**
 * Фабрика создания Grammy-бота.
 * Бот — чистый мост Telegram ↔ Контроллер.
 */
export function createBot(config: BotConfig) {
  const bot = new Bot<BotContext>(config.botToken);

  // ══ Session middleware ══
  bot.use(
    session({
      initial: (): { menu: 'main' | 'onboarding' } => ({ menu: 'main' }),
    }),
  );

  // ══ Только приватные чаты ══
  bot.filter((ctx) => ctx.chat?.type === 'private');

  return bot;
}
