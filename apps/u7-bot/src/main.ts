import { ConsoleLogger, LogLevel, parseLogLevel } from '@u7-scl/core/shared';
import { OnboardingController } from '@u7-scl/onboarding';
import { webhookCallback } from 'grammy';
import { createApiApp } from './api-app';
import { createBot } from './bot';
import { loadConfig } from './config';
import { registerGroupHandlers } from './handlers/group-handler';
import { registerOnboardingHandler } from './handlers/onboarding-handler';
import { registerTopMenuHandler } from './handlers/top-menu-handler';
import { CompositeLogger, TelegramLogger } from './logger';

const config = loadConfig();

// ══ Инициализация логгера ══
const consoleLogger = new ConsoleLogger();
consoleLogger.setLogLevel(LogLevel.DEBUG);

const loggers: CompositeLogger = new CompositeLogger([consoleLogger]);

// ══ TelegramLogger создадим после createBot, но пока есть только consoleLogger ══
// (TelegramLogger понадобится bot, который мы создадим ниже)
const logger = loggers;

const { apiApp, userFacade } = createApiApp(config, logger);
const controller = new OnboardingController(apiApp, logger);

// ══ TelegramLogger — только если указаны adminTelegramIds ══
if (config.adminTelegramIds.length > 0) {
  if (!config.loggerBotToken) {
    throw new Error(
      'LOGGER_BOT_TOKEN обязателен, когда указаны ADMIN_TELEGRAM_IDS',
    );
  }
  // Создаём отдельный bot только для TelegramLogger (он не запущен, только API)
  const loggerBot = createBot(config.loggerBotToken);
  const telegramLogger = new TelegramLogger(loggerBot, config.adminTelegramIds);
  // INFO в Telegram — только от явно разрешённых источников
  telegramLogger.setSourceLevel('main', LogLevel.INFO);
  telegramLogger.setSourceLevel('top-menu', LogLevel.INFO);
  loggers.addLogger(telegramLogger);
  loggers.info(
    'main',
    `TelegramLogger настроен для ${config.adminTelegramIds.length} админов`,
  );
}

// ══ Верификация бота при старте ══
{
  const adminUser = await userFacade.getUserByUuid(config.botAdminUuid);
  if (!adminUser) {
    throw new Error(
      `BOT_ADMIN_UUID не найден: пользователь ${config.botAdminUuid} не существует`,
    );
  }
  const roles = adminUser.roles as string[] | undefined;
  if (!roles || !roles.includes('ADMIN')) {
    throw new Error(
      `BOT_ADMIN_UUID имеет недостаточные права: у пользователя ${config.botAdminUuid} нет роли ADMIN`,
    );
  }
  logger.info('main', 'Верификация бота пройдена: ADMIN подтверждён');
}

const bot = createBot(config.botToken);

// ══ Групповые события — на исходный бот (chat_member, my_chat_member) ══
registerGroupHandlers(bot, userFacade, logger);

// ══ Приватные чаты — через filter ══
//   filter() возвращает потомка, который получает только апдейты
//   из приватных чатов. Команды и сообщения из групп игнорируются.
const privateBot = bot.filter((ctx) => ctx.chat?.type === 'private');

// ══ Обработчик ошибок — только для приватных обработчиков ══
privateBot.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    logger.error('bot', 'Непредвиденная ошибка в обработчике', {
      error: String(err),
      updateId: ctx.update.update_id,
    });
    await ctx
      .reply('Произошла внутренняя ошибка. Попробуйте позже.')
      .catch(() => {});
  }
});

// ══ Логирование команд (только приватные чаты) ══
privateBot.command('start', async (ctx, next) => {
  logger.info(
    'top-menu',
    `Команда /start от пользователя ${ctx.from?.id} (${ctx.from?.first_name || '?'})`,
  );
  await next();
});

privateBot.command('start_onboarding', async (ctx, next) => {
  logger.info(
    'top-menu',
    `Команда /start_onboarding от пользователя ${ctx.from?.id}`,
  );
  await next();
});

privateBot.command('link_to_school_group', async (ctx, next) => {
  logger.info(
    'top-menu',
    `Команда /link_to_school_group от пользователя ${ctx.from?.id}`,
  );
  await next();
});

// ══ Скрытая команда управления уровнем логирования (только для админов) ══
privateBot.command('log_level', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId || !config.adminTelegramIds.includes(userId)) {
    return; // Игнорируем — команда невидима для не-админов
  }

  const args = ctx.message?.text?.split(' ').slice(1).join(' ') || '';
  if (!args) {
    await ctx.reply(
      'Использование: /log_level <level>\n\nДоступные уровни: debug, info, warn, error, all',
    );
    return;
  }

  const level = parseLogLevel(args);
  if (level === undefined) {
    await ctx.reply(
      `Неизвестный уровень: "${args}". Доступные: debug, info, warn, error, all`,
    );
    return;
  }

  logger.setLogLevel(level);
  await ctx.reply(`✅ Уровень логирования изменён на: ${args}`);
  logger.info(
    'log_level',
    `Уровень логирования изменён на ${args} администратором ${userId}`,
  );
});

registerTopMenuHandler(privateBot, userFacade, controller, config, logger);
registerOnboardingHandler(privateBot, controller, config);

// ══ Глобальный catch — на исходный бот (ловит ошибки из всех веток) ══
bot.catch((err) => {
  logger.error('bot', 'Необработанная ошибка бота', { error: String(err) });
});

// ══ Запуск: polling или webhook ══
if (config.botMode === 'webhook') {
  const webhookUrl = config.webhookUrl;
  if (!webhookUrl) {
    throw new Error('WEBHOOK_URL обязателен при BOT_MODE=webhook');
  }

  const fullWebhookUrl = `${webhookUrl.replace(/\/+$/, '')}${config.webhookPath}`;

  await bot.api.setWebhook(fullWebhookUrl);
  logger.info('main', `Webhook установлен: ${fullWebhookUrl}`);

  const handler = webhookCallback(bot, 'bun');

  Bun.serve({
    hostname: "127.0.0.1",
    port: config.webhookPort,
    async fetch(req) {
      const url = new URL(req.url);
      if (req.method === 'POST' && url.pathname === config.webhookPath) {
        return await handler(req);
      }
      return new Response('Not Found', { status: 404 });
    },
  });

  logger.info(
    'main',
    `Бот запущен в режиме webhook на порту ${config.webhookPort}`,
  );
} else {
  bot.start();
  logger.info('main', 'Бот запущен в режиме polling');
}
