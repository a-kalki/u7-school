import type { OnboardingController } from '@u7/onboarding';
import type { Bot } from 'grammy';
import type { BotConfig } from '../config';
import type { BotContext } from '../context';
import { executeResponses } from '../ui-utils';

/**
 * Регистрирует ВСЕ обработчики для onboarding-меню.
 * - /start_onboarding: вход в анкету
 * - Сообщения и callback'и: форвард в контроллер
 * - /cancel: прерывание анкеты
 */
export function registerOnboardingHandler(
  bot: Bot<BotContext>,
  controller: OnboardingController,
  config: BotConfig,
) {
  // ══ Сообщения в onboarding-меню — форвард в контроллер ══
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

    if (response.questionnaireCompleted) {
      ctx.session.menu = 'main';
    }

    await executeResponses(ctx, response);
  });

  // ══ Callback'и в onboarding-меню — форвард в контроллер ══
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
}
