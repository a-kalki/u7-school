import type { Logger } from '@u7-scl/core/shared';
import type { OnboardingController } from '@u7-scl/onboarding';
import type { UserFacade } from '@u7-scl/user/domain';
import type { Bot } from 'grammy';
import type { BotConfig } from '../config';
import type { BotContext } from '../context';
import { executeResponses } from '../ui-utils';

/**
 * Регистрирует обработчиков верхнего меню.
 * - /start: главное меню (бот рендерит сам)
 * - /link_to_school_group: приглашение в группу
 * - /start_onboarding: вход в анкету
 */
export function registerTopMenuHandler(
  bot: Bot<BotContext>,
  userFacade: UserFacade,
  controller: OnboardingController,
  config: BotConfig,
  logger: Logger,
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
      logger.error('top-menu', 'Ошибка registerGuest', {
        error: String(err),
        telegramId,
      });
    }

    ctx.session.menu = 'main';

    await ctx.reply(
      [
        `Привет, ${name}! 👋`,
        '',
        '🔗 /link_to_school_group — присоединяйся к группе, чтобы быть в курсе новостей, читать отзывы и общаться со студентами',
        '📝 /start_onboarding — заполни анкету, расскажи о своих целях и ожиданиях от обучения',
      ].join('\n'),
    );
  });

  bot.command('link_to_school_group', async (ctx) => {
    logger.info('top-menu', `Запрос ссылки на группу от ${ctx.from?.id}`);
    await ctx.reply(
      `Присоединяйся к нашей новостной группе:\n${config.newsGroupUrl}`,
    );
  });

  bot.command('start_onboarding', async (ctx) => {
    const telegramId = ctx.from?.id;
    const name = ctx.from?.first_name || 'User';

    if (!telegramId) {
      await ctx.reply('Не удалось определить пользователя.');
      return;
    }

    ctx.session.menu = 'onboarding';

    try {
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
    } catch (err) {
      logger.error('top-menu', 'Ошибка start_onboarding', {
        error: String(err),
        telegramId,
      });
      await ctx.reply('Произошла ошибка. Попробуйте позже.');
    }
  });
}
