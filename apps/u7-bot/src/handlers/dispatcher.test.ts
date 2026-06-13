import { describe, expect, mock, test } from 'bun:test';
import { BotController } from '@u7-scl/core/ui';
import type { BotResponse, MainMenuAction } from '@u7-scl/core/ui';
import type { Logger } from '@u7-scl/core/shared';
import type { User, UserFacade } from '@u7-scl/user/domain';
import type { Composer } from 'grammy';
import type { BotContext, SessionData } from '../context';
import { registerDispatcher, resolveUser } from './dispatcher';

// ── Вспомогательные фабрики ──

function makeMockLogger(): Logger {
  return {
    debug: mock(),
    info: mock(),
    warn: mock(),
    error: mock(),
    setLogLevel: mock(),
    getLogLevel: mock(() => 0),
    setSourceLevel: mock(),
  } as unknown as Logger;
}

type MockBot = Composer<BotContext> & {
  commands: Record<string, (ctx: BotContext) => Promise<void>>;
  listeners: Record<string, ((ctx: BotContext, next?: () => Promise<void>) => Promise<void>)[]>;
};

function makeMockBot(): MockBot {
  const commands: Record<string, (ctx: BotContext) => Promise<void>> = {};
  const listeners: Record<string, ((ctx: BotContext, next?: () => Promise<void>) => Promise<void>)[]> = {};

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
    message: { message_id: 1, text: '', date: 0, chat: { id: 123, type: 'private' } } as BotContext['message'],
    callbackQuery: {
      id: 'cq-1',
      data: '',
      from: { id: 123, first_name: 'Тест', is_bot: false } as NonNullable<BotContext['from']>,
      chat_instance: 'ci-1',
    } as BotContext['callbackQuery'],
    reply: mock(async () => ({ message_id: 99 })) as unknown as BotContext['reply'],
    api: {
      editMessageText: mock(async () => ({ message_id: 1 })) as unknown as BotContext['api']['editMessageText'],
    } as BotContext['api'],
    answerCallbackQuery: mock(async () => {}) as unknown as BotContext['answerCallbackQuery'],
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

  private _handleStartResult: MainMenuAction[] = [];
  private _handleCallbackResult: BotResponse = {};
  private _handleMessageResult: BotResponse = {};
  private _handleCancelResult: BotResponse = { releaseInput: true };
  private _handleTimeoutResult: BotResponse = { releaseInput: true };

  handleStartCalls: unknown[][] = [];
  handleCallbackCalls: unknown[][] = [];
  handleMessageCalls: unknown[][] = [];
  handleCancelCalls: unknown[][] = [];
  handleTimeoutCalls: unknown[][] = [];

  setStartResult(items: MainMenuAction[]) { this._handleStartResult = items; }
  setCallbackResult(res: BotResponse) { this._handleCallbackResult = res; }
  setMessageResult(res: BotResponse) { this._handleMessageResult = res; }
  setCancelResult(res: BotResponse) { this._handleCancelResult = res; }
  setTimeoutResult(res: BotResponse) { this._handleTimeoutResult = res; }

  override async handleStart(actor: unknown): Promise<MainMenuAction[]> {
    this.handleStartCalls.push([actor]);
    return this._handleStartResult;
  }

  override async handleCallback(data: string, actor: unknown, session: SessionData): Promise<BotResponse> {
    this.handleCallbackCalls.push([data, actor, session]);
    return this._handleCallbackResult;
  }

  override async handleMessage(update: unknown, actor: unknown, session: SessionData): Promise<BotResponse> {
    this.handleMessageCalls.push([update, actor, session]);
    return this._handleMessageResult;
  }

  override async handleCancel(actor: unknown, session: SessionData): Promise<BotResponse> {
    this.handleCancelCalls.push([actor, session]);
    return this._handleCancelResult;
  }

  override async handleTimeout(actor: unknown, session: SessionData): Promise<BotResponse> {
    this.handleTimeoutCalls.push([actor, session]);
    return this._handleTimeoutResult;
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
    const newGuest = makeUser({ uuid: 'new-guest', telegramId: 888, name: 'Гость' });
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

  test('использует имя "Гость" по умолчанию, если name не передан', async () => {
    const newGuest = makeUser({ uuid: 'default-guest', name: 'Гость' });
    const registerGuestMock = mock(async () => newGuest);
    const userFacade: UserFacade = {
      ...makeMockUserFacade(),
      getUserByTelegramId: mock(async () => undefined),
      registerGuest: registerGuestMock,
    } as unknown as UserFacade;

    const user = await resolveUser(userFacade, 777, 'admin-uuid');

    expect(user).toEqual(newGuest);
    expect(registerGuestMock).toHaveBeenCalledWith(777, 'Гость', 'admin-uuid');
  });

  test('пробрасывает ошибку registerGuest', async () => {
    const userFacade: UserFacade = {
      ...makeMockUserFacade(),
      getUserByTelegramId: mock(async () => undefined),
      registerGuest: mock(async () => {
        throw new Error('DB Down');
      }),
    } as unknown as UserFacade;

    await expect(
      resolveUser(userFacade, 666, 'admin-uuid'),
    ).rejects.toThrow('DB Down');
  });
});

