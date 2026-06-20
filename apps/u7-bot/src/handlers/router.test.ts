import { describe, expect, mock, test } from 'bun:test';
import type { BotResponse, MainMenuAction, SessionData } from '@u7-scl/core/ui';
import { BotController, BotRouter } from '@u7-scl/core/ui';
import type { User, UserFacade } from '@u7-scl/user/domain';
import type { Composer } from 'grammy';
import type { BotContext } from '../context';
import { connectRouter, resolveUser } from './router';

// ── Вспомогательные фабрики ──

type MockBot = Composer<BotContext> & {
  commands: Record<string, (ctx: BotContext) => Promise<void>>;
  listeners: Record<
    string,
    ((ctx: BotContext, next?: () => Promise<void>) => Promise<void>)[]
  >;
};

function makeMockBot(): MockBot {
  const commands: Record<string, (ctx: BotContext) => Promise<void>> = {};
  const listeners: Record<
    string,
    ((ctx: BotContext, next?: () => Promise<void>) => Promise<void>)[]
  > = {};

  const bot = {
    command: mock(
      (name: string, handler: (ctx: BotContext) => Promise<void>) => {
        commands[name] = handler;
      },
    ),
    on: mock(
      (
        event: string,
        handler: (ctx: BotContext, next?: () => Promise<void>) => Promise<void>,
      ) => {
        if (!listeners[event]) {
          listeners[event] = [];
        }
        listeners[event]!.push(handler);
      },
    ),
    commands,
    listeners,
  } as unknown as MockBot;

  return bot;
}

function makeMockContext(overrides: Partial<BotContext> = {}): BotContext {
  return {
    from: { id: 123, first_name: 'Тест', is_bot: false } as BotContext['from'],
    chat: { id: 123, type: 'private' } as BotContext['chat'],
    message: {
      message_id: 1,
      text: '',
      date: 0,
      chat: { id: 123, type: 'private' },
    } as BotContext['message'],
    callbackQuery: {
      id: 'cq-1',
      data: '',
      from: { id: 123, first_name: 'Тест', is_bot: false } as NonNullable<
        BotContext['from']
      >,
      chat_instance: 'ci-1',
    } as BotContext['callbackQuery'],
    reply: mock(async () => ({
      message_id: 99,
    })) as unknown as BotContext['reply'],
    api: {
      editMessageText: mock(async () => ({
        message_id: 1,
      })) as unknown as BotContext['api']['editMessageText'],
    } as BotContext['api'],
    answerCallbackQuery: mock(
      async () => { },
    ) as unknown as BotContext['answerCallbackQuery'],
    session: { activeHandler: null } as SessionData,
    ...overrides,
  } as unknown as BotContext;
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    uuid: 'test-uuid',
    name: 'Тест',
    telegramId: 123,
    roles: ['GUEST'],
    createdAt: new Date().toISOString(),
    ...overrides,
  } as User;
}

function makeMockUserFacade(user?: User): UserFacade {
  return {
    getUserByUuid: mock(async () => user),
    userExists: mock(async () => !!user),
    addRoleToUser: mock(async () => user),
    updateUserRole: mock(async () => user),
    getUserByTelegramId: mock(async () => user ?? undefined),
    removeRoleFromUser: mock(async () => user),
    registerGuest: mock(async () => user ?? makeUser()),
  } as unknown as UserFacade;
}

class MockController extends BotController {
  name = 'mock';

  constructor() {
    super({} as never);
  }

  private _startResult: MainMenuAction[] = [];
  private _callbackResult: BotResponse = {};
  private _messageResult: BotResponse = {};
  private _cancelResult: BotResponse = { releaseInput: true };
  private _timeoutResult: BotResponse = { releaseInput: true };

  handleStartCalls: unknown[][] = [];
  handleCallbackCalls: unknown[][] = [];
  handleMessageCalls: unknown[][] = [];
  handleCancelCalls: unknown[][] = [];
  handleTimeoutCalls: unknown[][] = [];

  setStartResult(items: MainMenuAction[]) {
    this._startResult = items;
  }
  setCallbackResult(res: BotResponse) {
    this._callbackResult = res;
  }
  setMessageResult(res: BotResponse) {
    this._messageResult = res;
  }
  setCancelResult(res: BotResponse) {
    this._cancelResult = res;
  }
  setTimeoutResult(res: BotResponse) {
    this._timeoutResult = res;
  }

