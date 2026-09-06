import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { type Logger, LogLevel, setGlobalLogger } from '@u7-scl/core/shared';
import { Role, type UserFacade } from '@u7-scl/user/domain';
import type { Api } from 'grammy';
import { AppController } from '../controllers/app/app-controller';
import { BOT_COMMANDS, registerBotCommands } from './commands';
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
  existing: unknown = actor,
): UserFacade & { registerGuest: ReturnType<typeof mock> } {
  return {
    getUserByTelegramId: mock(async () => existing),
    registerGuest: mock(async () => ({ uuid: 'new-guest' })),
  } as unknown as UserFacade & { registerGuest: ReturnType<typeof mock> };
}

function makeUiApp(
  opts: { adminTelegramIds?: number[]; userFacade?: UserFacade } = {},
): U7BotUiApp {
  const uiApp = new U7BotUiApp([new AppController(SCHOOL_URL)], {
    adminTelegramIds: opts.adminTelegramIds ?? [],
    userFacade: opts.userFacade ?? makeUserFacade(),
    botAdminUuid: BOT_ADMIN_UUID,
  });
  const resolve: {
    appApi: never;
    eventBus: never;
    actorResolver: () => Promise<User>;
    uiApp: unknown;
  } = {
    appApi: {} as never,
    eventBus: { subscribe: () => () => {} } as never,
    actorResolver: async () => actor,
    uiApp: undefined,
  };
  // AppController собирает меню через MenuAggregator — им и есть сам uiApp
  resolve.uiApp = uiApp;
  uiApp.init(resolve as never);
  return uiApp;
}

/** Доступ к protected handleAppCommand через подкласс-пробник. */
class ProbeUiApp extends U7BotUiApp {
  async probe(
    update: Parameters<U7BotUiApp['handleCommand']>[0],
    tgId: number,
    session: Parameters<U7BotUiApp['handleCommand']>[2],
  ) {
    return this.handleAppCommand(update, tgId, session);
  }
}

function makeProbeUiApp(
  opts: { adminTelegramIds?: number[]; userFacade?: UserFacade } = {},
): ProbeUiApp {
  return makeUiApp(opts) as ProbeUiApp;
}

function makeCommand(
  command: string,
  args = '',
  extra: { telegramId?: number; name?: string } = {},
) {
  return {
    type: 'command' as const,
    command,
    args,
    telegramId: extra.telegramId ?? 123,
    ...(extra.name ? { name: extra.name } : {}),
  };
}

describe('U7BotUiApp — экраны меню', () => {
  test('/start (buildMenuScreen): полное приветствие + меню', async () => {
    const uiApp = makeUiApp();
    const session = { dialog: { path: 'zz/old', seq: 4 } };

    const response = await uiApp.handleWelcome(123, session);

    expect(String(response.screen?.text)).toContain('Привет, Иван');
    expect(String(response.screen?.text)).toContain('u7 schools');
    expect(response.screen?.keyboard).toBeDefined();
    expect(session.dialog.path).toBe('app/menu');
    expect(session.dialog.seq).toBe(5);
  });

  test('/cancel (buildCancelMenuScreen): КОРОТКОЕ меню без приветствия', async () => {
    const uiApp = makeUiApp();
    const session = { dialog: { path: 'zz/old', seq: 4 } };

    const response = await uiApp.handleCancel(123, session);

    expect(String(response?.screen?.text)).toBe('Выберите действие:');
    expect(String(response?.screen?.text)).not.toContain('Привет');
    expect(response?.screen?.keyboard).toBeDefined();
    expect(session.dialog.path).toBe('app/menu');
    expect(session.dialog.seq).toBe(5);
  });

  test('клавиатура меню содержит кнопку «Помощь» с кодом app:help', async () => {
    const uiApp = makeUiApp();
    const session = { dialog: { path: 'zz/old', seq: 1 } };

    const response = await uiApp.handleCancel(123, session);

    const codes = response?.screen?.keyboard?.rows.flatMap((r) =>
      r.map((b) => b.code),
    );
    expect(codes).toContain('app:help');
  });
});

// ── appCommand-гейт (трек 1.1, ФР-4): словарь команд и правила u7 ──

