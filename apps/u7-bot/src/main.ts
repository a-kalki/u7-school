import { CompositeLogger } from '@u7-scl/app/infra';
import {
  ConsoleLogger,
  LogLevel,
  serializeError,
  setGlobalLogger,
} from '@u7-scl/core/shared';
import { UserPolicy } from '@u7-scl/user/domain';
import { webhookCallback } from 'grammy';
import { createBot } from './bot';
import { loadConfig } from './config';
import { createApiApp } from './create-api-app';
import { createUiApp } from './create-ui-app';
import { registerGroupHandlers } from './handlers/group-handler';
import { BotTransport } from './infra/bot-transport';
import { TelegramLogger } from './infra/logger';

const config = loadConfig();

// ══ Инициализация логгера ══
const consoleLogger = new ConsoleLogger();
consoleLogger.setLogLevel(LogLevel.DEBUG);

const loggers: CompositeLogger = new CompositeLogger([consoleLogger]);
setGlobalLogger(loggers);

// TelegramLogger создадим после createBot, но пока есть только consoleLogger
const logger = loggers;

const bot = createBot(config.botToken);

const apiBundle = createApiApp(config, logger);
const uiBundle = createUiApp(apiBundle.apiApp, apiBundle, config);

// ══ BotTransport — единый слой Grammy ↔ UiApp (контракт «Диалог и Экран») ══
// Сессиями BotSession владеет транспорт (внутренняя мапа).
const transport = new BotTransport(uiBundle.uiApp, bot.api);

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
// FR-7: при выходе студента из группы — уведомление ментору потока.
// actorId — бот как системный актор: регистрация гостей в group-handler.
// Регистрация гостей и роли (SUBSCRIBER) — только для школьной группы.
registerGroupHandlers(bot, apiBundle.userFacade, logger, {
  apiApp: apiBundle.apiApp,
  transport,
  actorId: config.botAdminUuid,
  schoolGroupId: config.schoolGroupId,
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

// ══ Регистрация обработчиков: единый message:text + callback ══
// Слэш-команды перехватываются транспортом по `/`-префиксу (ФР-4) и
// уходят трёхуровневым pipe uiApp: /start — uiApp напрямую (гость →
// welcome из menuButtons), прочее — pipe контроллеров (активный первым)
// → дефолты u7 (help/cancel/unknown). /log_level — app-контроллер.
// Поимённой grammy-регистрации команд нет.
privateBot.on('callback_query:data', (ctx) => transport.handleCallback(ctx));
privateBot.on('message:text', (ctx) => transport.handleMessage(ctx));

// ══ Глобальный catch — на исходный бот (ловит ошибки из всех веток) ══
bot.catch((err) => {
  logger.error('bot', 'Необработанная ошибка бота', { error: String(err) });
});

// ══ Типы обновлений ══
// chat_member НЕ входит в дефолтный набор Telegram: без явного allowed_updates
// бот не получает события входа/выхода участников группы (SUBSCRIBER, FR-7).
const ALLOWED_UPDATES = [
  'message',
  'callback_query',
  'my_chat_member',
  'chat_member',
] as const;

// ══ Запуск: polling или webhook ══
let server: ReturnType<typeof Bun.serve> | undefined;
if (config.botMode === 'webhook') {
  const webhookUrl = config.webhookUrl;
  if (!webhookUrl) {
    throw new Error('WEBHOOK_URL обязателен при BOT_MODE=webhook');
  }

  const fullWebhookUrl = `${webhookUrl.replace(/\/+$/, '')}${config.webhookPath}`;

  await bot.api.setWebhook(fullWebhookUrl, {
    allowed_updates: [...ALLOWED_UPDATES],
  });
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
  bot.start({ allowed_updates: [...ALLOWED_UPDATES] });
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
