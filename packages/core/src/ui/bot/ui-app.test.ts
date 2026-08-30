import { describe, expect, mock, test } from 'bun:test';
import { BotController } from './bot-controller';
import type {
  BotCommand,
  BotResponse,
  BotUpdate,
  NotificationPayload,
  SessionData,
} from './types';
import { BotUiApp } from './ui-app';

// ── Тестовый контроллер ──

type TestActor = { id: string; name: string };

class TestController extends BotController<
  import('#domain/types').AppMeta,
  TestActor
> {
  name = '';

  private _callbackResult: BotResponse = {};
  private _messageResult: BotResponse = {};
  private _cancelResult: BotResponse = { releaseInput: true };
  private _timeoutResult: BotResponse = { releaseInput: true };

  handleCallbackCalls: Array<{
    data: string;
    actor: TestActor;
    session: SessionData;
  }> = [];
  handleMessageCalls: Array<{
    update: BotUpdate;
    actor: TestActor;
    session: SessionData;
  }> = [];
  handleCancelCalls: Array<{ actor: TestActor; session: SessionData }> = [];
  handleTimeoutCalls: Array<{ actor: TestActor; session: SessionData }> = [];

  /** Сохраняет sender, переданный в init (для spy-проверок) */
  initReceived: unknown;

  override init(resolve: unknown, sender?: unknown): void {
    super.init(resolve as never, sender as never);
    this.initReceived = sender;
  }

  withCallbackResult(res: BotResponse): this {
    this._callbackResult = res;
    return this;
  }
  withMessageResult(res: BotResponse): this {
    this._messageResult = res;
    return this;
  }
  withCancelResult(res: BotResponse): this {
    this._cancelResult = res;
    return this;
  }
  withTimeoutResult(res: BotResponse): this {
    this._timeoutResult = res;
    return this;
  }

  override async handleCallback(
    data: string,
    actor: TestActor,
    session: SessionData,
  ): Promise<BotResponse> {
    this.handleCallbackCalls.push({ data, actor, session });
    return this._callbackResult;
  }

  override async handleMessage(
    update: BotUpdate,
    actor: TestActor,
    session: SessionData,
  ): Promise<BotResponse> {
    this.handleMessageCalls.push({ update, actor, session });
    return this._messageResult;
  }

  override async handleCancel(
    actor: TestActor,
    session: SessionData,
  ): Promise<BotResponse> {
    this.handleCancelCalls.push({ actor, session });
    return this._cancelResult;
  }

  override async handleTimeout(
    actor: TestActor,
    session: SessionData,
  ): Promise<BotResponse> {
    this.handleTimeoutCalls.push({ actor, session });
    return this._timeoutResult;
  }
}

function makeActor(): TestActor {
  return { id: 'u1', name: 'Тест' };
}

function makeSession(overrides: Partial<SessionData> = {}): SessionData {
  return { activeHandler: null, ...overrides };
}

function makeActorResolver(
  actor: TestActor,
): (tgId: number) => Promise<TestActor> {
  return async (_tgId: number) => actor;
}

function makeResolve(actor: TestActor) {
  return {
    appApi: {} as never,
    eventBus: {} as never,
    actorResolver: makeActorResolver(actor),
  };
}

// ── BotUiApp ──

