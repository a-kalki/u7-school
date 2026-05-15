import { conversations } from '@grammyjs/conversations';
import type { OnboardingBotApp, OnboardingController } from '@u7/onboarding';
import { Bot, session } from 'grammy';
import type { BotConfig } from './config';
import type { BotContext } from './context';
import { JsonSessionStorage } from './session-storage';

/**
 * Фабрика создания Grammy-бота с session и conversations.
 */
export function createBot(
  config: BotConfig,
  _controller: OnboardingController,
  _apiApp: OnboardingBotApp,
) {
  const bot = new Bot<BotContext>(config.botToken);

  const storage = new JsonSessionStorage(`${config.dbDir}/bot/session.json`);

  bot.use(
    session({
      initial: () => ({}),
      storage,
    }),
  );

  bot.use(conversations());

  return bot;
}
