import type { OnboardingController } from '@u7/onboarding';
import { Bot, session } from 'grammy';
import type { BotConfig } from './config';
import type { BotContext } from './context';
import { executeResponses } from './ui-utils';

/**
 * Фабрика создания Grammy-бота.
 * Бот — чистый мост Telegram ↔ Контроллер.
 * Маршрутизация на основе ctx.session.menu.
 */
export function createBot(
  config: BotConfig,
  controller: OnboardingController,
) {
  const bot = new Bot<BotContext>(config.botToken);

  // ══ Session middleware ══
  bot.use(
    session({
      initial: (): { menu: 'main' | 'onboarding' } => ({ menu: 'main' }),
    }),
  );

  // ══ Только приватные чаты ══
  bot.filter((ctx) => ctx.chat?.type === 'private');

  // ══ Сообщения и callback'и — форвардим в контроллер если onboarding ══
  bot.on('message:text', async (ctx, next) => {
    if (ctx.session.menu !== 'onboarding') return next();
    if (ctx.message.text.startsWith('/')) return next();

    const response = await controller.handleUpdate(
      {
        type: 'message',
        text: ctx.message.text,
        telegramId: ctx.from.id,
        name: ctx.from.first_name,
      },
      config.botAdminUuid,
    );

    await executeResponses(ctx, response);
  });

  bot.on('callback_query:data', async (ctx, next) => {
    if (ctx.session.menu !== 'onboarding') return next();

    await ctx.answerCallbackQuery().catch(() => {});
    const response = await controller.handleUpdate(
      {
        type: 'callback',
        data: ctx.callbackQuery.data,
        telegramId: ctx.from.id,
        messageId: ctx.callbackQuery.message?.message_id || 0,
      },
      config.botAdminUuid,
    );

    if (response.questionnaireCompleted) {
      ctx.session.menu = 'main';
    }

    await executeResponses(ctx, response);
  });

  // ══ /cancel — только в onboarding-меню ══
  bot.command('cancel', async (ctx, next) => {
    if (ctx.session.menu !== 'onboarding') return next();

    const response = await controller.handleUpdate(
      {
        type: 'command',
        command: 'cancel',
        telegramId: ctx.from!.id,
        name: ctx.from!.first_name || 'User',
      },
      config.botAdminUuid,
    );

    if (response.questionnaireCompleted) {
      ctx.session.menu = 'main';
    }

    await executeResponses(ctx, response);
  });

  return bot;
}
