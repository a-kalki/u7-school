import type { OnboardingController } from '@u7/onboarding';
import type { Bot } from 'grammy';
import { InlineKeyboard } from 'grammy';
import type { BotConfig } from '../config';
import type { BotContext } from '../context';

/**
 * Регистрирует обработчик /cancel.
 */
export function registerCancelHandler(
  bot: Bot<BotContext>,
  controller: OnboardingController,
  config: BotConfig,
) {
  bot.command('cancel', async (ctx) => {
    const uuid = ctx.session.questionnaireUuid;
    if (uuid) {
      await controller.abandon(uuid, config.botAdminUuid);
      ctx.session.questionnaireUuid = undefined;
      ctx.session.selectedAnswers = {};
    }

    await ctx.reply('Опросник прерван. Данные удалены.', {
      reply_markup: new InlineKeyboard().text('В меню', 'menu'),
    });
  });
}
