import { describe, expect, test } from 'bun:test';
import type { ApiModule } from '#api/module/api-module';
import type { ApiModuleMeta, ModuleResolver } from '#domain/types';
import { BotController } from '../controller/bot-controller';
import type {
  BotResponse,
  BotUpdate,
  MainMenuAction,
  SessionData,
} from '../types';
import {
  BotRouter,
  extractControllerName,
  extractRestData,
} from './bot-router';

// ── Тестовый контроллер ──

type TestActor = { id: string; name: string };

class TestController extends BotController<
  import('#domain/types').AppMeta,
  ApiModuleMeta,
  TestActor
> {
  name = '';

  constructor() {
    super({} as ApiModule<ApiModuleMeta, ModuleResolver>);
  }

  private _startResult: MainMenuAction[] = [];
  private _helpStartResult: string | null = null;
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
  withHelpStartResult(res: string | null): this {
    this._helpStartResult = res;
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

  override async handleHelpStart(_actor: TestActor): Promise<string | null> {
    return this._helpStartResult;
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

// ── extractControllerName / extractRestData ──

describe('extractControllerName', () => {
  test('извлекает имя до первого ":"', () => {
    expect(extractControllerName('stream:catalog:list')).toBe('stream');
  });

  test('возвращает null если нет ":"', () => {
    expect(extractControllerName('nodata')).toBeNull();
  });

  test('пустая строка', () => {
    expect(extractControllerName('')).toBeNull();
  });
});

describe('extractRestData', () => {
  test('возвращает остаток после первого ":"', () => {
    expect(extractRestData('stream:catalog:list')).toBe('catalog:list');
  });

  test('если нет ":", возвращает всю строку', () => {
    expect(extractRestData('nodata')).toBe('nodata');
  });

  test('пустая строка', () => {
    expect(extractRestData('')).toBe('');
  });
});

// ── BotRouter ──

describe('BotRouter', () => {
  test('создаётся с контроллерами, доступ по имени', () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';

    const disp = new BotRouter([ctrl]);
    expect(disp.size).toBe(1);
    expect(disp.getController('stream')).toBe(ctrl);
    expect(disp.getController('unknown')).toBeUndefined();
  });

  test('дубликат имени → ошибка', () => {
    const c1 = new TestController();
    c1.name = 'dup';
    const c2 = new TestController();
    c2.name = 'dup';

    expect(() => new BotRouter([c1, c2])).toThrow(
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

    const disp = new BotRouter([c1, c2]);
    const items = await disp.collectMainMenu(makeActor());

    expect(items).toHaveLength(2);
    expect(items[0]!.text).toBe('А'); // priority 5
    expect(items[1]!.text).toBe('Б'); // priority 10
  });

  test('handleCallback маршрутизирует по префиксу', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';
    ctrl.withCallbackResult({ sendMessage: { text: 'ok' } });

    const disp = new BotRouter([ctrl]);
    const session = makeSession();
    const actor = makeActor();

    const res = await disp.handleCallback('stream:view:123', actor, session);

    expect(ctrl.handleCallbackCalls).toHaveLength(1);
    expect(ctrl.handleCallbackCalls[0]!.data).toBe('view:123');
    expect(res.sendMessage?.text).toBe('ok');
  });

  test('handleCallback: неизвестный префикс → ошибка', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';

    const disp = new BotRouter([ctrl]);
    const res = await disp.handleCallback(
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

    const disp = new BotRouter([ctrl]);
    const res = await disp.handleCallback('nodata', makeActor(), makeSession());

    expect(ctrl.handleCallbackCalls).toHaveLength(0);
    expect(res.sendMessage?.text).toContain('Неизвестный формат');
  });

  test('handleCallback: чужой callback → отказ', async () => {
    const c1 = new TestController();
    c1.name = 'onboarding';
    const c2 = new TestController();
    c2.name = 'stream';

    const disp = new BotRouter([c1, c2]);
    const session = makeSession({
      activeHandler: { path: 'onboarding/ask-name' },
    });

    const res = await disp.handleCallback(
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

    const disp = new BotRouter([ctrl]);
    const session = makeSession();

    await disp.handleCallback('onboarding:start', makeActor(), session);

    expect(session.activeHandler).not.toBeNull();
    expect(session.activeHandler!.path).toBe('onboarding/ask-name');
    expect(session.activeHandler!.expiresAt).toBeGreaterThan(Date.now());
  });

  test('handleCallback: releaseInput', async () => {
    const ctrl = new TestController();
    ctrl.name = 'onboarding';
    ctrl.withCallbackResult({ releaseInput: true });

    const disp = new BotRouter([ctrl]);
    const session = makeSession({
      activeHandler: { path: 'onboarding/ask-name' },
    });

    await disp.handleCallback('onboarding:done', makeActor(), session);

    expect(session.activeHandler).toBeNull();
  });

  test('handleCallback: delegate', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';
    ctrl.withCallbackResult({
      sendMessage: { text: 'Промежуточное' },
      delegate: { path: 'final' },
    });

    const disp = new BotRouter([ctrl]);
    const session = makeSession();

    const res = await disp.handleCallback('stream:step1', makeActor(), session);

    // Два вызова: step1, затем final
    expect(ctrl.handleCallbackCalls).toHaveLength(2);
    expect(ctrl.handleCallbackCalls[0]!.data).toBe('step1');
    expect(ctrl.handleCallbackCalls[1]!.data).toBe('final');
  });

  test('handleMessage: нет активного обработчика → null', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';

    const disp = new BotRouter([ctrl]);
    const res = await disp.handleMessage(
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

    const disp = new BotRouter([ctrl]);
    const session = makeSession({
      activeHandler: { path: 'onboarding/ask-name' },
    });
    const update: BotUpdate = { type: 'message', text: 'Иван', telegramId: 1 };

    const res = await disp.handleMessage(update, makeActor(), session);

    expect(res).not.toBeNull();
    expect(ctrl.handleMessageCalls).toHaveLength(1);
  });

  test('handleMessage: releaseInput очищает activeHandler', async () => {
    const ctrl = new TestController();
    ctrl.name = 'onboarding';
    ctrl.withMessageResult({ releaseInput: true });

    const disp = new BotRouter([ctrl]);
    const session = makeSession({
      activeHandler: { path: 'onboarding/ask-name' },
    });

    await disp.handleMessage(
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

    const disp = new BotRouter([ctrl]);
    const session = makeSession({
      activeHandler: {
        path: 'onboarding/ask-name',
        expiresAt: Date.now() - 1000, // в прошлом
      },
    });

    const res = await disp.handleMessage(
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

    const disp = new BotRouter([ctrl]);
    const res = await disp.handleCancel(makeActor(), makeSession());

    expect(res).toBeNull();
  });

  test('handleCancel: форвард контроллеру', async () => {
    const ctrl = new TestController();
    ctrl.name = 'onboarding';
    ctrl.withCancelResult({
      releaseInput: true,
      sendMessage: { text: 'Отменено' },
    });

    const disp = new BotRouter([ctrl]);
    const session = makeSession({
      activeHandler: { path: 'onboarding/ask-name' },
    });

    const res = await disp.handleCancel(makeActor(), session);

    expect(ctrl.handleCancelCalls).toHaveLength(1);
    expect(session.activeHandler).toBeNull();
    expect(res?.sendMessage?.text).toBe('Отменено');
  });

  test('handleTimeout: нет активного обработчика → null', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';

    const disp = new BotRouter([ctrl]);
    const res = await disp.handleTimeout(makeActor(), makeSession());

    expect(res).toBeNull();
  });

  // ── collectAllMenuItems (MenuAggregator) ──

  test('collectAllMenuItems агрегирует кнопки от всех контроллеров', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';
    ctrl.withStartResult([
      { kind: 'callback', text: 'Б', action: 'stream:b', priority: 10 },
      { kind: 'callback', text: 'А', action: 'stream:a', priority: 5 },
    ]);

    const disp = new BotRouter([ctrl]);
    const items = await disp.collectAllMenuItems(makeActor());

    expect(items).toHaveLength(2);
    expect(items[0]!.text).toBe('А');
    expect(items[1]!.text).toBe('Б');
  });

  test('collectAllMenuItems с пустым списком контроллеров', async () => {
    const disp = new BotRouter([]);
    const items = await disp.collectAllMenuItems(makeActor());
    expect(items).toHaveLength(0);
  });

  // ── collectAllHelpDescriptions (MenuAggregator) ──

  test('collectAllHelpDescriptions собирает описания и фильтрует null', async () => {
    const c1 = new TestController();
    c1.name = 'ctrl1';
    c1.withHelpStartResult('Описание 1');

    const c2 = new TestController();
    c2.name = 'ctrl2';
    c2.withHelpStartResult(null); // этот должен отфильтроваться

    const c3 = new TestController();
    c3.name = 'ctrl3';
    c3.withHelpStartResult('Описание 3');

    const disp = new BotRouter([c1, c2, c3]);
    const descs = await disp.collectAllHelpDescriptions(makeActor());

    expect(descs).toEqual(['Описание 1', 'Описание 3']);
  });

  // ── handleWelcome ──

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

    const disp = new BotRouter([appCtrl]);
    const res = await disp.handleWelcome(makeActor());

    expect(res.sendMessage?.text).toBe('Привет! 👋');
    expect(res.sendMessage?.keyboard?.rows[0]![0]!.text).toBe('Кнопка');
  });

  test('handleWelcome без контроллера app — fallback', async () => {
    const disp = new BotRouter([]);
    const res = await disp.handleWelcome(makeActor());

    expect(res.sendMessage?.text).toContain('Выберите действие');
  });

  // ── handleHelp ──

  test('handleHelp делегирует в AppController', async () => {
    const appCtrl = new TestController();
    appCtrl.name = 'app';
    appCtrl.withHelpResult({
      sendMessage: { text: 'Как работать? 🤔\n\nСписок команд...' },
    });

    const disp = new BotRouter([appCtrl]);
    const res = await disp.handleHelp(makeActor());

    expect(res.sendMessage?.text).toContain('Как работать?');
  });

  test('handleHelp без контроллера app — fallback', async () => {
    const disp = new BotRouter([]);
    const res = await disp.handleHelp(makeActor());

    expect(res.sendMessage?.text).toContain('Нет доступных пунктов меню');
  });

  // ── app:main-menu → AppController ──

  test('app:main-menu делегирует в AppController.handleCallback', async () => {
    const appCtrl = new TestController();
    appCtrl.name = 'app';
    appCtrl.withCallbackResult({
      sendMessage: {
        text: 'Выберите действие:',
        keyboard: {
          rows: [[{ text: 'Кнопка', code: 'app:test' }]],
          isMultiple: false,
        },
      },
    });

    const disp = new BotRouter([appCtrl]);
    const session = makeSession();
    const actor = makeActor();

    const res = await disp.handleCallback('app:main-menu', actor, session);

    expect(res.sendMessage?.text).toBe('Выберите действие:');
    expect(res.sendMessage?.keyboard?.rows[0]![0]!.text).toBe('Кнопка');
    expect(appCtrl.handleCallbackCalls).toHaveLength(1);
    expect(appCtrl.handleCallbackCalls[0]!.data).toBe('main-menu');
  });

  test('app:help делегирует в AppController.handleCallback', async () => {
    const appCtrl = new TestController();
    appCtrl.name = 'app';
    appCtrl.withCallbackResult({
      sendMessage: { text: 'Как работать? 🤔\n\nСписок команд...' },
    });

    const disp = new BotRouter([appCtrl]);
    const session = makeSession();
    const actor = makeActor();

    const res = await disp.handleCallback('app:help', actor, session);

    expect(res.sendMessage?.text).toContain('Как работать?');
    expect(appCtrl.handleCallbackCalls).toHaveLength(1);
    expect(appCtrl.handleCallbackCalls[0]!.data).toBe('help');
  });

  test('app:main-menu без контроллера app — ошибка', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';

    const disp = new BotRouter([ctrl]);
    const res = await disp.handleCallback(
      'app:main-menu',
      makeActor(),
      makeSession(),
    );

    expect(res.sendMessage?.text).toContain('Неизвестная команда');
  });
});