describe('BotUiApp', () => {
  test('создаётся с контроллерами, доступ по имени', () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';

    const app = new BotUiApp([ctrl]);
    expect(app.size).toBe(1);
    expect(app.getController('stream')).toBe(ctrl);
    expect(app.getController('unknown')).toBeUndefined();
  });

  test('send делегирует в transport', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';

    const app = new BotUiApp([ctrl]);
    const transport = {
      send: mock(async () => {}),
      notify: mock(async () => {}),
      kickFromGroup: mock(async () => {}),
    };
    app.init(makeResolve(makeActor()), transport);

    const command: BotCommand = { sendMessage: { text: 'Привет' } };
    await app.send(456, command);

    expect(transport.send).toHaveBeenCalled();
    const [tgId, sent] = (transport.send as ReturnType<typeof mock>).mock
      .calls[0] as [number, BotCommand];
    expect(tgId).toBe(456);
    expect(sent).toEqual(command);
  });

  test('notify делегирует в transport без изменений payload', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';

    const app = new BotUiApp([ctrl]);
    const transport = {
      send: mock(async () => {}),
      notify: mock(async () => {}),
      kickFromGroup: mock(async () => {}),
    };
    app.init(makeResolve(makeActor()), transport);

    const payload: NotificationPayload = {
      text: 'Ты зачислен',
      parseMode: 'MarkdownV2',
    };
    await app.notify(456, payload);

    expect(transport.notify).toHaveBeenCalled();
    const [tgId, sent] = (transport.notify as ReturnType<typeof mock>).mock
      .calls[0] as [number, NotificationPayload];
    expect(tgId).toBe(456);
    expect(sent).toEqual(payload);
  });

  test('init передаёт себя контроллерам', () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';

    const app = new BotUiApp([ctrl]);
    const transport = {
      send: mock(async () => {}),
      notify: mock(async () => {}),
      kickFromGroup: mock(async () => {}),
    };
    app.init(makeResolve(makeActor()), transport);

    expect(ctrl.initReceived).toBe(app);
  });

  test('дубликат имени → ошибка', () => {
    const c1 = new TestController();
    c1.name = 'dup';
    const c2 = new TestController();
    c2.name = 'dup';

    expect(() => new BotUiApp([c1, c2])).toThrow(
      'Дубликат имени контроллера: dup',
    );
  });

  test('handleCallback маршрутизирует по префиксу', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';
    ctrl.withCallbackResult({ sendMessage: { text: 'ok' } });

    const actor = makeActor();
    const app = new BotUiApp([ctrl]);
    app.init(makeResolve(actor));

    const session = makeSession();
    const res = await app.handleCallback('stream:view:123', 1, session);

    expect(ctrl.handleCallbackCalls).toHaveLength(1);
    expect(ctrl.handleCallbackCalls[0]!.data).toBe('view:123');
    expect(res.sendMessage?.text).toBe('ok');
  });

  test('handleCallback: неизвестный префикс → ошибка', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';

    const actor = makeActor();
    const app = new BotUiApp([ctrl]);
    app.init(makeResolve(actor));

    const res = await app.handleCallback('unknown:action', 1, makeSession());

    expect(ctrl.handleCallbackCalls).toHaveLength(0);
    expect(res.sendMessage?.text).toContain('Неизвестная команда');
  });

  test('handleCallback: без ":" → ошибка формата', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';

    const actor = makeActor();
    const app = new BotUiApp([ctrl]);
    app.init(makeResolve(actor));

    const res = await app.handleCallback('nodata', 1, makeSession());

    expect(ctrl.handleCallbackCalls).toHaveLength(0);
    expect(res.sendMessage?.text).toContain('Неизвестный формат');
  });

  test('handleCallback: чужой callback → отказ', async () => {
    const c1 = new TestController();
    c1.name = 'onboarding';
    const c2 = new TestController();
    c2.name = 'stream';

    const actor = makeActor();
    const app = new BotUiApp([c1, c2]);
    app.init(makeResolve(actor));

    const session = makeSession({
      activeHandler: { path: 'onboarding/ask-name' },
    });

    const res = await app.handleCallback('stream:view:123', 1, session);

    expect(res.sendMessage?.text).toContain('завершите текущее действие');
    expect(c1.handleCallbackCalls).toHaveLength(0);
    expect(c2.handleCallbackCalls).toHaveLength(0);
  });

  test('handleCallback: captureInput', async () => {
    const ctrl = new TestController();
    ctrl.name = 'onboarding';
    ctrl.withCallbackResult({
      sendMessage: { text: 'Введите имя:' },
      captureInput: { path: 'ask-name', ttlSeconds: 30 },
    });

    const actor = makeActor();
    const app = new BotUiApp([ctrl]);
    app.init(makeResolve(actor));

    const session = makeSession();
    await app.handleCallback('onboarding:start', 1, session);

    expect(session.activeHandler).not.toBeNull();
    expect(session.activeHandler!.path).toBe('onboarding/ask-name');
    expect(session.activeHandler!.expiresAt).toBeGreaterThan(Date.now());
  });

  test('handleCallback: releaseInput', async () => {
    const ctrl = new TestController();
    ctrl.name = 'onboarding';
    ctrl.withCallbackResult({ releaseInput: true });

    const actor = makeActor();
    const app = new BotUiApp([ctrl]);
    app.init(makeResolve(actor));

    const session = makeSession({
      activeHandler: { path: 'onboarding/ask-name' },
    });

    await app.handleCallback('onboarding:done', 1, session);

    expect(session.activeHandler).toBeNull();
  });

  test('handleCallback: delegate', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';
    ctrl.withCallbackResult({
      sendMessage: { text: 'Промежуточное' },
      delegate: { path: 'stream:final' },
    });

    const actor = makeActor();
    const app = new BotUiApp([ctrl]);
    app.init(makeResolve(actor));

    const session = makeSession();
    await app.handleCallback('stream:step1', 1, session);

    expect(ctrl.handleCallbackCalls).toHaveLength(2);
    expect(ctrl.handleCallbackCalls[0]!.data).toBe('step1');
    expect(ctrl.handleCallbackCalls[1]!.data).toBe('final');
  });

  test('handleCallback: delegate с абсолютным путём уходит в другой контроллер', async () => {
    const stream = new TestController();
    stream.name = 'stream';
    stream.withCallbackResult({
      sendMessage: { text: 'Вы успешно записаны' },
      delegate: { path: 'app:main-menu' },
    });

    const appCtrl = new TestController();
    appCtrl.name = 'app';
    appCtrl.withCallbackResult({ sendMessage: { text: 'Главное меню' } });

    const actor = makeActor();
    const app = new BotUiApp([stream, appCtrl]);
    app.init(makeResolve(actor));

    const res = await app.handleCallback('stream:enroll', 1, makeSession());

    expect(res.sendMessage).toBeUndefined();
    expect(res.sendMessages?.map((m) => m.text)).toEqual([
      'Вы успешно записаны',
      'Главное меню',
    ]);
    expect(stream.handleCallbackCalls).toHaveLength(1);
    expect(stream.handleCallbackCalls[0]!.data).toBe('enroll');
    expect(appCtrl.handleCallbackCalls).toHaveLength(1);
    expect(appCtrl.handleCallbackCalls[0]!.data).toBe('main-menu');
  });

  test('handleMessage: нет активного обработчика → null', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';

    const actor = makeActor();
    const app = new BotUiApp([ctrl]);
    app.init(makeResolve(actor));

    const res = await app.handleMessage(
      { type: 'message', text: 'hello', telegramId: 1 },
      1,
      makeSession(),
    );

    expect(res).toBeNull();
    expect(ctrl.handleMessageCalls).toHaveLength(0);
  });

  test('handleMessage: форвард активному контроллеру', async () => {
    const ctrl = new TestController();
    ctrl.name = 'onboarding';
    ctrl.withMessageResult({ sendMessage: { text: 'Принято' } });

    const actor = makeActor();
    const app = new BotUiApp([ctrl]);
    app.init(makeResolve(actor));

    const session = makeSession({
      activeHandler: { path: 'onboarding/ask-name' },
    });
    const update: BotUpdate = { type: 'message', text: 'Иван', telegramId: 1 };

    const res = await app.handleMessage(update, 1, session);

    expect(res).not.toBeNull();
    expect(ctrl.handleMessageCalls).toHaveLength(1);
  });

  test('handleMessage: releaseInput очищает activeHandler', async () => {
    const ctrl = new TestController();
    ctrl.name = 'onboarding';
    ctrl.withMessageResult({ releaseInput: true });

    const actor = makeActor();
    const app = new BotUiApp([ctrl]);
    app.init(makeResolve(actor));

    const session = makeSession({
      activeHandler: { path: 'onboarding/ask-name' },
    });

    await app.handleMessage(
      { type: 'message', text: 'ok', telegramId: 1 },
      1,
      session,
    );

    expect(session.activeHandler).toBeNull();
  });

  test('handleMessage: таймаут вызывает handleTimeout', async () => {
    const ctrl = new TestController();
    ctrl.name = 'onboarding';
    ctrl.withTimeoutResult({
      releaseInput: true,
      sendMessage: { text: 'Время истекло' },
    });

    const actor = makeActor();
    const app = new BotUiApp([ctrl]);
    app.init(makeResolve(actor));

    const session = makeSession({
      activeHandler: {
        path: 'onboarding/ask-name',
        expiresAt: Date.now() - 1000,
      },
    });

    const res = await app.handleMessage(
      { type: 'message', text: 'любое', telegramId: 1 },
      1,
      session,
    );

    expect(ctrl.handleTimeoutCalls).toHaveLength(1);
    expect(session.activeHandler).toBeNull();
    expect(res?.sendMessage?.text).toBe('Время истекло');
  });

  test('handleCancel: нет активного обработчика → null', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';

    const actor = makeActor();
    const app = new BotUiApp([ctrl]);
    app.init(makeResolve(actor));

    const res = await app.handleCancel(1, makeSession());

    expect(res).toBeNull();
  });

  test('handleCancel: форвард контроллеру', async () => {
    const ctrl = new TestController();
    ctrl.name = 'onboarding';
    ctrl.withCancelResult({
      releaseInput: true,
      sendMessage: { text: 'Отменено' },
    });

    const actor = makeActor();
    const app = new BotUiApp([ctrl]);
    app.init(makeResolve(actor));

    const session = makeSession({
      activeHandler: { path: 'onboarding/ask-name' },
    });

    const res = await app.handleCancel(1, session);

    expect(ctrl.handleCancelCalls).toHaveLength(1);
    expect(session.activeHandler).toBeNull();
    expect(res?.sendMessage?.text).toBe('Отменено');
  });

  test('handleTimeout: нет активного обработчика → null', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';

    const actor = makeActor();
    const app = new BotUiApp([ctrl]);
    app.init(makeResolve(actor));

    const res = await app.handleTimeout(1, makeSession());

    expect(res).toBeNull();
  });

  test('init не падает без publicActions', () => {
    const app = new BotUiApp([]);
    expect(app.size).toBe(0);
  });
});