// ── registerDispatcher ──

describe('registerDispatcher', () => {
  test('/start агрегирует кнопки от контроллеров', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser({ name: 'Тест' }));

    const ctrl1 = new MockController();
    ctrl1.name = 'ctrl1';
    ctrl1.setStartResult([
      { text: 'Кнопка 1', action: 'ctrl1:act1', priority: 10 },
    ]);

    const ctrl2 = new MockController();
    ctrl2.name = 'ctrl2';
    ctrl2.setStartResult([
      { text: 'Кнопка 2', action: 'ctrl2:act2', priority: 5 },
    ]);

    const map = registerDispatcher(bot, [ctrl1, ctrl2], userFacade, 'admin-uuid');

    expect(map.size).toBe(2);
    expect(bot.commands.start).toBeDefined();

    const ctx = makeMockContext();
    await bot.commands.start!(ctx);

    // Проверяем, что reply был вызван с меню
    expect(ctx.reply).toHaveBeenCalled();
    const replyCall = (ctx.reply as any).mock.calls[0];
    expect(replyCall[0]).toContain('Привет');
    expect(replyCall[0]).toContain('Тест');

    // Проверяем сортировку: priority 5 (Кнопка 2) перед 10 (Кнопка 1)
    const keyboard = replyCall[1].reply_markup;
    const btnTexts: string[] = keyboard.inline_keyboard.flat().map((b: any) => b.text);
    expect(btnTexts[0]).toBe('Кнопка 2');
    expect(btnTexts[1]).toBe('Кнопка 1');
  });

  test('callback маршрутизируется по префиксу', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser());

    const ctrl = new MockController();
    ctrl.name = 'stream';
    ctrl.setCallbackResult({ sendMessage: { text: 'Ответ от stream' } });

    const map = registerDispatcher(bot, [ctrl], userFacade, 'admin-uuid');

    expect(map.size).toBe(1);

    // Находим обработчик callback_query:data
    const handler = bot.listeners['callback_query:data']?.[0];
    expect(handler).toBeDefined();

    const ctx = makeMockContext();
    ctx.callbackQuery!.data = 'stream:catalog:list';

    await handler!(ctx);

    // Проверяем, что контроллер получил остаток данных
    expect(ctrl.handleCallbackCalls.length).toBe(1);
    expect(ctrl.handleCallbackCalls[0]![0]).toBe('catalog:list');

    // Проверяем, что ответ был отправлен
    expect(ctx.reply).toHaveBeenCalled();
    const replyCall = (ctx.reply as any).mock.calls[0];
    expect(replyCall[0]).toBe('Ответ от stream');
  });

  test('неизвестный префикс → ошибка', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser());

    const ctrl = new MockController();
    ctrl.name = 'stream';

    const map = registerDispatcher(bot, [ctrl], userFacade, 'admin-uuid');
    expect(map.size).toBe(1);

    const handler = bot.listeners['callback_query:data']?.[0];
    expect(handler).toBeDefined();

    const ctx = makeMockContext();
    ctx.callbackQuery!.data = 'unknown:action';

    await handler!(ctx);

    // Должен быть ответ callback query с ошибкой
    expect(ctx.answerCallbackQuery).toHaveBeenCalled();
    const answerCall = (ctx.answerCallbackQuery as any).mock.calls[0];
    expect(answerCall[0].text).toBe('Неизвестная команда');

    // handleCallback не должен вызываться
    expect(ctrl.handleCallbackCalls.length).toBe(0);
  });

  test('/cancel с активным обработчиком', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser());

    const ctrl = new MockController();
    ctrl.name = 'stream';
    ctrl.setCancelResult({ releaseInput: true, sendMessage: { text: 'Действие отменено' } });

    registerDispatcher(bot, [ctrl], userFacade, 'admin-uuid');

    const ctx = makeMockContext();
    ctx.session.activeHandler = { path: 'stream/some-path' };

    await bot.commands.cancel!(ctx);

    expect(ctrl.handleCancelCalls.length).toBe(1);
    expect(ctx.session.activeHandler).toBeNull();
    expect(ctx.reply).toHaveBeenCalled();
  });

  test('/cancel без активного обработчика', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser());

    const ctrl = new MockController();
    ctrl.name = 'stream';

    registerDispatcher(bot, [ctrl], userFacade, 'admin-uuid');

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

    registerDispatcher(bot, [ctrl], userFacade, 'admin-uuid');

    // Сначала callback, который захватывает ввод
    const cbHandler = bot.listeners['callback_query:data']?.[0];
    const ctx1 = makeMockContext();
    ctx1.callbackQuery!.data = 'onboarding:start';
    await cbHandler!(ctx1);

    // Проверяем, что activeHandler установлен
    expect(ctx1.session.activeHandler).not.toBeNull();
    expect(ctx1.session.activeHandler!.path).toBe('onboarding/ask-name');

    // Теперь сообщение должно пойти в контроллер
    const msgHandler = bot.listeners['message:text']?.[0];
    const ctx2 = makeMockContext();
    ctx2.session.activeHandler = { path: 'onboarding/ask-name' };
    ctx2.message!.text = 'Иван';

    // Просто вызываем next, чтобы пропустить проверку
    const nextSpy = mock(async () => {});
    await msgHandler!(ctx2, nextSpy);

    // Проверяем, что next НЕ вызывался (сообщение перехвачено)
    expect(nextSpy).not.toHaveBeenCalled();
    expect(ctrl.handleMessageCalls.length).toBe(1);
    expect(ctrl.handleMessageCalls[0]![0]).toEqual({
      type: 'message',
      text: 'Иван',
      telegramId: 123,
    });
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

    registerDispatcher(bot, [ctrl], userFacade, 'admin-uuid');

    const msgHandler = bot.listeners['message:text']?.[0];
    const ctx = makeMockContext();
    ctx.session.activeHandler = { path: 'onboarding/ask-name' };
    ctx.message!.text = 'Иван';

    await msgHandler!(ctx, mock(async () => {}));

    expect(ctrl.handleMessageCalls.length).toBe(1);
    expect(ctx.session.activeHandler).toBeNull();
  });

  test('чужой callback при активном обработчике → отказ', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser());

    const onboardingCtrl = new MockController();
    onboardingCtrl.name = 'onboarding';
    const streamCtrl = new MockController();
    streamCtrl.name = 'stream';

    registerDispatcher(bot, [onboardingCtrl, streamCtrl], userFacade, 'admin-uuid');

    const handler = bot.listeners['callback_query:data']?.[0];

    // Активный обработчик — onboarding, приходит callback для stream
    const ctx = makeMockContext();
    ctx.session.activeHandler = { path: 'onboarding/ask-name' };
    ctx.callbackQuery!.data = 'stream:catalog:list';

    await handler!(ctx);

    // Должен быть ответ с ошибкой
    expect(ctx.answerCallbackQuery).toHaveBeenCalled();
    const answerCall = (ctx.answerCallbackQuery as any).mock.calls[0];
    expect(answerCall[0].text).toContain('завершите текущее действие');
    expect(answerCall[0].show_alert).toBe(true);

    // handleCallback НЕ должен вызываться
    expect(streamCtrl.handleCallbackCalls.length).toBe(0);
    expect(onboardingCtrl.handleCallbackCalls.length).toBe(0);
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

    registerDispatcher(bot, [ctrl], userFacade, 'admin-uuid');

    const msgHandler = bot.listeners['message:text']?.[0];
    const ctx = makeMockContext();
    // Таймаут в прошлом
    ctx.session.activeHandler = {
      path: 'onboarding/ask-name',
      expiresAt: Date.now() - 1000,
    };
    ctx.message!.text = 'Любое сообщение';

    await msgHandler!(ctx, mock(async () => {}));

    expect(ctrl.handleTimeoutCalls.length).toBe(1);
    expect(ctx.session.activeHandler).toBeNull();
    expect(ctx.reply).toHaveBeenCalled();
  });

  test('сообщение без активного обработчика → next()', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser());

    const ctrl = new MockController();
    ctrl.name = 'stream';

    registerDispatcher(bot, [ctrl], userFacade, 'admin-uuid');

    const msgHandler = bot.listeners['message:text']?.[0];
    const ctx = makeMockContext();
    ctx.session.activeHandler = null;
    ctx.message!.text = 'Привет';

    const nextSpy = mock(async () => {});
    await msgHandler!(ctx, nextSpy);

    // Должен вызвать next (не перехватывать сообщение)
    expect(nextSpy).toHaveBeenCalled();
    expect(ctrl.handleMessageCalls.length).toBe(0);
  });

  test('сообщение-команда → next() даже с активным обработчиком', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser());

    const ctrl = new MockController();
    ctrl.name = 'onboarding';

    registerDispatcher(bot, [ctrl], userFacade, 'admin-uuid');

    const msgHandler = bot.listeners['message:text']?.[0];
    const ctx = makeMockContext();
    ctx.session.activeHandler = { path: 'onboarding/ask-name' };
    ctx.message!.text = '/help';

    const nextSpy = mock(async () => {});
    await msgHandler!(ctx, nextSpy);

    // Команды должны пропускаться
    expect(nextSpy).toHaveBeenCalled();
    expect(ctrl.handleMessageCalls.length).toBe(0);
  });

  test('делегирование — sendMessage + форвард делегату', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser());

    const ctrl = new MockController();
    ctrl.name = 'stream';
    // Первый вызов возвращает delegate
    ctrl.setCallbackResult({
      sendMessage: { text: 'Промежуточное сообщение' },
      delegate: { path: 'final-action' },
    });

    registerDispatcher(bot, [ctrl], userFacade, 'admin-uuid');

    const handler = bot.listeners['callback_query:data']?.[0];
    const ctx = makeMockContext();
    ctx.callbackQuery!.data = 'stream:some-action';

    await handler!(ctx);

    // Два вызова handleCallback: первый с some-action, второй с final-action
    expect(ctrl.handleCallbackCalls.length).toBe(2);
    expect(ctrl.handleCallbackCalls[0]![0]).toBe('some-action');
    expect(ctrl.handleCallbackCalls[1]![0]).toBe('final-action');

    // reply должен вызываться дважды (от delegate и от основного ответа)
    // (executeResponses вызывается дважды)
  });

  test('дубликат имени контроллера → ошибка', () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade();

    const ctrl1 = new MockController();
    ctrl1.name = 'duplicate';
    const ctrl2 = new MockController();
    ctrl2.name = 'duplicate';

    expect(() =>
      registerDispatcher(bot, [ctrl1, ctrl2], userFacade, 'admin-uuid'),
    ).toThrow('Дубликат имени контроллера: duplicate');
  });

  test('callback без «:» не вызывает контроллер', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser());

    const ctrl = new MockController();
    ctrl.name = 'stream';

    registerDispatcher(bot, [ctrl], userFacade, 'admin-uuid');

    const handler = bot.listeners['callback_query:data']?.[0];
    const ctx = makeMockContext();
    ctx.callbackQuery!.data = 'nodata';

    await handler!(ctx);

    // handleCallback не должен вызываться
    expect(ctrl.handleCallbackCalls.length).toBe(0);
  });

  test('интеграционный: полный цикл /start → callback → captureInput → /cancel', async () => {
    const bot = makeMockBot();
    const userFacade = makeMockUserFacade(makeUser({ name: 'Тест' }));

    const ctrl = new MockController();
    ctrl.name = 'main';
    ctrl.setStartResult([
      { text: 'Начать', action: 'main:start-action', priority: 1 },
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

    registerDispatcher(bot, [ctrl], userFacade, 'admin-uuid');

    // Шаг 1: /start
    const ctx1 = makeMockContext();
    await bot.commands.start!(ctx1);
    expect(ctx1.reply).toHaveBeenCalled();
    const startCall = (ctx1.reply as any).mock.calls[0];
    expect(startCall[0]).toContain('Привет');
    expect(startCall[0]).toContain('Тест');
    expect(startCall[1].reply_markup).toBeDefined();
    const startBtns: string[] = startCall[1].reply_markup.inline_keyboard
      .flat()
      .map((b: any) => b.text);
    expect(startBtns).toContain('Начать');

    // Шаг 2: callback → captureInput
    const cbHandler = bot.listeners['callback_query:data']![0]!;
    const ctx2 = makeMockContext();
    (ctx2.reply as any).mockClear?.();
    ctx2.callbackQuery!.data = 'main:start-action';
    await cbHandler(ctx2);
    expect(ctx2.session.activeHandler).not.toBeNull();
    expect(ctx2.session.activeHandler!.path).toBe('main/ask-name');
    expect(ctx2.reply).toHaveBeenCalled();

    // Шаг 3: message → handleMessage
    const msgHandler = bot.listeners['message:text']![0]!;
    const ctx3 = makeMockContext();
    (ctx3.reply as any).mockClear?.();
    ctx3.session.activeHandler = { path: 'main/ask-name' };
    ctx3.message!.text = 'Иван';
    const nextSpy = mock(async () => {});
    await msgHandler(ctx3, nextSpy);
    expect(nextSpy).not.toHaveBeenCalled(); // сообщение перехвачено
    expect(ctrl.handleMessageCalls.length).toBe(1);
    expect(ctx3.session.activeHandler).toBeNull(); // releaseInput очистил
    expect(ctx3.reply).toHaveBeenCalled();

    // Шаг 4: /cancel без активного обработчика (уже очищен)
    const ctx4 = makeMockContext();
    (ctx4.reply as any).mockClear?.();
    ctx4.session.activeHandler = null;
    await bot.commands.cancel!(ctx4);
    const cancelCall = (ctx4.reply as any).mock.calls[0];
    expect(cancelCall[0]).toContain('Нечего отменять');
  });
});
