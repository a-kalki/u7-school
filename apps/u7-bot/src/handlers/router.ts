import type { Logger } from '@u7-scl/core/shared';
import type { BotRouter } from '@u7-scl/core/ui';
import type { User, UserFacade } from '@u7-scl/user/domain';
import type { Composer } from 'grammy';
import type { BotContext } from '../context';
import { executeResponses } from '../ui-utils';

/**
 * Резолвит пользователя по telegramId.
 * Если пользователь не найден — регистрирует гостя.
 */
export async function resolveUser(
  userFacade: UserFacade,
  telegramId: number,
  botAdminUuid: string,
  name?: string,
  nick?: string,
): Promise<User> {
  const existing = await userFacade.getUserByTelegramId(telegramId);
  if (existing) {
    return existing;
  }
  return userFacade.registerGuest(
    telegramId,
    name ?? 'Гость',
    botAdminUuid,
    nick,
  );
}

/**
 * Подключает Grammy-обработчики к BotRouter.
 *
 * connectRouter — чистый адаптер: Grammy-события → BotRouter → executeResponses.
 * Не содержит пользовательских текстов, не формирует клавиатуры.
 */
export function connectRouter(
  bot: Composer<BotContext>,
  router: BotRouter,
  userFacade: UserFacade,
  botAdminUuid: string,
  logger?: Logger,
): void {
  // Резолвер актора из Grammy-контекста
  async function resolveActor(ctx: BotContext): Promise<User | null> {
    const telegramId = ctx.from?.id;
    if (!telegramId) return null;
    try {
      return await resolveUser(
        userFacade,
        telegramId,
        botAdminUuid,
        ctx.from?.first_name,
        ctx.from?.username,
      );
    } catch (err) {
      logger?.error('router', 'Ошибка resolveUser', {
        error: String(err),
        telegramId,
      });
      return null;
    }
  }

  // ═══════════════════════════════════════════
  // /start — приветствие и главное меню
  // ═══════════════════════════════════════════
  bot.command('start', async (ctx) => {
    const user = await resolveActor(ctx);
    if (!user) {
      await ctx.reply('Не удалось определить пользователя.');
      return;
    }

    ctx.session.activeHandler = null;

    const response = await router.handleWelcome(user);
    await executeResponses(ctx, response);
  });

  // ═══════════════════════════════════════════
  // /help — инструкция и список команд
  // ═══════════════════════════════════════════
  bot.command('help', async (ctx) => {
    const user = await resolveActor(ctx);
    if (!user) {
      await ctx.reply('Не удалось определить пользователя.');
      return;
    }

    const response = await router.handleHelp(user);
    await executeResponses(ctx, response);
  });

  // ═══════════════════════════════════════════
  // /cancel — отмена текущего действия
  // ═══════════════════════════════════════════
  bot.command('cancel', async (ctx) => {
    const user = await resolveActor(ctx);
    if (!user) {
      await ctx.reply('Не удалось определить пользователя. Попробуйте /start.');
      return;
    }

    const response = await router.handleCancel(user, ctx.session);

    if (response === null) {
      await ctx.reply('Нечего отменять. Нажмите /start');
      return;
    }

    await executeResponses(ctx, response);
  });

  // ═══════════════════════════════════════════
  // callback_query — авто-маршрутизация
  // ═══════════════════════════════════════════
  bot.on('callback_query:data', async (ctx) => {
    const user = await resolveActor(ctx);
    if (!user) {
      await ctx
        .answerCallbackQuery({
          text: 'Ошибка идентификации. Попробуйте /start.',
          show_alert: true,
        })
        .catch(() => {});
      return;
    }

    const data = ctx.callbackQuery.data;

    const response = await router.handleCallback(data, user, ctx.session);

    // Проверка на «чужой callback» — показываем alert
    if (response.sendMessage?.text?.includes('завершите текущее действие')) {
      await ctx
        .answerCallbackQuery({
          text: 'Сначала завершите текущее действие (/cancel)',
          show_alert: true,
        })
        .catch((err) => {
          logger?.warn('router', 'Ошибка answerCallbackQuery (alert)', {
            error: String(err),
          });
        });
      return;
    }

    await executeResponses(ctx, response);
    await ctx.answerCallbackQuery().catch((err) => {
      logger?.warn('router', 'Ошибка answerCallbackQuery (ack)', {
        error: String(err),
      });
    });
  });

  // ═══════════════════════════════════════════
  // message:text — форвард активному обработчику
  // ═══════════════════════════════════════════
  bot.on('message:text', async (ctx, next) => {
    // Пропускаем команды
    if (ctx.message.text.startsWith('/')) return next();

    const user = await resolveActor(ctx);
    if (!user) {
      await ctx
        .reply('Не удалось определить пользователя. Попробуйте /start.')
        .catch(() => {});
      return;
    }

    const update = {
      type: 'message' as const,
      text: ctx.message.text,
      telegramId: ctx.from!.id,
    };

    const response = await router.handleMessage(update, user, ctx.session);

    if (response === null) {
      // Нет активного обработчика — пропускаем
      return next();
    }

    await executeResponses(ctx, response);
  });
}
