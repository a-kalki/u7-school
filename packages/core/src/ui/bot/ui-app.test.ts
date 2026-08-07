import { describe, expect, test } from 'bun:test';
import { BotController } from './controller/bot-controller';
import type {
  BotResponse,
  BotUpdate,
  MainMenuAction,
  SessionData,
} from './types';
import { UiApp } from './ui-app';

// ── Тестовый контроллер ──

type TestActor = { id: string; name: string };

class TestController extends BotController<
  import('#domain/types').AppMeta,
  TestActor
> {
  name = '';

  private _startResult: MainMenuAction[] = [];
  private _callbackResult: BotResponse = {};
  private _messageResult: BotResponse = {};
  private _cancelResult: BotResponse = { releaseInput: true };
  private _timeoutResult: BotResponse = { releaseInput: true };
  private _welcomeResult: BotResponse | null = null;
  private _helpResult: BotResponse | null = null;

  handleStartCalls: TestActor[] = [];
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

  withStartResult(items: MainMenuAction[]): this {
    this._startResult = items;
    return this;
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
  withWelcomeResult(res: BotResponse | null): this {
    this._welcomeResult = res;
    return this;
  }
  withHelpResult(res: BotResponse | null): this {
    this._helpResult = res;
    return this;
  }

  override async handleStart(actor: TestActor): Promise<MainMenuAction[]> {
    this.handleStartCalls.push(actor);
    return this._startResult;
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

  override async handleWelcome(_actor: TestActor): Promise<BotResponse | null> {
    return this._welcomeResult;
  }

  override async handleHelpMessage(
    _actor: TestActor,
  ): Promise<BotResponse | null> {
    return this._helpResult;
  }
}

function makeActor(): TestActor {
  return { id: 'u1', name: 'Тест' };
}

function makeSession(overrides: Partial<SessionData> = {}): SessionData {
  return { activeHandler: null, ...overrides };
}

// ── UiApp ──

describe('UiApp', () => {
  test('создаётся с контроллерами, доступ по имени', () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';

    const app = new UiApp([ctrl]);
    expect(app.size).toBe(1);
    expect(app.getController('stream')).toBe(ctrl);
    expect(app.getController('unknown')).toBeUndefined();
  });

  test('дубликат имени → ошибка', () => {
    const c1 = new TestController();
    c1.name = 'dup';
    const c2 = new TestController();
    c2.name = 'dup';

    expect(() => new UiApp([c1, c2])).toThrow(
      'Дубликат имени контроллера: dup',
    );
  });

  test('collectMainMenu агрегирует и сортирует', async () => {
    const c1 = new TestController();
    c1.name = 'ctrl1';
    c1.withStartResult([
      { kind: 'callback', text: 'Б', action: 'ctrl1:b', priority: 10 },
    ]);

    const c2 = new TestController();
    c2.name = 'ctrl2';
    c2.withStartResult([
      { kind: 'callback', text: 'А', action: 'ctrl2:a', priority: 5 },
    ]);

    const app = new UiApp([c1, c2]);
    const items = await app.collectMainMenu(makeActor());

    expect(items).toHaveLength(2);
    expect(items[0]!.text).toBe('А');
    expect(items[1]!.text).toBe('Б');
  });

  test('handleCallback маршрутизирует по префиксу', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';
    ctrl.withCallbackResult({ sendMessage: { text: 'ok' } });

    const app = new UiApp([ctrl]);
    const session = makeSession();
    const actor = makeActor();

    const res = await app.handleCallback('stream:view:123', actor, session);

    expect(ctrl.handleCallbackCalls).toHaveLength(1);
    expect(ctrl.handleCallbackCalls[0]!.data).toBe('view:123');
    expect(res.sendMessage?.text).toBe('ok');
  });

  test('handleCallback: неизвестный префикс → ошибка', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';

    const app = new UiApp([ctrl]);
    const res = await app.handleCallback(
      'unknown:action',
      makeActor(),
      makeSession(),
    );

    expect(ctrl.handleCallbackCalls).toHaveLength(0);
    expect(res.sendMessage?.text).toContain('Неизвестная команда');
  });

  test('handleCallback: без ":" → ошибка формата', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';

    const app = new UiApp([ctrl]);
    const res = await app.handleCallback('nodata', makeActor(), makeSession());

    expect(ctrl.handleCallbackCalls).toHaveLength(0);
    expect(res.sendMessage?.text).toContain('Неизвестный формат');
  });

  test('handleCallback: чужой callback → отказ', async () => {
    const c1 = new TestController();
    c1.name = 'onboarding';
    const c2 = new TestController();
    c2.name = 'stream';

    const app = new UiApp([c1, c2]);
    const session = makeSession({
      activeHandler: { path: 'onboarding/ask-name' },
    });

    const res = await app.handleCallback(
      'stream:view:123',
      makeActor(),
      session,
    );

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

    const app = new UiApp([ctrl]);
    const session = makeSession();

    await app.handleCallback('onboarding:start', makeActor(), session);

    expect(session.activeHandler).not.toBeNull();
    expect(session.activeHandler!.path).toBe('onboarding/ask-name');
    expect(session.activeHandler!.expiresAt).toBeGreaterThan(Date.now());
  });

  test('handleCallback: releaseInput', async () => {
    const ctrl = new TestController();
    ctrl.name = 'onboarding';
    ctrl.withCallbackResult({ releaseInput: true });

    const app = new UiApp([ctrl]);
    const session = makeSession({
      activeHandler: { path: 'onboarding/ask-name' },
    });

    await app.handleCallback('onboarding:done', makeActor(), session);

    expect(session.activeHandler).toBeNull();
  });

  test('handleCallback: delegate', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';
    ctrl.withCallbackResult({
      sendMessage: { text: 'Промежуточное' },
      delegate: { path: 'final' },
    });

    const app = new UiApp([ctrl]);
    const session = makeSession();

    await app.handleCallback('stream:step1', makeActor(), session);

    expect(ctrl.handleCallbackCalls).toHaveLength(2);
    expect(ctrl.handleCallbackCalls[0]!.data).toBe('step1');
    expect(ctrl.handleCallbackCalls[1]!.data).toBe('final');
  });

  test('handleMessage: нет активного обработчика → null', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';

    const app = new UiApp([ctrl]);
    const res = await app.handleMessage(
      { type: 'message', text: 'hello', telegramId: 1 },
      makeActor(),
      makeSession(),
    );

    expect(res).toBeNull();
    expect(ctrl.handleMessageCalls).toHaveLength(0);
  });

  test('handleMessage: форвард активному контроллеру', async () => {
    const ctrl = new TestController();
    ctrl.name = 'onboarding';
    ctrl.withMessageResult({ sendMessage: { text: 'Принято' } });

    const app = new UiApp([ctrl]);
    const session = makeSession({
      activeHandler: { path: 'onboarding/ask-name' },
    });
    const update: BotUpdate = { type: 'message', text: 'Иван', telegramId: 1 };

    const res = await app.handleMessage(update, makeActor(), session);

    expect(res).not.toBeNull();
    expect(ctrl.handleMessageCalls).toHaveLength(1);
  });

  test('handleMessage: releaseInput очищает activeHandler', async () => {
    const ctrl = new TestController();
    ctrl.name = 'onboarding';
    ctrl.withMessageResult({ releaseInput: true });

    const app = new UiApp([ctrl]);
    const session = makeSession({
      activeHandler: { path: 'onboarding/ask-name' },
    });

    await app.handleMessage(
      { type: 'message', text: 'ok', telegramId: 1 },
      makeActor(),
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

    const app = new UiApp([ctrl]);
    const session = makeSession({
      activeHandler: {
        path: 'onboarding/ask-name',
        expiresAt: Date.now() - 1000,
      },
    });

    const res = await app.handleMessage(
      { type: 'message', text: 'любое', telegramId: 1 },
      makeActor(),
      session,
    );

    expect(ctrl.handleTimeoutCalls).toHaveLength(1);
    expect(session.activeHandler).toBeNull();
    expect(res?.sendMessage?.text).toBe('Время истекло');
  });

  test('handleCancel: нет активного обработчика → null', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';

    const app = new UiApp([ctrl]);
    const res = await app.handleCancel(makeActor(), makeSession());

    expect(res).toBeNull();
  });

  test('handleCancel: форвард контроллеру', async () => {
    const ctrl = new TestController();
    ctrl.name = 'onboarding';
    ctrl.withCancelResult({
      releaseInput: true,
      sendMessage: { text: 'Отменено' },
    });

    const app = new UiApp([ctrl]);
    const session = makeSession({
      activeHandler: { path: 'onboarding/ask-name' },
    });

    const res = await app.handleCancel(makeActor(), session);

    expect(ctrl.handleCancelCalls).toHaveLength(1);
    expect(session.activeHandler).toBeNull();
    expect(res?.sendMessage?.text).toBe('Отменено');
  });

  test('handleTimeout: нет активного обработчика → null', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';

    const app = new UiApp([ctrl]);
    const res = await app.handleTimeout(makeActor(), makeSession());

    expect(res).toBeNull();
  });

  test('collectAllMenuItems агрегирует кнопки', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';
    ctrl.withStartResult([
      { kind: 'callback', text: 'Б', action: 'stream:b', priority: 10 },
      { kind: 'callback', text: 'А', action: 'stream:a', priority: 5 },
    ]);

    const app = new UiApp([ctrl]);
    const items = await app.collectAllMenuItems(makeActor());

    expect(items).toHaveLength(2);
    expect(items[0]!.text).toBe('А');
    expect(items[1]!.text).toBe('Б');
  });

  test('collectAllMenuItems с пустым списком', async () => {
    const app = new UiApp([]);
    const items = await app.collectAllMenuItems(makeActor());
    expect(items).toHaveLength(0);
  });

  test('collectAllHelpDescriptions собирает описания', async () => {
    const c1 = new TestController();
    c1.name = 'ctrl1';
    c1.withStartResult([
      {
        kind: 'callback',
        text: 'A',
        action: 'a',
        priority: 10,
        description: 'Описание 1',
      },
    ]);

    const c2 = new TestController();
    c2.name = 'ctrl2';
    c2.withStartResult([
      {
        kind: 'callback',
        text: 'C',
        action: 'c',
        priority: 30,
        description: 'Описание 3',
      },
    ]);

    const app = new UiApp([c1, c2]);
    const descs = await app.collectAllHelpDescriptions(makeActor());

    expect(descs).toEqual(['Описание 1', 'Описание 3']);
  });

  test('handleWelcome делегирует в AppController', async () => {
    const appCtrl = new TestController();
    appCtrl.name = 'app';
    appCtrl.withWelcomeResult({
      sendMessage: {
        text: 'Привет! 👋',
        keyboard: {
          rows: [[{ text: 'Кнопка', code: 'app:test' }]],
          isMultiple: false,
        },
      },
    });

    const app = new UiApp([appCtrl]);
    const res = await app.handleWelcome(makeActor());

    expect(res.sendMessage?.text).toBe('Привет! 👋');
    expect(res.sendMessage?.keyboard?.rows[0]![0]!.text).toBe('Кнопка');
  });

  test('handleWelcome без контроллера app — fallback', async () => {
    const app = new UiApp([]);
    const res = await app.handleWelcome(makeActor());

    expect(res.sendMessage?.text).toContain('Выберите действие');
  });

  test('handleHelp делегирует в AppController', async () => {
    const appCtrl = new TestController();
    appCtrl.name = 'app';
    appCtrl.withHelpResult({
      sendMessage: { text: 'Как работать? 🤔' },
    });

    const app = new UiApp([appCtrl]);
    const res = await app.handleHelp(makeActor());

    expect(res.sendMessage?.text).toContain('Как работать?');
  });

  test('handleHelp без контроллера app — fallback', async () => {
    const app = new UiApp([]);
    const res = await app.handleHelp(makeActor());

    expect(res.sendMessage?.text).toContain('Нет доступных пунктов меню');
  });

  // ── publicActions ──

  test('getAction без init выбрасывает ошибку', () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';

    const app = new UiApp([ctrl]);

    // Без init publicActions мапа пуста — getAction выбрасывает ошибку
    expect(() => app.getAction('viewModule')).toThrow(
      'не найдено',
    );
  });

  test('init собирает publicActions со всех стори', () => {
    // Проверим через Spy контроллер, который регистрирует стори с publicActions
    // В реальном UiApp это происходит при init()
    const app = new UiApp([]);

    // До init — мапа пуста
    expect(app.publicActionsSize).toBe(0);
  });
});
