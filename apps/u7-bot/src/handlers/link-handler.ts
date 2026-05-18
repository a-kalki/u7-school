import type { Bot } from 'grammy';
import type { BotConfig } from '../config';
import type { BotContext } from '../context';

/**
 * Регистрирует обработчик /link-to-school-group.
 * Отправляет ссылку на новостную группу — без контроллера.
 */
export function registerLinkHandler(
  bot: Bot<BotContext>,
  config: BotConfig,
) {
  bot.command('link-to-school-group', async (ctx) => {
    await ctx.reply(
      `Присоединяйся к нашей новостной группе:\n${config.newsGroupUrl}`,
    );
  });
}
