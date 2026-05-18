import type { OnboardingBotApp } from '@u7/onboarding';
import type { Bot } from 'grammy';
import type { BotConfig } from '../config';
import type { BotContext } from '../context';

/**
 * Регистрирует обработчик /start.
 * 1. Идемпотентная регистрация GUEST через userModule
 * 2. Устанавливает menu = 'main'
 * 3. Показывает главное меню (без контроллера)
 */
export function registerStartHandler(
  bot: Bot<BotContext>,
  apiApp: OnboardingBotApp,
  config: BotConfig,
) {
  bot.command('start', async (ctx) => {
    const telegramId = ctx.from?.id;
    const name = ctx.from?.first_name || 'Гость';

    if (!telegramId) {
      await ctx.reply('Не удалось определить ваш Telegram ID.');
      return;
    }

    // Идемпотентная регистрация
    try {
      await apiApp.execute(
        'register-guest' as any,
        { telegramId, name },
        config.botAdminUuid,
      );
    } catch (err) {
      console.error('Ошибка registerGuest:', err);
    }

    // Устанавливаем меню
    ctx.session.menu = 'main';

    // Главное меню — рендерит бот, не контроллер
    await ctx.reply(
      [
        `Привет, ${name}! 👋`,
        '',
        '🔗 /link\\-to\\-school\\-group — присоединяйся к группе, чтобы быть в курсе новостей, читать отзывы и общаться со студентами',
        '📝 /start\\-onboarding — заполни анкету, расскажи о своих целях и ожиданиях от обучения',
      ].join('\n'),
      { parse_mode: 'MarkdownV2' },
    );
  });
}
