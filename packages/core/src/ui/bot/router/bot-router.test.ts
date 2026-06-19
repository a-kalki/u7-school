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
  private _callbackResult: BotResponse = {};
  private _messageResult: BotResponse = {};
  private _cancelResult: BotResponse = { releaseInput: true };
  private _timeoutResult: BotResponse = { releaseInput: true };

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

  // ── app:main-menu ──

  test('app:main-menu пересобирает меню через collectMainMenu', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';
    ctrl.withStartResult([
      { kind: 'callback', text: 'Кнопка 1', action: 'stream:a', priority: 10 },
      { kind: 'callback', text: 'Кнопка 2', action: 'stream:b', priority: 5 },
    ]);

    const disp = new BotRouter([ctrl]);
    const session = makeSession();
    const actor = makeActor();

    const res = await disp.handleCallback('app:main-menu', actor, session);

    expect(res.mainMenu).toBeDefined();
    expect(res.mainMenu!.actions).toHaveLength(2);
    expect(res.mainMenu!.actions[0]!.text).toBe('Кнопка 2'); // priority 5
    expect(res.mainMenu!.actions[1]!.text).toBe('Кнопка 1'); // priority 10
  });

  test('app:main-menu НЕ сбрасывает activeHandler', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';
    ctrl.withStartResult([]);

    const disp = new BotRouter([ctrl]);
    const session = makeSession({
      activeHandler: { path: 'stream/some-path' },
    });

    await disp.handleCallback('app:main-menu', makeActor(), session);

    expect(session.activeHandler).not.toBeNull();
    expect(session.activeHandler!.path).toBe('stream/some-path');
  });

  test('app:main-menu работает без контроллера app', async () => {
    const ctrl = new TestController();
    ctrl.name = 'stream';
    ctrl.withStartResult([
      { kind: 'callback', text: 'Единственная', action: 'stream:x', priority: 1 },
    ]);

    const disp = new BotRouter([ctrl]);
    // Контроллера 'app' нет — но вызов должен работать
    const res = await disp.handleCallback(
      'app:main-menu',
      makeActor(),
      makeSession(),
    );

    expect(res.mainMenu).toBeDefined();
    expect(res.mainMenu!.actions).toHaveLength(1);
  });
});
