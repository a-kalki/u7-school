import type { OnboardingBotApp, OnboardingController } from '@u7/onboarding';
import type { Bot } from 'grammy';
import { InlineKeyboard } from 'grammy';
import type { BotConfig } from '../config';
import type { BotContext } from '../context';

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
    let user = await apiApp
      .execute('get-user-by-telegram-id', { telegramId }, config.botAdminUuid)
      .catch(() => undefined);

    // Если нет — регистрируем нового (GUEST)
    if (!user) {
      user = await apiApp.execute(
        'register-user',
        { name: ctx.from?.first_name ?? 'Гость', telegramId },
        config.botAdminUuid,
      );
    }

    const questionnaires = await apiApp
      .execute(
        'list-questionnaires-by-user',
        { userId: user.uuid },
        config.botAdminUuid,
      )
      .catch(() => []);

    const flow = controller.getStartFlow(user, questionnaires);

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
    await ctx.conversation.enter('onboarding');
  });

  bot.callbackQuery('menu', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.reply('Чтобы открыть меню, нажми /start');
  });

  bot.callbackQuery('new_application', async (ctx) => {
    await ctx.answerCallbackQuery();

    const telegramId = ctx.from?.id;
    if (!telegramId) return;

    const user = await apiApp
      .execute('get-user-by-telegram-id', { telegramId }, config.botAdminUuid)
      .catch(() => undefined);

    if (!user) return;

    const questionnaires = await apiApp
      .execute(
        'list-questionnaires-by-user',
        { userId: user.uuid },
        config.botAdminUuid,
      )
      .catch(() => []);

    const active = questionnaires.find((q) => q.status === 'in_progress');
    if (active) {
      await controller.abandon(active.uuid, config.botAdminUuid);
    }

    await ctx.conversation.enter('onboarding');
  });
}
