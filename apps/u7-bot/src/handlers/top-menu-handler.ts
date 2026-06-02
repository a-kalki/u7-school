import type { Logger } from '@u7-scl/core/shared';
import type { OnboardingController } from '@u7-scl/onboarding';
import type { StreamController } from '@u7-scl/stream/ui/bot/controller/stream-controller';
import { Role, type UserFacade } from '@u7-scl/user/domain';
import { type Composer, InlineKeyboard } from 'grammy';
import type { BotConfig } from '../config';
import type { BotContext } from '../context';
import { executeResponses } from '../ui-utils';

export function registerTopMenuHandler(
  bot: Composer<BotContext>,
  userFacade: UserFacade,
  onboardingController: OnboardingController,
  streamController: StreamController,
  config: BotConfig,
  logger: Logger,
) {
  /** Возвращает UUID пользователя по telegramId или null, если пользователь не найден */
  async function resolveUserUuid(
    telegramId: number,
  ): Promise<string | null> {
    const user = await userFacade.getUserByTelegramId(telegramId);
    return user?.uuid ?? null;
  }

  bot.command('start', async (ctx) => {
    const telegramId = ctx.from?.id;
    const name = ctx.from?.first_name || 'Гость';

    if (!telegramId) {
      await ctx.reply('Не удалось определить ваш Telegram ID.');
      return;
    }

    let userRoles: Role[] = [];
    try {
      const user = await userFacade.registerGuest(
        telegramId,
        name,
        config.botAdminUuid,
      );
      userRoles = user.roles ?? [];
    } catch (err) {
      logger.error('top-menu', 'Ошибка registerGuest', {
        error: String(err),
        telegramId,
      });
    }

    ctx.session.menu = 'main';

    const keyboard = new InlineKeyboard();
    keyboard.text('📚 Наши потоки', 'menu:streams').row();
    keyboard.text('📝 Заполнить анкету', 'menu:onboarding').row();

    if (userRoles.includes(Role.STUDENT)) {
      keyboard.text('📖 Моя учёба', 'menu:my_study').row();
    }
    if (userRoles.includes(Role.MENTOR) || userRoles.includes(Role.ADMIN)) {
      keyboard.text('🛠️ Панель ментора', 'menu:mentor').row();
    }

    keyboard.text('🏫 Школьное сообщество', 'menu:school_group').row();

    await ctx.reply(`Привет, ${name}! 👋\n\nВыберите действие:`, {
      reply_markup: keyboard,
    });
  });

  bot.command('link_to_school_group', async (ctx) => {
    logger.info('top-menu', `Запрос ссылки на группу от ${ctx.from?.id}`);
    await ctx.reply(
      `Присоединяйся к нашей новостной группе:\n${config.newsGroupUrl}`,
    );
  });

  bot.command('streams', async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const actorId = await resolveUserUuid(telegramId);
    if (!actorId) {
      await ctx.reply('Пользователь не найден. Пожалуйста, нажмите /start.');
      return;
    }

    try {
      const response = await streamController.handleUpdate(
        { type: 'command', command: 'streams', telegramId },
        actorId,
      );
      await executeResponses(ctx, response);
    } catch (err) {
      logger.error('top-menu', 'Ошибка /streams', {
        error: String(err),
        telegramId,
      });
      await ctx.reply('Произошла ошибка при получении потоков.');
    }
  });

  bot.command('my_study', async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const actorId = await resolveUserUuid(telegramId);
    if (!actorId) {
      await ctx.reply('Пользователь не найден. Пожалуйста, нажмите /start.');
      return;
    }

    try {
      const response = await streamController.handleUpdate(
        { type: 'command', command: 'my_study', telegramId },
        actorId,
      );
      await executeResponses(ctx, response);
    } catch (err) {
      logger.error('top-menu', 'Ошибка /my_study', {
        error: String(err),
        telegramId,
      });
      await ctx.reply('Произошла ошибка при получении данных об обучении.');
    }
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
      const response = await onboardingController.handleUpdate(
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

  // ── Менторская команда ──
  bot.command('mentor', async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const actorId = await resolveUserUuid(telegramId);
    if (!actorId) {
      await ctx.reply('Пользователь не найден. Пожалуйста, нажмите /start.');
      return;
    }

    try {
      const response = await streamController.handleUpdate(
        { type: 'command', command: 'mentor', telegramId },
        actorId,
      );
      await executeResponses(ctx, response);
    } catch (err) {
      logger.error('top-menu', 'Ошибка /mentor', {
        error: String(err),
        telegramId,
      });
      await ctx.reply('Произошла ошибка при получении панели ментора.');
    }
  });

  // ── Обработка callback'ов от inline-меню ──
  bot.on('callback_query:data', async (ctx, next) => {
    const data = ctx.callbackQuery.data;
    const telegramId = ctx.from?.id;
    const messageId = ctx.callbackQuery.message?.message_id;

    if (!telegramId || !messageId) return;

    // Если мы в onboarding-меню, а callback не наш — передаём onboarding-обработчику
    if (
      ctx.session.menu === 'onboarding' &&
      data !== 'menu:streams' &&
      data !== 'menu:my_study' &&
      data !== 'menu:mentor' &&
      data !== 'menu:school_group' &&
      data !== 'menu:onboarding'
    ) {
      await next();
      return;
    }

    // Маршрутизация кнопок главного меню
    if (data === 'menu:streams') {
      try {
        const actorId = await resolveUserUuid(telegramId);
        if (!actorId) {
          await ctx.reply('Пользователь не найден. Пожалуйста, нажмите /start.');
          await ctx.answerCallbackQuery();
          return;
        }
        const response = await streamController.handleUpdate(
          { type: 'command', command: 'streams', telegramId },
          actorId,
        );
        await executeResponses(ctx, response);
      } catch (err) {
        logger.error('top-menu', 'Ошибка menu:streams', {
          error: String(err),
        });
      }
      await ctx.answerCallbackQuery();
      return;
    }

    if (data === 'menu:my_study') {
      try {
        const actorId = await resolveUserUuid(telegramId);
        if (!actorId) {
          await ctx.reply('Пользователь не найден. Пожалуйста, нажмите /start.');
          await ctx.answerCallbackQuery();
          return;
        }
        const response = await streamController.handleUpdate(
          { type: 'command', command: 'my_study', telegramId },
          actorId,
        );
        await executeResponses(ctx, response);
      } catch (err) {
        logger.error('top-menu', 'Ошибка menu:my_study', {
          error: String(err),
        });
      }
      await ctx.answerCallbackQuery();
      return;
    }

    if (data === 'menu:mentor') {
      try {
        const actorId = await resolveUserUuid(telegramId);
        if (!actorId) {
          await ctx.reply('Пользователь не найден. Пожалуйста, нажмите /start.');
          await ctx.answerCallbackQuery();
          return;
        }
        const response = await streamController.handleUpdate(
          { type: 'command', command: 'mentor', telegramId },
          actorId,
        );
        await executeResponses(ctx, response);
      } catch (err) {
        logger.error('top-menu', 'Ошибка menu:mentor', {
          error: String(err),
        });
      }
      await ctx.answerCallbackQuery();
      return;
    }

    if (data === 'menu:school_group') {
      const schoolGroupMsg = [
        '🏫 <b>Школьное сообщество</b> — это группа, где:',
        '',
        '• Публикуются объявления и новости',
        '• Можно прочитать или запросить отзывы у студентов',
        '• Просто пообщаться с менторами и студентами',
        '',
        'Подписывайся, чтобы ничего не пропустить! 👇',
      ].join('\n');

      const joinKeyboard = new InlineKeyboard().url(
        '🔗 Перейти в сообщество',
        config.newsGroupUrl,
      );

      await ctx.reply(schoolGroupMsg, {
        parse_mode: 'HTML',
        reply_markup: joinKeyboard,
      });
      await ctx.answerCallbackQuery();
      return;
    }

    if (data === 'menu:onboarding') {
      try {
        const response = await onboardingController.handleUpdate(
          {
            type: 'command',
            command: 'start',
            telegramId,
            name: ctx.from?.first_name || 'User',
          },
          config.botAdminUuid,
        );
        ctx.session.menu = 'onboarding';
        await executeResponses(ctx, response);
      } catch (err) {
        logger.error('top-menu', 'Ошибка menu:onboarding', {
          error: String(err),
        });
      }
      await ctx.answerCallbackQuery();
      return;
    }

    // Все остальные callback'ы (stream:view, enroll:, complete:, progress:, stream:activate:, stream:students:)
    try {
      const actorId = await resolveUserUuid(telegramId);
      if (!actorId) {
        await ctx.reply('Пользователь не найден. Пожалуйста, нажмите /start.');
        await ctx.answerCallbackQuery();
        return;
      }
      const response = await streamController.handleUpdate(
        { type: 'callback', data, telegramId, messageId },
        actorId,
      );
      await executeResponses(ctx, response);
    } catch (err) {
      logger.error('top-menu', 'Ошибка callback', {
        error: String(err),
        data,
      });
    }
    await ctx.answerCallbackQuery();
  });
}
