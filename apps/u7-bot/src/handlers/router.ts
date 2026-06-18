import type { Logger } from '@u7-scl/core/shared';
import type { BotResponse, BotRouter } from '@u7-scl/core/ui';
import type { User, UserFacade } from '@u7-scl/user/domain';
import { type Composer, InlineKeyboard } from 'grammy';
import type { BotContext } from '../context';
import { executeResponses } from '../ui-utils';

/** Callback-data для кнопки «↩️ Назад /start» */
const BACK_CALLBACK = '__back_to_start__';

/**
 * Добавляет кнопку «↩️ Назад /start» в клавиатуру ответа,
 * если у пользователя есть активный обработчик (activeHandler).
 */
function addBackButton(response: BotResponse): BotResponse {
  const backRow = [{ text: '↩️ Назад /start', code: BACK_CALLBACK }];

  const addRow = (kb: NonNullable<BotResponse['sendMessage']>['keyboard']) => {
    if (!kb) return { rows: [backRow], isMultiple: false };
    return { ...kb, rows: [...kb.rows, backRow] };
  };

  const result = { ...response };
  if (result.sendMessage) {
    result.sendMessage = { ...result.sendMessage, keyboard: addRow(result.sendMessage.keyboard) };
  }
  if (result.editMessage) {
    result.editMessage = { ...result.editMessage, keyboard: addRow(result.editMessage.keyboard) };
  }
  if (result.sendMessages) {
    result.sendMessages = result.sendMessages.map((sm) => ({
      ...sm,
      keyboard: addRow(sm.keyboard),
    }));
  }
  return result;
}

/**
 * Резолвит пользователя по telegramId.
 * Если пользователь не найден — регистрирует гостя.
 */
export async function resolveUser(
  userFacade: UserFacade,
  telegramId: number,
  botAdminUuid: string,
  name?: string,
): Promise<User> {
  const existing = await userFacade.getUserByTelegramId(telegramId);
  if (existing) {
    return existing;
  }
  return userFacade.registerGuest(telegramId, name ?? 'Гость', botAdminUuid);
}

/**
 * Подключает Grammy-обработчики к BotRouter.
 *
 * @param bot — Grammy-композер (обычно privateBot.filter(...))
 * @param router — роутер из core
 * @param userFacade — фасад модуля пользователей
 * @param botAdminUuid — UUID администратора бота
 * @param logger — опциональный логгер
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
  // /start — сбор главного меню
  // ═══════════════════════════════════════════
  bot.command('start', async (ctx) => {
    const user = await resolveActor(ctx);
    if (!user) {
      await ctx.reply('Не удалось определить пользователя.');
      return;
    }

    ctx.session.activeHandler = null;

    const items = await router.collectMainMenu(user);

    const keyboard = new InlineKeyboard();
    for (const item of items) {
      if (item.url) {
        keyboard.url(item.text, item.url).row();
      } else {
        keyboard.text(item.text, item.action).row();
      }
    }

    await ctx.reply(`Привет, ${user.name}! 👋\n\nВыберите действие:`, {
      reply_markup: keyboard,
    });
  });

  // ═══════════════════════════════════════════
  // /cancel — отмена текущего действия
  // ═══════════════════════════════════════════
  bot.command('cancel', async (ctx) => {
    const user = await resolveActor(ctx);
    if (!user) return;

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
    if (!user) return;

    const data = ctx.callbackQuery.data;

    // ── Кнопка «↩️ Назад /start» ──
    if (data === BACK_CALLBACK) {
      ctx.session.activeHandler = null;
      const items = await router.collectMainMenu(user);
      const keyboard = new InlineKeyboard();
      for (const item of items) {
        if (item.url) {
          keyboard.url(item.text, item.url).row();
        } else {
          keyboard.text(item.text, item.action).row();
        }
      }
      await ctx.reply(`Привет, ${user.name}! 👋\n\nВыберите действие:`, {
        reply_markup: keyboard,
      });
      await ctx.answerCallbackQuery().catch(() => {});
      return;
    }

    const response = await router.handleCallback(data, user, ctx.session);

    // Проверка на «чужой callback» — показываем alert
    if (response.sendMessage?.text?.includes('завершите текущее действие')) {
      await ctx
        .answerCallbackQuery({
          text: 'Сначала завершите текущее действие (/cancel)',
          show_alert: true,
        })
        .catch(() => {});
      return;
    }

    // Добавляем кнопку «Назад», если есть активный обработчик
    const finalResponse = ctx.session.activeHandler
      ? addBackButton(response)
      : response;

    await executeResponses(ctx, finalResponse);
    await ctx.answerCallbackQuery().catch(() => {});
  });

  // ═══════════════════════════════════════════
  // message:text — форвард активному обработчику
  // ═══════════════════════════════════════════
  bot.on('message:text', async (ctx, next) => {
    // Пропускаем команды
    if (ctx.message.text.startsWith('/')) return next();

    const user = await resolveActor(ctx);
    if (!user) return;

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

    // Добавляем кнопку «Назад», если есть активный обработчик
    const finalResponse = ctx.session.activeHandler
      ? addBackButton(response)
      : response;

    await executeResponses(ctx, finalResponse);
  });
}
