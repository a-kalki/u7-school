import type {
  OnboardingBotApp,
  OnboardingController,
  OnboardingState,
} from '@u7/onboarding';
import { Role } from '@u7/user/domain';
import type { Bot } from 'grammy';
import { InlineKeyboard } from 'grammy';
import type { BotConfig } from '../config';
import type { BotContext } from '../context';
import { executeResponses } from '../ui-utils';

/**
 * Регистрирует обработчик /start с логикой определения flow пользователя.
 */
export function registerStartHandler(
  bot: Bot<BotContext>,
  controller: OnboardingController,
  apiApp: OnboardingBotApp,
  config: BotConfig,
) {
  bot.command('start', async (ctx) => {
    const telegramId = ctx.from?.id;
    if (!telegramId) {
      await ctx.reply('Не удалось определить ваш Telegram ID.');
      return;
    }

    // Ищем пользователя по telegramId
    const user = await apiApp
      .execute(
        'get-user-by-telegram-id' as any,
        { telegramId },
        config.botAdminUuid,
      )
      .catch(() => undefined);

    // Убеждаемся что есть пользователь с ролью GUEST
    await apiApp.execute(
      'register-guest' as any,
      {
        telegramId,
        name: ctx.from?.first_name || 'Guest',
      },
      config.botAdminUuid,
    );

    const onboardingState = (await apiApp.execute(
      'get-onboarding-state' as any,
      { telegramId },
      config.botAdminUuid,
    )) as OnboardingState;

    if (onboardingState.status === 'in_progress') {
      // Если уже в процессе - может стоит напомнить?
    }

    const flow =
      user && (user as any).roles.includes('CANDIDATE')
        ? 'candidate'
        : user && (user as any).roles.includes('SUBSCRIBER')
          ? 'subscriber'
          : 'guest';

    if (flow === 'candidate') {
      const keyboard = new InlineKeyboard()
        .text('Новая заявка', 'new_application')
        .row()
        .text('Меню', 'menu');

      await ctx.reply('Вы уже заполняли заявку. Хотите подать новую?', {
        reply_markup: keyboard,
      });
    } else if (flow === 'subscriber') {
      await ctx.reply('Ты уже с нами! 🎉');
    } else {
      const keyboard = new InlineKeyboard()
        .text('Быть в курсе', 'be_in_the_know')
        .row()
        .text('Стать студентом', 'become_student');

      await ctx.reply(
        'Привет! Добро пожаловать в U7 School 👋\n\nВыбери, что тебе интересно:',
        { reply_markup: keyboard },
      );
    }
  });

  // Обработка inline-кнопок меню
  bot.callbackQuery('be_in_the_know', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `Присоединяйся к нашей новостной группе:\n${config.newsGroupUrl}`,
      {
        reply_markup: new InlineKeyboard().text('Вернуться в меню', 'menu'),
      },
    );
  });

  bot.callbackQuery('become_student', async (ctx) => {
    await ctx.answerCallbackQuery();
    const response = await controller.handleUpdate({
      type: 'callback',
      data: 'become_student',
      telegramId: ctx.from.id,
      messageId: ctx.callbackQuery.message?.message_id || 0,
    });
    await executeResponses(ctx, response);
  });

  bot.callbackQuery('menu', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('Чтобы открыть меню, нажми /start');
  });

  bot.callbackQuery('new_application', async (ctx) => {
    await ctx.answerCallbackQuery();

    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const onboardingState = (await apiApp.execute(
      'get-onboarding-state' as any,
      { telegramId },
      config.botAdminUuid,
    )) as OnboardingState;

    if (onboardingState.status === 'in_progress') {
      await apiApp.execute(
        'abandon-questionnaire' as any,
        { uuid: onboardingState.questionnaireUuid },
        config.botAdminUuid,
      );
    }

    // Начинаем заново
    const responses = await controller.handleUpdate({
      type: 'callback',
      data: 'become_student',
      telegramId,
    } as any); // need to adjust BotUpdate for become_student if needed

    // execution of responses... (this will be part of track 2 properly)
  });
}
