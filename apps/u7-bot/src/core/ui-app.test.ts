import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import {
  type Logger,
  LogLevel,
  type MdText,
  md,
  setGlobalLogger,
} from '@u7-scl/core/shared';
import type {
  BotSession,
  CommandReaction,
  CommandUpdate,
  DialogResponse,
} from '@u7-scl/core/ui';
import { Role, type UserFacade } from '@u7-scl/user/domain';
import { AppController } from '../controllers/app/app-controller';
import { U7BotController } from './u7-bot-controller';
import { U7BotUiStory } from './u7-bot-ui-story';
import { U7BotUiApp } from './ui-app';

const SCHOOL_URL = 'https://t.me/u7_school_group';
const BOT_ADMIN_UUID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

const actor: User = {
  uuid: 'user-1',
  name: 'Иван',
  telegramId: 123,
  roles: [Role.GUEST],
  createdAt: '2026-01-01T00:00:00.000Z',
};

function makeLogger(): Logger {
  return {
    debug: mock(() => {}),
    info: mock(() => {}),
    warn: mock(() => {}),
    error: mock(() => {}),
    setLogLevel: mock(() => {}),
    getLogLevel: mock(() => 0),
    setSourceLevel: mock(() => {}),
  } as unknown as Logger;
}

function makeUserFacade(
  existing?: unknown,
): UserFacade & { registerGuest: ReturnType<typeof mock> } {
  return {
    getUserByTelegramId: mock(async () => existing),
    registerGuest: mock(async () => ({ uuid: 'new-guest' })),
  } as unknown as UserFacade & { registerGuest: ReturnType<typeof mock> };
}

function makeCommand(
  command: string,
  args = '',
  extra: { telegramId?: number; name?: string } = {},
): CommandUpdate {
  return {
    type: 'command',
    command,
    args,
    telegramId: extra.telegramId ?? 123,
    ...(extra.name ? { name: extra.name } : {}),
  };
}

/** Контроллер-шпион: настраиваемая реакция в pipe. */
class SpyController extends U7BotController {
  name: string;
  commandReaction: CommandReaction = { reaction: 'pass' };
  commandCalls = 0;

  constructor(name = 'spy') {
    super();
    this.name = name;
  }

  override async handleCommand(): Promise<CommandReaction> {
    this.commandCalls++;
    return this.commandReaction;
  }
}

/** Стори с настраиваемой контекстной справкой (для /help). */
class HelpStory extends U7BotUiStory {
  readonly name = 'fill';
  help: MdText | null = null;

  override handleCallback(): Promise<DialogResponse> {
    throw new Error('Не используется');
  }
  override async contextHelp(): Promise<MdText | null> {
    return this.help;
  }
}

/** Контроллер с одной стори (dialog.path = questionnaire/fill). */
class HelpController extends U7BotController {
  readonly name = 'questionnaire';

  constructor(story: U7BotUiStory) {
    super();
    this.stories.push(story);
  }
}

function makeUiApp(
  opts: {
    adminTelegramIds?: number[];
    userFacade?: UserFacade;
    spy?: SpyController;
    extra?: U7BotController[];
  } = {},
): U7BotUiApp {
  const controllers: U7BotController[] = [
    new AppController(SCHOOL_URL, opts.adminTelegramIds ?? []),
  ];
  if (opts.spy) controllers.push(opts.spy);
  if (opts.extra) controllers.push(...opts.extra);
  const uiApp = new U7BotUiApp(controllers);
  uiApp.init({
    appApi: {} as never,
    eventBus: { subscribe: () => () => {} } as never,
    actorResolver: async () => actor,
    userFacade: opts.userFacade ?? makeUserFacade(),
    botAdminUuid: BOT_ADMIN_UUID,
  } as never);
  return uiApp;
}

// ── /start: напрямую в uiApp, без pipe (ФР-4, ревизия 2.1) ──