  private _helpResult: string | null = null;
  setHelpResult(text: string | null) {
    this._helpResult = text;
  }
  override handleHelpStart = async (): Promise<string | null> =>
    this._helpResult;

  private _welcomeResult: BotResponse | null = null;
  setWelcomeResult(res: BotResponse | null) {
    this._welcomeResult = res;
  }
  override async handleWelcome(): Promise<BotResponse | null> {
    return this._welcomeResult;
  }

  private _helpMessageResult: BotResponse | null = null;
  setHelpMessageResult(res: BotResponse | null) {
    this._helpMessageResult = res;
  }
  override async handleHelpMessage(): Promise<BotResponse | null> {
    return this._helpMessageResult;
  }

  override async handleStart(actor: unknown): Promise<MainMenuAction[]> {
    this.handleStartCalls.push([actor]);
    return this._startResult;
  }

  override async handleCallback(
    data: string,
    actor: unknown,
    session: SessionData,
  ): Promise<BotResponse> {
    this.handleCallbackCalls.push([data, actor, session]);
    return this._callbackResult;
  }

  override async handleMessage(
    update: unknown,
    actor: unknown,
    session: SessionData,
  ): Promise<BotResponse> {
    this.handleMessageCalls.push([update, actor, session]);
    return this._messageResult;
  }

  override async handleCancel(
    actor: unknown,
    session: SessionData,
  ): Promise<BotResponse> {
    this.handleCancelCalls.push([actor, session]);
    return this._cancelResult;
  }

  override async handleTimeout(
    actor: unknown,
    session: SessionData,
  ): Promise<BotResponse> {
    this.handleTimeoutCalls.push([actor, session]);
    return this._timeoutResult;
  }
}

// ── resolveUser ──

describe('resolveUser', () => {
  test('возвращает существующего пользователя по telegramId', async () => {
    const existingUser = makeUser({ uuid: 'existing-uuid', telegramId: 999 });
    const userFacade = makeMockUserFacade(existingUser);
    (userFacade.registerGuest as any) = mock(async () => {
      throw new Error('Не должен вызываться');
    });

    const user = await resolveUser(userFacade, 999, 'admin-uuid');

    expect(user).toEqual(existingUser);
    expect(userFacade.getUserByTelegramId).toHaveBeenCalledWith(999);
  });

  test('регистрирует гостя, если пользователь не найден', async () => {
    const newGuest = makeUser({
      uuid: 'new-guest',
      telegramId: 888,
      name: 'Гость',
    });
    const registerGuestMock = mock(async () => newGuest);
    const userFacade: UserFacade = {
      ...makeMockUserFacade(),
      getUserByTelegramId: mock(async () => undefined),
      registerGuest: registerGuestMock,
    } as unknown as UserFacade;

    const user = await resolveUser(userFacade, 888, 'admin-uuid', 'Гость');

    expect(user).toEqual(newGuest);
    expect(userFacade.getUserByTelegramId).toHaveBeenCalledWith(888);
    expect(registerGuestMock).toHaveBeenCalledWith(888, 'Гость', 'admin-uuid');
  });
});

// ── connectRouter (Grammy-адаптер) ──

