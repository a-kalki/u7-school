import { CompositeLogger } from '@u7-scl/app/infra';
import {
  ConsoleLogger,
  LogLevel,
  serializeError,
  setGlobalLogger,
} from '@u7-scl/core/shared';
import { UserPolicy } from '@u7-scl/user/domain';
import { webhookCallback } from 'grammy';
import type { DevPersonaPanel } from '../scripts/dev-persona';
import { createBot } from './bot';
import { loadConfig } from './config';
import { createApiApp } from './create-api-app';
import { createUiApp } from './create-ui-app';
import { registerGroupHandlers } from './handlers/group-handler';
import { BotTransport } from './infra/bot-transport';
import { JsonBotSessionRepo } from './infra/json-bot-session-repo';
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
const uiBundle = await createUiApp(apiBundle.apiApp, apiBundle, config);

// ══ BotTransport — единый слой Grammy ↔ UiApp (контракт «Диалог и Экран») ══
// Сессии и shortId-мапа переживают рестарт (JsonBotSessionRepo, трек
// bot-ui-session-persist): старые кнопки остаются нажимаемыми, диалоги
// продолжаются. Запись — синхронно после каждого обработанного апдейта.
const botSessionRepo = new JsonBotSessionRepo(
  `${config.dbDir}/bot/sessions.json`,
  `${config.dbDir}/bot/short-ids.json`,
);
// ══ Dev-режим: подмена личности на входе транспорта ══
// «Театр одного актёра»: все роли фикстурного мира — один человек.
// Логика — в scripts/dev-persona.ts (вне прод-пути): подключается
// динамическим импортом и только при DEV_TELEGRAM_ID вне production.
// Прод-путь кода подмены не содержит; утечка DEV_TELEGRAM_ID в
// прод-env ничего не активирует (guard по NODE_ENV).
let devPanel: DevPersonaPanel | null = null;
if (config.devTelegramId && process.env.NODE_ENV !== 'production') {
  const { createDevPersonaPanel } = await import('../scripts/dev-persona');
  devPanel = createDevPersonaPanel(config.devTelegramId);
}

const transport = new BotTransport(
  uiBundle.uiApp,
  devPanel ? devPanel.wrapApi(bot.api) : bot.api,
  botSessionRepo,
);

// Персистентность: восстановление ДО запуска polling/webhook.
// Битый файл — fail-fast (JsonFileRepoError): падение старта с явной
// ошибкой, никаких молчаливых пересозданий.
await transport.restore();

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
const adminUser = await apiBundle.userFacade.getUserByUuid(config.botAdminUuid);
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

// ══ Групповые события — на исходный бот (chat_member, my_chat_member) ══
// FR-7: при выходе студента из группы — уведомление ментору потока.
// Актор — бот как системный актор (User-объект): регистрация гостей в group-handler.
// Регистрация гостей и роли (SUBSCRIBER) — только для школьной группы.
registerGroupHandlers(bot, apiBundle.userFacade, logger, {
  apiApp: apiBundle.apiApp,
  transport,
  actor: adminUser,
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
// ══ Dev-режим: перехват /persona + подмена автора ДО транспорта ══
// Вся логика — внутри панели (scripts/dev-persona.ts): команда
// переключает персону и в домен не уходит.
devPanel?.installCommandInterceptor(privateBot);

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

// ══ Dev-режим: список персон — в лог и приветствием в чат ══
if (devPanel && config.devTelegramId) {
  const hello = `🎭 Dev-режим подмены личности активен.\n\n${devPanel.listText()}`;
  // В лог — чтобы видеть персон ещё до открытия чата
  logger.info('main', `\n${hello}`);
  // И в чат бота — исходный api (не обёрнутый редиректом персон)
  await bot.api.sendMessage(config.devTelegramId, hello).catch(() => {
    logger.warn(
      'main',
      'Не удалось прислать приветствие dev-режима (напиши боту /start)',
    );
  });
}

// ══ Graceful shutdown: SIGINT / SIGTERM ══
// Обёртки запуска (bun run и т.п.) дублируют сигнал: одиночный Ctrl+C
// доходит дважды — напрямую от терминала + пересылка от обёртки.
// Дубликат в первые FORCE_EXIT_MS игнорируем; сигнал спустя паузу
// (реальное второе нажатие при зависшем shutdown) — форс-выход.
const FORCE_EXIT_MS = 2000;
let shuttingDown = false;
let firstSignalAt = 0;
async function shutdown(signal: string): Promise<void> {
  const now = Date.now();
  if (shuttingDown) {
    if (now - firstSignalAt < FORCE_EXIT_MS) {
      logger.debug('main', `Дубликат ${signal} — игнорирую, graceful уже идёт`);
      return;
    }
    // Повторный сигнал спустя паузу — немедленный выход (не ждём зависших операций)
    logger.warn('main', `Повторный ${signal} — немедленный выход`);
    process.exit(1);
  }
  shuttingDown = true;
  firstSignalAt = now;
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
