import { CompositeLogger } from '@u7-scl/app/infra';
import {
  ConsoleLogger,
  LogLevel,
  parseLogLevel,
  serializeError,
  setGlobalLogger,
} from '@u7-scl/core/shared';
import { UserPolicy } from '@u7-scl/user/domain';
import { webhookCallback } from 'grammy';
import { createBot } from './bot';
import { loadConfig } from './config';
import type { SessionData } from './context';
import { createApiApp } from './create-api-app';
import { createUiApp } from './create-ui-app';
import { registerGroupHandlers } from './handlers/group-handler';
import { registerStudentKickHandler } from './handlers/student-kick-handler';
import { BotTransport } from './infra/bot-transport';
import { TelegramLogger } from './infra/logger';

const config = loadConfig();

// ══ Общее хранилище сессий (Grammy + BotTransport) ══
const sessionMap = new Map<number, SessionData>();

// ══ Инициализация логгера ══
const consoleLogger = new ConsoleLogger();
consoleLogger.setLogLevel(LogLevel.DEBUG);

const loggers: CompositeLogger = new CompositeLogger([consoleLogger]);
setGlobalLogger(loggers);

// TelegramLogger создадим после createBot, но пока есть только consoleLogger
const logger = loggers;

const bot = createBot(config.botToken, sessionMap);

const apiBundle = createApiApp(config, logger);
const uiBundle = createUiApp(apiBundle.apiApp, apiBundle, config);

// ══ BotTransport — единый слой Grammy ↔ UiApp ══
const transport = new BotTransport(uiBundle.uiApp, bot.api, sessionMap);

// ══ Жизненный цикл: init → start ══
// transport передаётся отдельным аргументом (ProactiveSender).
uiBundle.uiApp.init(uiBundle.resolve, transport);
uiBundle.uiApp.start(); // подписки стори на доменные события — раньше старта job'ов

// ══ Старт периодических заданий (Job) ══
// Ошибка одиночного прогона логируется внутри планировщика, процесс не падает.
apiBundle.apiApp.start();

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
  const { userFacade } = apiBundle;
  const adminUser = await userFacade.getUserByUuid(config.botAdminUuid);
  if (!adminUser) {
    throw new Error(
      `BOT_ADMIN_UUID не найден: пользователь ${config.botAdminUuid} не существует`,
    );
  }
  if (!UserPolicy.isAdmin(adminUser)) {
    throw new Error(
      `BOT_ADMIN_UUID имеет недостаточные права: у пользователя ${config.botAdminUuid} нет роли ADMIN`,
    );
  }
  logger.info('main', 'Верификация бота пройдена: ADMIN подтверждён');
}

// ══ Групповые события — на исходный бот (chat_member, my_chat_member) ══
// FR-7: при выходе студента из группы — уведомление ментору потока
registerGroupHandlers(bot, apiBundle.userFacade, logger, {
  apiApp: apiBundle.apiApp,
  transport,
});

// ══ ER кика: student.abandoned → мягкое исключение из группы потока (FR-6) ══
registerStudentKickHandler({
  eventBus: apiBundle.eventBus,
  getStream: async (streamId) =>
    apiBundle.apiApp.execute('get-stream', { streamId }),
  userFacade: apiBundle.userFacade,
  botApi: bot.api,
  logger,
});

// ══ Приватные чаты — через filter ══
const privateBot = bot.filter((ctx) => ctx.chat?.type === 'private');

// ══ Обработчик ошибок — только для приватных обработчиков ══
privateBot.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    logger.error('bot', 'Непредвиденная ошибка в обработчике', {
      ...serializeError(err),
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

// ══ Скрытая команда управления уровнем логирования (только для админов) ══
privateBot.command('log_level', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId || !config.adminTelegramIds.includes(userId)) {
    return;
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

// ══ Регистрация обработчиков через BotTransport ══
privateBot.command('start', (ctx) => transport.handleStart(ctx));
privateBot.command('help', (ctx) => transport.handleHelp(ctx));
privateBot.command('cancel', (ctx) => transport.handleCancel(ctx));
privateBot.on('callback_query:data', (ctx) => transport.handleCallback(ctx));
privateBot.on('message:text', (ctx, next) =>
  transport.handleMessage(ctx, next),
);

// ══ Глобальный catch — на исходный бот (ловит ошибки из всех веток) ══
bot.catch((err) => {
  logger.error('bot', 'Необработанная ошибка бота', { error: String(err) });
});

// ══ Запуск: polling или webhook ══
let server: ReturnType<typeof Bun.serve> | undefined;
if (config.botMode === 'webhook') {
  const webhookUrl = config.webhookUrl;
  if (!webhookUrl) {
    throw new Error('WEBHOOK_URL обязателен при BOT_MODE=webhook');
  }

  const fullWebhookUrl = `${webhookUrl.replace(/\/+$/, '')}${config.webhookPath}`;

  await bot.api.setWebhook(fullWebhookUrl);
  logger.info('main', `Webhook установлен: ${fullWebhookUrl}`);

  const handler = webhookCallback(bot, 'bun');

  server = Bun.serve({
    hostname: '127.0.0.1',
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

// ══ Graceful shutdown: SIGINT / SIGTERM ══
let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    // Повторный сигнал — немедленный выход (не ждём зависших операций)
    process.exit(1);
  }
  shuttingDown = true;
  logger.info('main', `Получен ${signal} — graceful shutdown`);

  try {
    // 1. UI: отписка стори от доменных событий
    uiBundle.uiApp.stop();
    // 2. API: остановка периодических заданий
    apiBundle.apiApp.stop();
    // 3. Транспорт бота
    if (config.botMode === 'webhook') {
      server?.stop(true);
    } else {
      await bot.stop();
    }
  } catch (err) {
    logger.error('main', `Ошибка при завершении: ${String(err)}`);
  }

  logger.info('main', 'Graceful shutdown завершён');
  process.exit(0);
}
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