describe('connectRouter', () => {
  test('/start делегирует в AppController.handleWelcome', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser({ name: 'Тест' }));

    const appCtrl = new MockController();
    appCtrl.name = 'app';
    appCtrl.setWelcomeResult({
      sendMessage: {
        text: 'Привет, Тест! 👋\n\nВыберите раздел:',
        keyboard: { rows: [[{ text: 'Кнопка', code: 'app:action' }]], isMultiple: false },
      },
    });

    const router = new BotRouter([appCtrl]);
    connectRouter(bot, router, userFacade, 'admin-uuid');

    const ctx = makeMockContext();
    await bot.commands.start!(ctx);

    expect(ctx.reply).toHaveBeenCalled();
    const replyCall = (ctx.reply as any).mock.calls[0];
    expect(replyCall[0]).toContain('Привет');
    expect(replyCall[0]).toContain('Тест');
    expect(replyCall[1].reply_markup).toBeDefined();
  });

  test('/start сбрасывает activeHandler', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser());

    const appCtrl = new MockController();
    appCtrl.name = 'app';
    appCtrl.setWelcomeResult({ sendMessage: { text: 'Привет!' } });

    const router = new BotRouter([appCtrl]);
    connectRouter(bot, router, userFacade, 'admin-uuid');

    const ctx = makeMockContext();
    ctx.session.activeHandler = { path: 'app/some' };

    await bot.commands.start!(ctx);

    expect(ctx.session.activeHandler).toBeNull();
  });

  test('callback маршрутизируется по префиксу', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser());

    const ctrl = new MockController();
    ctrl.name = 'stream';
    ctrl.setCallbackResult({ sendMessage: { text: 'Ответ от stream' } });

    const router = new BotRouter([ctrl]);
    connectRouter(bot, router, userFacade, 'admin-uuid');

    const handler = bot.listeners['callback_query:data']?.[0];
    expect(handler).toBeDefined();

    const ctx = makeMockContext();
    ctx.callbackQuery!.data = 'stream:catalog:list';

    await handler!(ctx);

    expect(ctrl.handleCallbackCalls.length).toBe(1);
    expect(ctrl.handleCallbackCalls[0]![0]).toBe('catalog:list');
    expect(ctx.reply).toHaveBeenCalled();
  });

  test('неизвестный префикс → ошибка', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser());

    const ctrl = new MockController();
    ctrl.name = 'stream';

    const router = new BotRouter([ctrl]);
    connectRouter(bot, router, userFacade, 'admin-uuid');

    const handler = bot.listeners['callback_query:data']?.[0];
    const ctx = makeMockContext();
    ctx.callbackQuery!.data = 'unknown:action';

    await handler!(ctx);

    const replyCall = (ctx.reply as any).mock.calls[0];
    expect(replyCall[0]).toContain('Неизвестная команда');
    expect(ctrl.handleCallbackCalls.length).toBe(0);
  });

  test('/cancel с активным обработчиком', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser());

    const ctrl = new MockController();
    ctrl.name = 'stream';
    ctrl.setCancelResult({
      releaseInput: true,
      sendMessage: { text: 'Отменено' },
    });

    const router = new BotRouter([ctrl]);
    connectRouter(bot, router, userFacade, 'admin-uuid');

    const ctx = makeMockContext();
    ctx.session.activeHandler = { path: 'stream/some-path' };

    await bot.commands.cancel!(ctx);

    expect(ctrl.handleCancelCalls.length).toBe(1);
    expect(ctx.session.activeHandler).toBeNull();
  });

  test('/cancel без активного обработчика', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser());

    const ctrl = new MockController();
    ctrl.name = 'stream';

    const router = new BotRouter([ctrl]);
    connectRouter(bot, router, userFacade, 'admin-uuid');

    const ctx = makeMockContext();
    ctx.session.activeHandler = null;

    await bot.commands.cancel!(ctx);

    expect(ctrl.handleCancelCalls.length).toBe(0);
    expect(ctx.reply).toHaveBeenCalled();
    const replyCall = (ctx.reply as any).mock.calls[0];
    expect(replyCall[0]).toContain('Нечего отменять');
  });

  test('captureInput → последующие сообщения идут в контроллер', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser());

    const ctrl = new MockController();
    ctrl.name = 'onboarding';
    ctrl.setCallbackResult({
      captureInput: { path: 'ask-name' },
    });
    ctrl.setMessageResult({ sendMessage: { text: 'Имя получено' } });

    const router = new BotRouter([ctrl]);
    connectRouter(bot, router, userFacade, 'admin-uuid');

    const cbHandler = bot.listeners['callback_query:data']?.[0];
    const ctx1 = makeMockContext();
    ctx1.callbackQuery!.data = 'onboarding:start';
    await cbHandler!(ctx1);

    expect(ctx1.session.activeHandler).not.toBeNull();
    expect(ctx1.session.activeHandler!.path).toBe('onboarding/ask-name');

    const msgHandler = bot.listeners['message:text']?.[0];
    const ctx2 = makeMockContext();
    ctx2.session.activeHandler = { path: 'onboarding/ask-name' };
    ctx2.message!.text = 'Иван';

    const nextSpy = mock(async () => { });
    await msgHandler!(ctx2, nextSpy);

    expect(nextSpy).not.toHaveBeenCalled();
    expect(ctrl.handleMessageCalls.length).toBe(1);
  });

  test('releaseInput → сессия очищается', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser());

    const ctrl = new MockController();
    ctrl.name = 'onboarding';
    ctrl.setMessageResult({
      releaseInput: true,
      sendMessage: { text: 'Готово' },
    });

    const router = new BotRouter([ctrl]);
    connectRouter(bot, router, userFacade, 'admin-uuid');

    const msgHandler = bot.listeners['message:text']?.[0];
    const ctx = makeMockContext();
    ctx.session.activeHandler = { path: 'onboarding/ask-name' };
    ctx.message!.text = 'Иван';

    await msgHandler!(
      ctx,
      mock(async () => { }),
    );

    expect(ctx.session.activeHandler).toBeNull();
  });

  test('чужой callback при активном обработчике → отказ', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser());

    const ctrl1 = new MockController();
    ctrl1.name = 'onboarding';
    const ctrl2 = new MockController();
    ctrl2.name = 'stream';

    const router = new BotRouter([ctrl1, ctrl2]);
    connectRouter(bot, router, userFacade, 'admin-uuid');

    const handler = bot.listeners['callback_query:data']?.[0];
    const ctx = makeMockContext();
    ctx.session.activeHandler = { path: 'onboarding/ask-name' };
    ctx.callbackQuery!.data = 'stream:catalog:list';

    await handler!(ctx);

    expect(ctx.answerCallbackQuery).toHaveBeenCalled();
    const answerCall = (ctx.answerCallbackQuery as any).mock.calls[0];
    expect(answerCall[0].text).toContain('завершите текущее действие');
    expect(answerCall[0].show_alert).toBe(true);
    expect(ctrl2.handleCallbackCalls.length).toBe(0);
  });

  test('таймаут → handleTimeout', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser());

    const ctrl = new MockController();
    ctrl.name = 'onboarding';
    ctrl.setTimeoutResult({
      releaseInput: true,
      sendMessage: { text: 'Время истекло' },
    });

    const router = new BotRouter([ctrl]);
    connectRouter(bot, router, userFacade, 'admin-uuid');

    const msgHandler = bot.listeners['message:text']?.[0];
    const ctx = makeMockContext();
    ctx.session.activeHandler = {
      path: 'onboarding/ask-name',
      expiresAt: Date.now() - 1000,
    };
    ctx.message!.text = 'Любое сообщение';

    await msgHandler!(
      ctx,
      mock(async () => { }),
    );

    expect(ctrl.handleTimeoutCalls.length).toBe(1);
    expect(ctx.session.activeHandler).toBeNull();
  });

  test('сообщение без активного обработчика → next()', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser());

    const ctrl = new MockController();
    ctrl.name = 'stream';

    const router = new BotRouter([ctrl]);
    connectRouter(bot, router, userFacade, 'admin-uuid');

    const msgHandler = bot.listeners['message:text']?.[0];
    const ctx = makeMockContext();
    ctx.session.activeHandler = null;
    ctx.message!.text = 'Привет';

    const nextSpy = mock(async () => { });
    await msgHandler!(ctx, nextSpy);

    expect(nextSpy).toHaveBeenCalled();
    expect(ctrl.handleMessageCalls.length).toBe(0);
  });

  test('сообщение-команда → next() даже с активным обработчиком', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser());

    const ctrl = new MockController();
    ctrl.name = 'onboarding';

    const router = new BotRouter([ctrl]);
    connectRouter(bot, router, userFacade, 'admin-uuid');

    const msgHandler = bot.listeners['message:text']?.[0];
    const ctx = makeMockContext();
    ctx.session.activeHandler = { path: 'onboarding/ask-name' };
    ctx.message!.text = '/help';

    const nextSpy = mock(async () => { });
    await msgHandler!(ctx, nextSpy);

    expect(nextSpy).toHaveBeenCalled();
    expect(ctrl.handleMessageCalls.length).toBe(0);
  });

  test('интеграционный: полный цикл /start → callback → captureInput → /cancel', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser({ name: 'Тест' }));

    const appCtrl = new MockController();
    appCtrl.name = 'app';
    appCtrl.setWelcomeResult({
      sendMessage: {
        text: 'Привет, Тест! 👋',
        keyboard: { rows: [[{ text: 'Начать', code: 'app:start' }]], isMultiple: false },
      },
    });

    const ctrl = new MockController();
    ctrl.name = 'main';
    ctrl.setStartResult([
      { kind: 'callback', text: 'Начать', action: 'main:start-action', priority: 1 },
    ]);
    ctrl.setCallbackResult({
      sendMessage: { text: 'Введите имя:' },
      captureInput: { path: 'ask-name', ttlSeconds: 60 },
    });
    ctrl.setMessageResult({
      releaseInput: true,
      sendMessage: { text: 'Спасибо! Имя получено.' },
    });
    ctrl.setCancelResult({ releaseInput: true });

    const router = new BotRouter([appCtrl, ctrl]);
    connectRouter(bot, router, userFacade, 'admin-uuid');

    // Шаг 1: /start
    const ctx1 = makeMockContext();
    await bot.commands.start!(ctx1);
    expect(ctx1.reply).toHaveBeenCalled();
    const startCall = (ctx1.reply as any).mock.calls[0];
    expect(startCall[0]).toContain('Привет');
    expect(startCall[1].reply_markup).toBeDefined();

    // Шаг 2: callback → captureInput
    const cbHandler = bot.listeners['callback_query:data']![0]!;
    const ctx2 = makeMockContext();
    ctx2.callbackQuery!.data = 'main:start-action';
    await cbHandler(ctx2);
    expect(ctx2.session.activeHandler).not.toBeNull();
    expect(ctx2.session.activeHandler!.path).toBe('main/ask-name');

    // Шаг 3: message → handleMessage
    const msgHandler = bot.listeners['message:text']![0]!;
    const ctx3 = makeMockContext();
    ctx3.session.activeHandler = { path: 'main/ask-name' };
    ctx3.message!.text = 'Иван';
    const nextSpy = mock(async () => { });
    await msgHandler(ctx3, nextSpy);
    expect(nextSpy).not.toHaveBeenCalled();
    expect(ctrl.handleMessageCalls.length).toBe(1);
    expect(ctx3.session.activeHandler).toBeNull();

    // Шаг 4: /cancel без активного обработчика
    const ctx4 = makeMockContext();
    ctx4.session.activeHandler = null;
    await bot.commands.cancel!(ctx4);
    const cancelCall = (ctx4.reply as any).mock.calls[0];
    expect(cancelCall[0]).toContain('Нечего отменять');
  });

  // ── Команда /help ──

  test('/help делегирует в AppController.handleHelpMessage', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser());

    const appCtrl = new MockController();
    appCtrl.name = 'app';
    appCtrl.setHelpMessageResult({
      sendMessage: { text: 'Как со мной работать? 🤔\n\n📚 Наши потоки — каталог учебных потоков\n\n📝 Заполнить анкету — расскажи о своих ожиданиях' },
    });

    const router = new BotRouter([appCtrl]);
    connectRouter(bot, router, userFacade, 'admin-uuid');

    const ctx = makeMockContext();
    await bot.commands.help!(ctx);

    const replyCall = (ctx.reply as any).mock.calls[0];
    expect(replyCall[0]).toContain('Как со мной работать?');
    expect(replyCall[0]).toContain('📚 Наши потоки');
    expect(replyCall[0]).toContain('📝 Заполнить анкету');
  });

  test('/help без контроллера app — fallback', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser());

    const router = new BotRouter([]);
    connectRouter(bot, router, userFacade, 'admin-uuid');

    const ctx = makeMockContext();
    await bot.commands.help!(ctx);

    const replyCall = (ctx.reply as any).mock.calls[0];
    expect(replyCall[0]).toContain('Нет доступных');
  });

  // ── app:main-menu → AppController callback ──

  test('app:main-menu делегирует в контроллер app', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser());

    const appCtrl = new MockController();
    appCtrl.name = 'app';
    appCtrl.setCallbackResult({
      sendMessage: {
        text: 'Выберите действие:',
        keyboard: { rows: [[{ text: 'Потоки', code: 'stream:catalog' }]], isMultiple: false },
      },
    });

    const router = new BotRouter([appCtrl]);
    connectRouter(bot, router, userFacade, 'admin-uuid');

    const handler = bot.listeners['callback_query:data']?.[0];
    const ctx = makeMockContext();
    ctx.callbackQuery!.data = 'app:main-menu';

    await handler!(ctx);

    expect(appCtrl.handleCallbackCalls.length).toBe(1);
    expect(appCtrl.handleCallbackCalls[0]![0]).toBe('main-menu');
    expect(ctx.reply).toHaveBeenCalled();
    const replyCall = (ctx.reply as any).mock.calls[0];
    expect(replyCall[0]).toContain('Выберите действие');
    expect(replyCall[1].reply_markup).toBeDefined();
  });
});