describe('U7BotUiApp — /start', () => {
  test('гость регистрируется, диалог reopen меню seq++, welcome из menuButtons', async () => {
    setGlobalLogger(makeLogger());
    const facade = makeUserFacade(undefined);
    const spy = new SpyController();
    const uiApp = makeUiApp({ userFacade: facade, spy });
    const session = { dialog: { path: 'zz/old', seq: 4 } } as BotSession;

    const response = await uiApp.handleCommand(
      makeCommand('start', '', { telegramId: 777, name: 'Анна' }),
      777,
      session,
    );

    expect(facade.registerGuest).toHaveBeenCalledTimes(1);
    const [tgId, name, actorId] = facade.registerGuest.mock
      .calls[0] as unknown[];
    expect(tgId).toBe(777);
    expect(name).toBe('Анна');
    expect(actorId).toBe(BOT_ADMIN_UUID);

    // welcome-экран: приветствие + клавиатура menuButtons
    expect(String(response?.screen?.text)).toContain('Привет');
    expect(String(response?.screen?.text)).toContain('u7 schools');
    const codes = response?.screen?.keyboard?.rows.flatMap((r) =>
      r.map((b) => [b.code, b.url]),
    );
    expect(codes).toContainEqual(['app:help', undefined]);
    expect(codes).toContainEqual(['', SCHOOL_URL]);
    // reopen: seq++ даже с чужого пути
    expect(session.dialog?.path).toBe('app/menu');
    expect(session.dialog?.seq).toBe(5);
    // pipe не задействуется: контроллеры не опрашиваются
    expect(spy.commandCalls).toBe(0);
  });

  test('знакомый пользователь → регистрация не вызывается', async () => {
    setGlobalLogger(makeLogger());
    const facade = makeUserFacade(actor);
    const uiApp = makeUiApp({ userFacade: facade });

    await uiApp.handleCommand(makeCommand('start'), 123, {} as BotSession);

    expect(facade.registerGuest).not.toHaveBeenCalled();
  });

  test('первый /start при закрытом диалоге → меню с seq=1', async () => {
    setGlobalLogger(makeLogger());
    const uiApp = makeUiApp();
    const session = {} as BotSession;

    await uiApp.handleCommand(makeCommand('start'), 123, session);

    expect(session.dialog?.path).toBe('app/menu');
    expect(session.dialog?.seq).toBe(1);
  });

  test('повторный /start — reopen: seq++ даже «меню → меню»', async () => {
    setGlobalLogger(makeLogger());
    const uiApp = makeUiApp();
    const session = { dialog: { path: 'app/menu', seq: 5 } } as BotSession;

    await uiApp.handleCommand(makeCommand('start'), 123, session);

    expect(session.dialog?.seq).toBe(6);
  });
});

// ── дефолты u7 после пустого pipe ──

describe('U7BotUiApp — дефолты команд', () => {
  test('/help при пустом pipe → общий help: инструкция + описания menuButtons', async () => {
    setGlobalLogger(makeLogger());
    const uiApp = makeUiApp();
    const session = { dialog: { path: 'app/menu', seq: 2 } } as BotSession;

    const response = await uiApp.handleCommand(
      makeCommand('help'),
      123,
      session,
    );

    expect(String(response?.notify?.text)).toContain('Как со мной работать');
    // описание кнопки сообщества — из menuButtons
    expect(String(response?.notify?.text)).toContain('Сообщество школы');
    expect(response?.screen).toBeUndefined();
    // диалог не тронут
    expect(session.dialog?.seq).toBe(2);
  });

  test('/help при закрытом диалоге → общий help (без фиктивной сессии)', async () => {
    setGlobalLogger(makeLogger());
    const uiApp = makeUiApp();

    const response = await uiApp.handleCommand(
      makeCommand('help'),
      123,
      {} as BotSession,
    );

    expect(String(response?.notify?.text)).toContain('Как со мной работать');
  });

  test('/cancel при пустом pipe → reopen меню + КОРОТКОЕ меню без приветствия', async () => {
    setGlobalLogger(makeLogger());
    const uiApp = makeUiApp();
    const session = { dialog: { path: 'zz/old', seq: 4 } } as BotSession;

    const response = await uiApp.handleCommand(
      makeCommand('cancel'),
      123,
      session,
    );

    expect(String(response?.screen?.text)).toBe('Выберите действие:');
    expect(String(response?.screen?.text)).not.toContain('Привет');
    expect(response?.screen?.keyboard).toBeDefined();
    expect(session.dialog?.path).toBe('app/menu');
    expect(session.dialog?.seq).toBe(5);
  });

  test('неизвестная команда при пустом pipe → info-подсказка, диалог не тронут', async () => {
    setGlobalLogger(makeLogger());
    const uiApp = makeUiApp();
    const session = { dialog: { path: 'app/menu', seq: 2 } } as BotSession;

    const response = await uiApp.handleCommand(
      makeCommand('foo'),
      123,
      session,
    );

    expect(String(response?.notify?.text)).toContain('Неизвестная команда');
    expect(response?.screen).toBeUndefined();
    expect(session.dialog?.seq).toBe(2);
  });
});

// ── pipe поверх дефолтов: ответ контроллера/стори побеждает дефолт ──

