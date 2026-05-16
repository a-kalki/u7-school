import type { OnboardingController } from '@u7/onboarding';
import type { Bot } from 'grammy';
import type { BotConfig } from '../config';
import type { BotContext } from '../context';
import { executeResponses } from '../ui-utils';

/**
 * Регистрирует обработчик /cancel.
 */
export function registerCancelHandler(
  bot: Bot<BotContext>,
  controller: OnboardingController,
  _config: BotConfig,
) {
  bot.command('cancel', async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.reply('Не удалось определить пользователя.');
      return;
    }

    const response = await controller.handleUpdate({
      type: 'command',
      command: 'cancel',
      telegramId,
      name: ctx.from?.first_name || 'User',
    });

    await executeResponses(ctx, response);
  });
}
