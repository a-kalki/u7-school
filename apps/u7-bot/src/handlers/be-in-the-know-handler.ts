import type { Bot } from 'grammy';
import { InlineKeyboard } from 'grammy';
import type { BotConfig } from '../config';
import type { BotContext } from '../context';

/**
 * Регистрирует обработчик «Быть в курсе».
 */
export function registerBeInTheKnowHandler(
  bot: Bot<BotContext>,
  config: BotConfig,
) {
  bot.callbackQuery('be_in_the_know', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `Присоединяйся к нашей новостной группе:\n${config.newsGroupUrl}`,
      {
        reply_markup: new InlineKeyboard().text('Вернуться в меню', 'menu'),
      },
    );
  });
}
