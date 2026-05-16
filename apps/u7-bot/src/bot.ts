import type { OnboardingBotApp, OnboardingController } from '@u7/onboarding';
import { Bot } from 'grammy';
import type { BotConfig } from './config';
import type { BotContext } from './context';
import { executeResponses } from './ui-utils';

/**
 * Фабрика создания Grammy-бота.
 */
export function createBot(
  config: BotConfig,
  controller: OnboardingController,
  _apiApp: OnboardingBotApp,
) {
  const bot = new Bot<BotContext>(config.botToken);

  // Глобальный фильтр для приватных чатов
  bot.filter((ctx) => ctx.chat?.type === 'private');

  // Обработка всех сообщений (текстовых), которые не команды
  bot.on('message:text', async (ctx, next) => {
    if (ctx.message.text.startsWith('/')) return next();

    const response = await controller.handleUpdate({
      type: 'message',
      text: ctx.message.text,
      telegramId: ctx.from.id,
      name: ctx.from.first_name,
    });

    if (response.editMessage || response.sendMessage) {
      await executeResponses(ctx, response);
    } else {
      await next();
    }
  });

  // Обработка всех callback-ов, которые не обработаны другими хендлерами
  bot.on('callback_query:data', async (ctx, next) => {
    const response = await controller.handleUpdate({
      type: 'callback',
      data: ctx.callbackQuery.data,
      telegramId: ctx.from.id,
      messageId: ctx.callbackQuery.message?.message_id || 0,
    });

    if (response.editMessage || response.sendMessage) {
      await ctx.answerCallbackQuery().catch(() => {});
      await executeResponses(ctx, response);
    } else {
      await next();
    }
  });

  return bot;
}
