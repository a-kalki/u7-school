import type { BotController, BotResponse, MainMenuAction } from '@u7-scl/core/ui';
import type { Logger } from '@u7-scl/core/shared';
import type { User, UserFacade } from '@u7-scl/user/domain';
import { InlineKeyboard, type Composer } from 'grammy';
import type { BotContext } from '../context';
import { executeResponses } from '../ui-utils';

/**
 * Резолвит пользователя по telegramId.
 * Если пользователь не найден — регистрирует гостя.
 *
 * @param userFacade — фасад модуля пользователей
 * @param telegramId — Telegram ID пользователя
 * @param botAdminUuid — UUID администратора (для registerGuest)
 * @param name — имя пользователя (по умолчанию «Гость»)
 * @returns объект User
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
 * Извлекает имя контроллера из callback_data (первый сегмент до «:»).
 */
function extractControllerName(data: string): string | null {
  const colonIdx = data.indexOf(':');
  if (colonIdx === -1) return null;
  return data.substring(0, colonIdx);
}

/**
 * Извлекает остаток данных после имени контроллера.
 */
function extractRestData(data: string): string {
  const colonIdx = data.indexOf(':');
  if (colonIdx === -1) return data;
  return data.substring(colonIdx + 1);
}

/**
 * Регистрирует универсальный диспетчер бота.
 * Заменяет старые top-menu-handler, onboarding-handler, stream-handler.
 *
 * @param bot — Grammy-композер (обычно privateBot.filter(...))
 * @param controllers — массив контроллеров
 * @param userFacade — фасад модуля пользователей
 * @param botAdminUuid — UUID администратора бота
 * @param logger — опциональный логгер
 * @returns Map контроллеров по именам (для тестирования)
 */