describe('U7BotUiApp — pipe перед дефолтами', () => {
  test('/cancel с ответом стори: notify сохраняется + экран меню (seq++)', async () => {
    setGlobalLogger(makeLogger());
    const spy = new SpyController();
    spy.commandReaction = {
      reaction: 'stop',
      response: { notify: { text: md`Отменено. Наберите /start` } },
    };
    const uiApp = makeUiApp({ spy });
    const session = {
      dialog: { path: 'questionnaire/fill', seq: 7 },
    } as BotSession;

    const response = await uiApp.handleCommand(
      makeCommand('cancel'),
      123,
      session,
    );

    // notify стори сохранён...
    expect(String(response?.notify?.text)).toBe('Отменено. Наберите /start');
    // ...и дополнен экраном меню: прежняя клавиатура умерла вместе с seq++
    expect(String(response?.screen?.text)).toBe('Выберите действие:');
    const codes = response?.screen?.keyboard?.rows.flatMap((r) =>
      r.map((b) => b.code),
    );
    expect(codes).toContain('app:help');
    // глобальный сброс диалога — всегда
    expect(session.dialog?.path).toBe('app/menu');
    expect(session.dialog?.seq).toBe(8);
  });

  test('/cancel с ответом стори, содержащим screen — экран стори, меню не добавляется', async () => {
    setGlobalLogger(makeLogger());
    const spy = new SpyController();
    spy.commandReaction = {
      reaction: 'stop',
      response: { screen: { text: md`Экран стори` } },
    };
    const uiApp = makeUiApp({ spy });
    const session = {
      dialog: { path: 'questionnaire/fill', seq: 7 },
    } as BotSession;

    const response = await uiApp.handleCommand(
      makeCommand('cancel'),
      123,
      session,
    );

    expect(String(response?.screen?.text)).toBe('Экран стори');
    expect(session.dialog?.seq).toBe(8);
  });

  test('/help активной стори со справкой → ТОЛЬКО её контекстная справка', async () => {
    setGlobalLogger(makeLogger());
    const story = new HelpStory();
    story.help = md`Вы в анкете, вопрос 3 из 10`;
    const uiApp = makeUiApp({ extra: [new HelpController(story)] });

    const response = await uiApp.handleCommand(makeCommand('help'), 123, {
      dialog: { path: 'questionnaire/fill', seq: 2 },
    } as BotSession);

    expect(String(response?.notify?.text)).toBe('Вы в анкете, вопрос 3 из 10');
  });

  test('/help активной стори БЕЗ справки → общий help (fallback)', async () => {
    setGlobalLogger(makeLogger());
    const uiApp = makeUiApp({ extra: [new HelpController(new HelpStory())] });

    const response = await uiApp.handleCommand(makeCommand('help'), 123, {
      dialog: { path: 'questionnaire/fill', seq: 2 },
    } as BotSession);

    expect(String(response?.notify?.text)).toContain('Как со мной работать');
  });

  test('/help при неактивной стори → общий help, даже при наличии справки', async () => {
    setGlobalLogger(makeLogger());
    const story = new HelpStory();
    story.help = md`Справка анкеты`;
    const uiApp = makeUiApp({ extra: [new HelpController(story)] });

    // чужой диалог — вопрос активности решает uiApp, не стори
    const response = await uiApp.handleCommand(makeCommand('help'), 123, {
      dialog: { path: 'zz/old', seq: 2 },
    } as BotSession);

    expect(String(response?.notify?.text)).toContain('Как со мной работать');
  });

  test('/log_level от админа через app-контроллер → stop{info}, уровень изменён', async () => {
    const logger = makeLogger();
    setGlobalLogger(logger);
    const uiApp = makeUiApp({ adminTelegramIds: [123] });

    const response = await uiApp.handleCommand(
      makeCommand('log_level', 'debug'),
      123,
      {} as BotSession,
    );

    expect(logger.setLogLevel).toHaveBeenCalledWith(LogLevel.DEBUG);
    expect(String(response?.notify?.text)).toContain('debug');
  });

  test('/log_level от НЕ-админа → тишина: пустой ответ без реплики', async () => {
    setGlobalLogger(makeLogger());
    const uiApp = makeUiApp({ adminTelegramIds: [999] });

    const response = await uiApp.handleCommand(
      makeCommand('log_level', 'debug'),
      123,
      {} as BotSession,
    );

    expect(response).toEqual({});
  });
});

// ── системные кнопки app:main-menu / app:help (экс-ветки AppController) ──

describe('U7BotUiApp — системные кнопки', () => {
  test('app:main-menu → вход в меню-диалог (seq++ с чужого пути) + экран меню', async () => {
    setGlobalLogger(makeLogger());
    const uiApp = makeUiApp();
    const session = { dialog: { path: 'zz/old', seq: 3 } } as BotSession;

    const response = await uiApp.handleCallback('app:main-menu', 123, session);

    expect(String(response?.screen?.text)).toBe('Выберите действие:');
    expect(response?.screen?.keyboard).toBeDefined();
    expect(session.dialog?.path).toBe('app/menu');
    expect(session.dialog?.seq).toBe(4);
  });

  test('app:main-menu из меню → seq не растёт (switch на тот же путь)', async () => {
    setGlobalLogger(makeLogger());
    const uiApp = makeUiApp();
    const session = { dialog: { path: 'app/menu', seq: 3 } } as BotSession;

    await uiApp.handleCallback('app:main-menu', 123, session);

    expect(session.dialog?.seq).toBe(3);
  });

  test('app:help → общий help info-репликой, диалог не тронут', async () => {
    setGlobalLogger(makeLogger());
    const uiApp = makeUiApp();
    const session = { dialog: { path: 'app/menu', seq: 3 } } as BotSession;

    const response = await uiApp.handleCallback('app:help', 123, session);

    expect(String(response?.notify?.text)).toContain('Как со мной работать');
    expect(response?.screen).toBeUndefined();
    expect(session.dialog?.seq).toBe(3);
  });
});
