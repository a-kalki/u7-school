import { BotDispatcher } from '@u7-scl/core/ui';
import type { Logger } from '@u7-scl/core/shared';
import type { User, UserFacade } from '@u7-scl/user/domain';
import { InlineKeyboard, type Composer } from 'grammy';
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
): Promise<User> {
  const existing = await userFacade.getUserByTelegramId(telegramId);
  if (existing) {
    return existing;
  }
  return userFacade.registerGuest(telegramId, name ?? 'Гость', botAdminUuid);
}

/**
 * Регистрирует Grammy-обработчики, делегируя логику в BotDispatcher.
 *
 * @param bot — Grammy-композер (обычно privateBot.filter(...))
 * @param dispatcher — универсальный диспетчер из core
 * @param userFacade — фасад модуля пользователей
 * @param botAdminUuid — UUID администратора бота
 * @param logger — опциональный логгер
 */
export function registerDispatcher(
  bot: Composer<BotContext>,
  dispatcher: BotDispatcher,
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
      logger?.error('dispatcher', 'Ошибка resolveUser', {
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

    const items = await dispatcher.collectMainMenu(user);

    const keyboard = new InlineKeyboard();
    for (const item of items) {
      keyboard.text(item.text, item.action).row();
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

    const response = await dispatcher.handleCancel(user, ctx.session);

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

    const response = await dispatcher.handleCallback(data, user, ctx.session);

    // Проверка на «чужой callback» — показываем alert
    if (
      response.sendMessage?.text?.includes('завершите текущее действие')
    ) {
      await ctx
        .answerCallbackQuery({
          text: 'Сначала завершите текущее действие (/cancel)',
          show_alert: true,
        })
        .catch(() => {});
      return;
    }

    await executeResponses(ctx, response);
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

    const response = await dispatcher.handleMessage(
      update,
      user,
      ctx.session,
    );

    if (response === null) {
      // Нет активного обработчика — пропускаем
      return next();
    }

    await executeResponses(ctx, response);
  });
}