describe('U7BotUiApp — appCommand-гейт', () => {
  describe('/log_level — скрытая админ-команда', () => {
    test('от НЕ-админа: тихий перехват (пустой ответ, без info/screen), уровень не меняется', async () => {
      const logger = makeLogger();
      setGlobalLogger(logger);
      const uiApp = makeProbeUiApp({ adminTelegramIds: [999] });

      const response = await uiApp.probe(
        makeCommand('log_level', 'debug'),
        123,
        {},
      );

      // Перехвачено (не null!), но тихо: реплики и экрана нет
      expect(response).not.toBeNull();
      expect(response?.info).toBeUndefined();
      expect(response?.screen).toBeUndefined();
      expect(logger.setLogLevel).not.toHaveBeenCalled();
    });

    test('от админа с аргументом: уровень изменён + info-подтверждение', async () => {
      const logger = makeLogger();
      setGlobalLogger(logger);
      const uiApp = makeProbeUiApp({ adminTelegramIds: [123] });

      const response = await uiApp.probe(
        makeCommand('log_level', 'debug'),
        123,
        {},
      );

      expect(logger.setLogLevel).toHaveBeenCalledWith(LogLevel.DEBUG);
      expect(String(response?.info?.text)).toContain('debug');
    });

    test('от админа без аргументов: инструкция использования', async () => {
      setGlobalLogger(makeLogger());
      const uiApp = makeProbeUiApp({ adminTelegramIds: [123] });

      const response = await uiApp.probe(makeCommand('log_level', ''), 123, {});

      expect(String(response?.info?.text)).toContain('Использование');
      expect(String(response?.info?.text)).toContain('log_level');
    });

    test('от админа с неизвестным уровнем: ошибка со списком уровней', async () => {
      setGlobalLogger(makeLogger());
      const uiApp = makeProbeUiApp({ adminTelegramIds: [123] });

      const response = await uiApp.probe(
        makeCommand('log_level', 'bogus'),
        123,
        {},
      );

      expect(String(response?.info?.text)).toContain('bogus');
      expect(String(response?.info?.text)).toContain('debug');
    });
  });

  describe('/help — правило «на меню — помощь по меню»', () => {
    test('активный диалог = меню → main-help (инструкция + описания кнопок)', async () => {
      const uiApp = makeProbeUiApp();
      const session = { dialog: { path: 'app/menu', seq: 2 } };

      const response = await uiApp.probe(makeCommand('help'), 123, session);

      expect(response).not.toBeNull();
      // main-help — сборка AppController.handleHelpMessage
      expect(String(response?.info?.text)).toContain('Как со мной работать');
      expect(response?.screen).toBeUndefined();
    });

    test('активный диалог ≠ меню → гейт пропускает (null): конвейер продолжится', async () => {
      const uiApp = makeProbeUiApp();
      const session = { dialog: { path: 'questionnaire/fill', seq: 2 } };

      const response = await uiApp.probe(makeCommand('help'), 123, session);

      expect(response).toBeNull();
    });

    test('диалог не открыт → гейт пропускает (null)', async () => {
      const uiApp = makeProbeUiApp();

      const response = await uiApp.probe(makeCommand('help'), 123, {});

      expect(response).toBeNull();
    });
  });

  describe('/start — гост-регистрация', () => {
    test('незнакомый tgId → регистрация гостя от имени бота, гейт пропускает (null)', async () => {
      const facade = makeUserFacade(undefined);
      const uiApp = makeProbeUiApp({ userFacade: facade });

      const response = await uiApp.probe(
        makeCommand('start', '', { telegramId: 777, name: 'Анна' }),
        777,
        {},
      );

      expect(facade.registerGuest).toHaveBeenCalledTimes(1);
      const [tgId, name, actorId] = facade.registerGuest.mock
        .calls[0] as unknown[];
      expect(tgId).toBe(777);
      expect(name).toBe('Анна');
      expect(actorId).toBe(BOT_ADMIN_UUID);
      expect(response).toBeNull();
    });

    test('знакомый пользователь → регистрация не вызывается', async () => {
      const facade = makeUserFacade(actor);
      const uiApp = makeProbeUiApp({ userFacade: facade });

      await uiApp.probe(makeCommand('start'), 123, {});

      expect(facade.registerGuest).not.toHaveBeenCalled();
    });
  });

  test('полный конвейер /start от нового пользователя: гость + welcome-меню', async () => {
    setGlobalLogger(makeLogger());
    const facade = makeUserFacade(undefined);
    const uiApp = makeUiApp({ userFacade: facade });
    const session = {} as Parameters<U7BotUiApp['handleCommand']>[2];

    const response = await uiApp.handleCommand(
      makeCommand('start', '', { telegramId: 777, name: 'Анна' }),
      777,
      session,
    );

    expect(facade.registerGuest).toHaveBeenCalledTimes(1);
    expect(String(response?.screen?.text)).toContain('Привет');
    expect(session.dialog?.path).toBe('app/menu');
    expect(session.dialog?.seq).toBe(1);
  });
});

describe('словарь команд бота (BOT_COMMANDS)', () => {
  test('публичные команды: start, help, cancel; log_level — скрытая', () => {
    const names = BOT_COMMANDS.map((c) => c.name);
    expect(names).toContain('start');
    expect(names).toContain('help');
    expect(names).toContain('cancel');
    const hidden = BOT_COMMANDS.filter((c) => c.hidden).map((c) => c.name);
    expect(hidden).toEqual(['log_level']);
  });

  test('registerBotCommands: в Telegram уходят только публичные команды', async () => {
    const api = { setMyCommands: mock(async () => true) } as unknown as Api;

    await registerBotCommands(api);

    const payload = (
      (api.setMyCommands as ReturnType<typeof mock>).mock.calls[0] as [
        { commands: { command: string }[] },
      ]
    )[0];
    const sent = payload.commands.map((c) => c.command);
    expect(sent).toEqual(['start', 'help', 'cancel']);
  });
});