export function registerDispatcher(
  bot: Composer<BotContext>,
  controllers: BotController[],
  userFacade: UserFacade,
  botAdminUuid: string,
  logger?: Logger,
): Map<string, BotController> {
  // Проверка уникальности имён контроллеров
  const controllerMap = new Map<string, BotController>();
  for (const c of controllers) {
    if (controllerMap.has(c.name)) {
      throw new Error(`Дубликат имени контроллера: ${c.name}`);
    }
    controllerMap.set(c.name, c);
  }

  // Вспомогательная функция: резолвит пользователя для ctx
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
  // /start — сбор главного меню со всех контроллеров
  // ═══════════════════════════════════════════
  bot.command('start', async (ctx) => {
    const user = await resolveActor(ctx);
    if (!user) {
      await ctx.reply('Не удалось определить пользователя.');
      return;
    }

    const allItems: MainMenuAction[] = [];
    for (const c of controllers) {
      try {
        const items = await c.handleStart(user);
        allItems.push(...items);
      } catch (err) {
        logger?.error('dispatcher', `Ошибка handleStart у ${c.name}`, {
          error: String(err),
        });
      }
    }

    allItems.sort((a, b) => a.priority - b.priority);

    const keyboard = new InlineKeyboard();
    for (const item of allItems) {
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
    const activeHandler = ctx.session.activeHandler;
    if (!activeHandler) {
      await ctx.reply('Нечего отменять. Нажмите /start');
      return;
    }

    const user = await resolveActor(ctx);
    if (!user) return;

    const [ctrlName] = activeHandler.path.split('/');
    const controller = controllerMap.get(ctrlName!);
    if (controller) {
      try {
        const response = await controller.handleCancel(user, ctx.session);
        if (response.releaseInput) {
          ctx.session.activeHandler = null;
        }
        await executeResponses(ctx, response);
      } catch (err) {
        logger?.error('dispatcher', `Ошибка handleCancel у ${ctrlName}`, {
          error: String(err),
        });
        ctx.session.activeHandler = null;
        await ctx.reply('Действие отменено.');
      }
    } else {
      ctx.session.activeHandler = null;
      await ctx.reply('Действие отменено.');
    }
  });

  // ═══════════════════════════════════════════
  // callback_query — авто-маршрутизация по префиксу
  // ═══════════════════════════════════════════
  bot.on('callback_query:data', async (ctx) => {
    const data = ctx.callbackQuery.data;
    const controllerName = extractControllerName(data);

    if (!controllerName) {
      // Не наш формат — пропускаем (для обратной совместимости)
      return;
    }

    // Проверка чужого callback при активном обработчике
    const activeHandler = ctx.session.activeHandler;
    if (activeHandler) {
      const [activeCtrl] = activeHandler.path.split('/');
      if (activeCtrl !== controllerName) {
        await ctx
          .answerCallbackQuery({
            text: 'Сначала завершите текущее действие (/cancel)',
            show_alert: true,
          })
          .catch(() => {});
        return;
      }
    }

    const controller = controllerMap.get(controllerName);
    if (!controller) {
      await ctx
        .answerCallbackQuery({ text: 'Неизвестная команда' })
        .catch(() => {});
      return;
    }

    const user = await resolveActor(ctx);
    if (!user) return;

    const restData = extractRestData(data);

    try {
      const response = await controller.handleCallback(
        restData,
        user,
        ctx.session,
      );

      // Обработка captureInput
      if (response.captureInput) {
        ctx.session.activeHandler = {
          path: `${controllerName}/${response.captureInput.path}`,
          context: response.captureInput.context,
          expiresAt: response.captureInput.ttlSeconds
            ? Date.now() + response.captureInput.ttlSeconds * 1000
            : undefined,
        };
      }

      // Обработка releaseInput
      if (response.releaseInput) {
        ctx.session.activeHandler = null;
      }

      // Делегирование (один уровень, без рекурсии)
      if (response.delegate) {
        // Сначала выполняем sendMessage из ответа
        await executeResponses(ctx, response);

        // Затем форвардим делегату
        const delegateResponse = await controller.handleCallback(
          response.delegate.path,
          user,
          ctx.session,
        );
        await executeResponses(ctx, delegateResponse);
      } else {
        await executeResponses(ctx, response);
      }
    } catch (err) {
      logger?.error(
        'dispatcher',
        `Ошибка handleCallback у ${controllerName}`,
        { error: String(err), data },
      );
      await ctx.reply('Произошла ошибка. Попробуйте позже.');
    }

    await ctx.answerCallbackQuery().catch(() => {});
  });

  // ═══════════════════════════════════════════
  // message:text — форвард активному обработчику
  // ═══════════════════════════════════════════
  bot.on('message:text', async (ctx, next) => {
    // Пропускаем команды
    if (ctx.message.text.startsWith('/')) return next();

    const activeHandler = ctx.session.activeHandler;
    if (!activeHandler) return next();

    // Проверка таймаута
    if (activeHandler.expiresAt && Date.now() > activeHandler.expiresAt) {
      const [ctrlName] = activeHandler.path.split('/');
      const controller = controllerMap.get(ctrlName!);
      if (controller) {
        const user = await resolveActor(ctx);
        if (user) {
          try {
            const response = await controller.handleTimeout(
              user,
              ctx.session,
            );
            if (response.releaseInput) {
              ctx.session.activeHandler = null;
            }
            await executeResponses(ctx, response);
          } catch (err) {
            logger?.error(
              'dispatcher',
              `Ошибка handleTimeout у ${ctrlName}`,
              { error: String(err) },
            );
            ctx.session.activeHandler = null;
          }
        }
      }
      return;
    }

    const [ctrlName] = activeHandler.path.split('/');
    const controller = controllerMap.get(ctrlName!);
    if (!controller) return;

    const user = await resolveActor(ctx);
    if (!user) return;

    const update = {
      type: 'message' as const,
      text: ctx.message.text,
      telegramId: ctx.from!.id,
    };

    try {
      const response = await controller.handleMessage(
        update,
        user,
        ctx.session,
      );

      if (response.releaseInput) {
        ctx.session.activeHandler = null;
      }

      await executeResponses(ctx, response);
    } catch (err) {
      logger?.error(
        'dispatcher',
        `Ошибка handleMessage у ${ctrlName}`,
        { error: String(err) },
      );
      await ctx.reply('Произошла ошибка. Попробуйте позже.');
    }
  });

  return controllerMap;
}
