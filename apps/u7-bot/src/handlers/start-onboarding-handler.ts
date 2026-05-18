import type { OnboardingController } from '@u7/onboarding';
import type { Bot } from 'grammy';
import type { BotConfig } from '../config';
import type { BotContext } from '../context';
import { executeResponses } from '../ui-utils';

/**
 * Регистрирует обработчик /start-onboarding.
 * Переключает меню в onboarding-режим и форвардит команду 'start' в контроллер.
 */
export function registerStartOnboardingHandler(
  bot: Bot<BotContext>,
  controller: OnboardingController,
  config: BotConfig,
) {
  bot.command('start-onboarding', async (ctx) => {
    const telegramId = ctx.from?.id;
    const name = ctx.from?.first_name || 'User';

    if (!telegramId) {
      await ctx.reply('Не удалось определить пользователя.');
      return;
    }

    ctx.session.menu = 'onboarding';

    const response = await controller.handleUpdate(
      {
        type: 'command',
        command: 'start',
        telegramId,
        name,
      },
      config.botAdminUuid,
    );

    await executeResponses(ctx, response);
  });
}
