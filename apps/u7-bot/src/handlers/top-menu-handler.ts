import type { OnboardingController } from '@u7/onboarding';
import type { UserFacade } from '@u7/user/domain';
import type { Bot } from 'grammy';
import type { BotConfig } from '../config';
import type { BotContext } from '../context';
import { executeResponses } from '../ui-utils';

/**
 * Регистрирует обработчиков верхнего меню.
 * - /start: главное меню (бот рендерит сам)
 * - /link-to-school-group: приглашение в группу
 * - /start-onboarding: вход в анкету
 */
export function registerTopMenuHandler(
  bot: Bot<BotContext>,
  userFacade: UserFacade,
  controller: OnboardingController,
  config: BotConfig,
) {
  bot.command('start', async (ctx) => {
    const telegramId = ctx.from?.id;
    const name = ctx.from?.first_name || 'Гость';

    if (!telegramId) {
      await ctx.reply('Не удалось определить ваш Telegram ID.');
      return;
    }

    try {
      await userFacade.registerGuest(telegramId, name, config.botAdminUuid);
    } catch (err) {
      console.error('Ошибка registerGuest:', err);
    }

    ctx.session.menu = 'main';

    await ctx.reply(
      [
        `Привет, ${name}! 👋`,
        '',
        '🔗 /link-to-school-group — присоединяйся к группе, чтобы быть в курсе новостей, читать отзывы и общаться со студентами',
        '📝 /start-onboarding — заполни анкету, расскажи о своих целях и ожиданиях от обучения',
      ].join('\n'),
    );
  });

  bot.command('link-to-school-group', async (ctx) => {
    await ctx.reply(
      `Присоединяйся к нашей новостной группе:\n${config.newsGroupUrl}`,
    );
  });

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
