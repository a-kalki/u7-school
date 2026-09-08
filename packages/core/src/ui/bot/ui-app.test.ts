import { describe, expect, mock, test } from 'bun:test';
import type { AppMeta } from '#domain/types';
import { md } from '../../shared/markdown';
import { BotController } from './bot-controller';
import { BotUiStory } from './bot-ui-story';
import type {
  BotSession,
  BotUpdate,
  CommandReaction,
  CommandUpdate,
  DialogResponse,
  DialogState,
} from './types';
import { BotUiApp } from './ui-app';

// ── Тестовые контроллер и стори ──

type TestActor = { id: string; name: string };

/** Очередь ответов callback: первый вызов — первый элемент, дальше последний. */
class Queue<T> {
  constructor(private items: T[]) {}
  next(): T {
    return this.items.length > 1
      ? (this.items.shift() as T)
      : (this.items[0] as T);
  }
}

class TestStory extends BotUiStory<AppMeta, TestActor> {
  readonly name: string;

  /** Вызовы handleCommand (pipe ФР-4, ревизия 2.1). */
  commandCalls: CommandUpdate[] = [];
  /** Реакция на команду (дефолт — pass). */
  commandReaction: CommandReaction = { reaction: 'pass' };

  constructor(name: string) {
    super();
    this.name = name;
  }

  override async handleCallback(): Promise<DialogResponse> {
    return {};
  }
  override async handleMessage(): Promise<DialogResponse> {
    return {};
  }
  override async handleCommand(
    update: CommandUpdate,
  ): Promise<CommandReaction> {
    this.commandCalls.push(update);
    return this.commandReaction;
  }
}

class TestController extends BotController<AppMeta, TestActor> {
  name = '';
  fakeStories: TestStory[] = [];

  private callbackQueue = new Queue<DialogResponse>([{}]);
  private _messageResult: DialogResponse | null = {};

  callbackData: string[] = [];
  messageCalled = 0;

  /** Вызовы handleCommand в pipe uiApp (ревизия 2.1). */
  commandCalls: CommandUpdate[] = [];
  /** Реакция контроллера в pipe (дефолт — pass). */
  commandReaction: CommandReaction = { reaction: 'pass' };
  /** Программируемый обработчик (для тестов порядка): приоритетнее commandReaction. */
  commandHandler: ((name: string) => CommandReaction) | null = null;

  override init(resolve: unknown, sender?: unknown): void {
    super.init(resolve as never, sender as never);
  }

  withCallbackResults(...results: DialogResponse[]): this {
    this.callbackQueue = new Queue(results);
    return this;
  }
  withMessageResult(res: DialogResponse | null): this {
    this._messageResult = res;
    return this;
  }

  override getStories(): BotUiStory<AppMeta, TestActor>[] {
    return this.fakeStories;
  }

  override async handleCommand(
    update: CommandUpdate,
  ): Promise<CommandReaction> {
    this.commandCalls.push(update);
    if (this.commandHandler) return this.commandHandler(this.name);
    return this.commandReaction;
  }

  override async handleCallback(
    data: string,
    _actor: TestActor,
    _session: BotSession,
  ): Promise<DialogResponse> {
    this.callbackData.push(data);
    return this.callbackQueue.next();
  }

  override async handleMessage(
    _update: BotUpdate,
    _actor: TestActor,
    _session: BotSession,
  ): Promise<DialogResponse> {
    this.messageCalled++;
    return this._messageResult ?? {};
  }
}

/** Тестовый uiApp: чистый BotUiApp без прикладных переопределений. */
class TestUiApp extends BotUiApp<AppMeta, TestActor> {}

function makeController(name: string): TestController {
  const c = new TestController();
  c.name = name;
  return c;
}

function makeSession(
  path = 'menu/main',
  seq = 3,
  input?: { context?: unknown },
): BotSession & { dialog: DialogState } {
  return { dialog: { path, seq, ...(input ? { input } : {}) } };
}

function makeActor(): TestActor {
  return { id: 'u1', name: 'Тест' };
}

/** Конверт команды для конвейера handleCommand (ФР-4). */
function makeCommand(command: string, args = ''): CommandUpdate {
  return { type: 'command', command, args, telegramId: 42 };
}

function makeUiApp(controllers: TestController[]): TestUiApp {
  const uiApp = new TestUiApp(controllers);
  uiApp.init({
    appApi: {} as never,
    eventBus: {} as never,
    actorResolver: async () => makeActor(),
  });
  return uiApp;
}

describe('BotUiApp — маршрутизация', () => {
  test('кнопка маршрутизируется по префиксу контроллера без блокировки чужим диалогом', async () => {
    const ctrlA = makeController('a');
    const ctrlB = makeController('b');
    const uiApp = makeUiApp([ctrlA, ctrlB]);
    const session = makeSession('a/one', 5);

    await uiApp.handleCallback('b:two:view', 42, session);

    expect(ctrlA.callbackData.length).toBe(0);
    expect(ctrlB.callbackData).toEqual(['two:view']);
  });

  test('кнопка без сегмента стори → экран ошибки формата, маршрутизации нет', async () => {
    const ctrlA = makeController('a');
    const uiApp = makeUiApp([ctrlA]);
    const session = makeSession();

    const response = await uiApp.handleCallback('a', 42, session);

    expect(ctrlA.callbackData.length).toBe(0);
    expect(String(response?.screen?.text ?? '').length).toBeGreaterThan(0);
  });

  test('неизвестный контроллер → экран неизвестной команды', async () => {
    const uiApp = makeUiApp([makeController('a')]);
    const session = makeSession();

    const response = await uiApp.handleCallback('zzz:one:act', 42, session);

    expect(String(response?.screen?.text ?? '').length).toBeGreaterThan(0);
  });

  test('handleMessage маршрутизируется в контроллер активного диалога', async () => {
    const ctrlA = makeController('a').withMessageResult({ release: true });
    const ctrlB = makeController('b');
    const uiApp = makeUiApp([ctrlA, ctrlB]);
    const session = makeSession('a/one', 2, { context: { q: 1 } });

    const update: BotUpdate = {
      type: 'message',
      text: 'привет',
      telegramId: 42,
    };
    const response = await uiApp.handleMessage(update, 42, session);

    expect(ctrlA.messageCalled).toBe(1);
    expect(ctrlB.messageCalled).toBe(0);
    expect(response?.release).toBe(true);
  });

  test('handleMessage при диалоге без контроллера меню → null (next в грамми)', async () => {
    const ctrlA = makeController('a');
    const uiApp = makeUiApp([ctrlA]);
    const session = makeSession('menu/main', 1, { context: {} });

    const update: BotUpdate = { type: 'message', text: 'х', telegramId: 42 };
    const response = await uiApp.handleMessage(update, 42, session);

    expect(ctrlA.messageCalled).toBe(0);
    expect(response).toBeNull();
  });
});

describe('BotUiApp — seq и смена диалога', () => {
  test('кнопка в ЧУЖУЮ стори (мост) → seq++, path обновлён, input сброшен', async () => {
    const ctrlB = makeController('b');
    const uiApp = makeUiApp([makeController('a'), ctrlB]);
    const session = makeSession('a/one', 5, { context: { step: 2 } });

    await uiApp.handleCallback('b:two:open', 42, session);

    expect(session.dialog.path).toBe('b/two');
    expect(session.dialog.seq).toBe(6);
    expect(session.dialog.input).toBeUndefined();
  });

  test('кнопка СВОЕЙ стори → seq и input не меняются', async () => {
    const ctrlA = makeController('a');
    const uiApp = makeUiApp([ctrlA, makeController('b')]);
    const session = makeSession('a/one', 5, { context: { step: 2 } });

    await uiApp.handleCallback('a:one:next', 42, session);

    expect(session.dialog.path).toBe('a/one');
    expect(session.dialog.seq).toBe(5);
    expect(session.dialog.input).toEqual({ context: { step: 2 } });
  });

  test('кнопка другой стори ТОГО ЖЕ контроллера — смена диалога (seq++)', async () => {
    const ctrlA = makeController('a');
    const uiApp = makeUiApp([ctrlA]);
    const session = makeSession('a/one', 5);

    await uiApp.handleCallback('a:two:open', 42, session);

    expect(session.dialog.path).toBe('a/two');
    expect(session.dialog.seq).toBe(6);
  });
});

describe('BotUiApp — delegate', () => {
  test('delegate: notify инициатора + screen делегата, seq++ при смене пути', async () => {
    const ctrlA = makeController('a').withCallbackResults({
      notify: { text: md`Переход в каталог` },
      delegate: { path: 'b:two:open' },
    });
    const ctrlB = makeController('b').withCallbackResults({
      screen: { text: md`Каталог` },
    });
    const uiApp = makeUiApp([ctrlA, ctrlB]);
    const session = makeSession('a/one', 5);

    const response = await uiApp.handleCallback('a:one:go', 42, session);

    // делегат вызван без префикса контроллера
    expect(ctrlB.callbackData).toEqual(['two:open']);
    // диалог — делегата
    expect(session.dialog.path).toBe('b/two');
    expect(session.dialog.seq).toBe(6);
    // слоты: notify от инициатора, screen от делегата
    expect(String(response?.notify?.text)).toBe('Переход в каталог');
    expect(String(response?.screen?.text)).toBe('Каталог');
  });

  test('delegate в тот же диалог: seq не растёт, экран делегата приоритетен', async () => {
    const ctrlA = makeController('a').withCallbackResults(
      {
        screen: { text: md`Промежуточный` },
        delegate: { path: 'a:one:final' },
      },
      { screen: { text: md`Финал` } },
    );
    const uiApp = makeUiApp([ctrlA]);
    const session = makeSession('a/one', 5);

    const response = await uiApp.handleCallback('a:one:go', 42, session);

    expect(session.dialog.seq).toBe(5);
    expect(ctrlA.callbackData).toEqual(['one:go', 'one:final']);
    // экран делегата (последнего) побеждает
    expect(String(response?.screen?.text)).toBe('Финал');
  });

  test('delegate: awaitInput делегата прокидывается, инициатора — затирается', async () => {
    const ctrlA = makeController('a').withCallbackResults({
      awaitInput: { context: 'старый' },
      delegate: { path: 'b:two:start' },
    });
    const ctrlB = makeController('b').withCallbackResults({
      screen: { text: md`Вопрос` },
      awaitInput: { context: { q: 1 } },
    });
    const uiApp = makeUiApp([ctrlA, ctrlB]);
    const session = makeSession('a/one', 5);

    const response = await uiApp.handleCallback('a:one:go', 42, session);

    expect(response?.awaitInput).toEqual({ context: { q: 1 } });
  });

  test('delegate в несуществующий контроллер → экран ошибки, не падает', async () => {
    const ctrlA = makeController('a').withCallbackResults({
      delegate: { path: 'zzz:one:x' },
    });
    const uiApp = makeUiApp([ctrlA]);
    const session = makeSession('a/one', 5);

    const response = await uiApp.handleCallback('a:one:go', 42, session);

    expect(String(response?.screen?.text ?? '').length).toBeGreaterThan(0);
  });
});

// ── Pipe команд (трек 1.1, ФР-4 ревизия 2.1): uiApp агрегирует контроллеры ──

describe('BotUiApp — handleCommand: pipe контроллеров (ФР-4)', () => {
  test('все контроллеры pass → null (дефолты — уровень приложения)', async () => {
    const ctrlA = makeController('a');
    const ctrlB = makeController('b');
    const uiApp = makeUiApp([ctrlA, ctrlB]);
    const session = makeSession('a/one', 5);

    const response = await uiApp.handleCommand(
      makeCommand('help'),
      42,
      session,
    );

    expect(ctrlA.commandCalls.length).toBe(1);
    expect(ctrlB.commandCalls.length).toBe(1);
    expect(response).toBeNull();
    // pipe не трогает диалог и seq
    expect(session.dialog.path).toBe('a/one');
    expect(session.dialog.seq).toBe(5);
  });

  test('актор резолвится один раз и доезжает до контроллеров', async () => {
    let resolveCalls = 0;
    const ctrlA = makeController('a');
    const uiApp = new TestUiApp([ctrlA]);
    uiApp.init({
      appApi: {} as never,
      eventBus: {} as never,
      actorResolver: async () => {
        resolveCalls++;
        return makeActor();
      },
    });

    await uiApp.handleCommand(makeCommand('help'), 42, makeSession());

    expect(resolveCalls).toBe(1);
  });

  test('активный контроллер первым, далее по порядку регистрации (без дубля)', async () => {
    const order: string[] = [];
    const ctrlA = makeController('a');
    const ctrlB = makeController('b');
    const ctrlC = makeController('c');
    for (const c of [ctrlA, ctrlB, ctrlC]) {
      c.commandHandler = (name) => {
        order.push(name);
        return { reaction: 'pass' };
      };
    }
    const uiApp = makeUiApp([ctrlA, ctrlB, ctrlC]);
    const session = makeSession('b/two', 5);

    await uiApp.handleCommand(makeCommand('help'), 42, session);

    expect(order).toEqual(['b', 'a', 'c']);
  });

  test('при закрытом диалоге — порядок регистрации, без активного', async () => {
    const order: string[] = [];
    const ctrlA = makeController('a');
    const ctrlB = makeController('b');
    for (const c of [ctrlA, ctrlB]) {
      c.commandHandler = (name) => {
        order.push(name);
        return { reaction: 'pass' };
      };
    }
    const uiApp = makeUiApp([ctrlA, ctrlB]);

    await uiApp.handleCommand(makeCommand('help'), 42, {} as BotSession);

    expect(order).toEqual(['a', 'b']);
  });

  test('первый stop побеждает: последующие контроллеры не опрашиваются', async () => {
    // стоп — у АКТИВНОГО контроллера (он в pipe первым)
    const ctrlA = makeController('a');
    const ctrlB = makeController('b');
    ctrlB.commandReaction = {
      reaction: 'stop',
      response: { notify: { text: md`Ответ B` } },
    };
    const uiApp = makeUiApp([ctrlA, ctrlB]);
    const session = makeSession('b/two', 5);

    const response = await uiApp.handleCommand(
      makeCommand('help'),
      42,
      session,
    );

    expect(ctrlB.commandCalls.length).toBe(1);
    expect(ctrlA.commandCalls.length).toBe(0);
    expect(String(response?.notify?.text)).toBe('Ответ B');
  });

  test('stop с пустым ответом — терминал без реплики (null не возвращается)', async () => {
    const ctrlA = makeController('a');
    ctrlA.commandReaction = { reaction: 'stop', response: {} };
    const uiApp = makeUiApp([ctrlA]);

    const response = await uiApp.handleCommand(
      makeCommand('help'),
      42,
      makeSession(),
    );

    expect(response).toEqual({});
  });

  test('только continue → {notify: склейка нотисов}', async () => {
    const ctrlA = makeController('a');
    ctrlA.commandReaction = { reaction: 'continue', notice: md`Вклад A` };
    const ctrlB = makeController('b');
    ctrlB.commandReaction = { reaction: 'continue', notice: md`Вклад B` };
    const uiApp = makeUiApp([ctrlA, ctrlB]);

    const response = await uiApp.handleCommand(
      makeCommand('help'),
      42,
      makeSession(),
    );

    expect(String(response?.notify?.text)).toBe('Вклад A\n\nВклад B');
    expect(response?.screen).toBeUndefined();
  });

  test('continue-нотисы + stop: склейка — notify-нотисом НАД ответом стопа', async () => {
    const ctrlA = makeController('a');
    ctrlA.commandReaction = { reaction: 'continue', notice: md`Вклад A` };
    const ctrlB = makeController('b');
    ctrlB.commandReaction = {
      reaction: 'stop',
      response: { screen: { text: md`Экран B` } },
    };
    const uiApp = makeUiApp([ctrlA, ctrlB]);

    const response = await uiApp.handleCommand(
      makeCommand('cancel'),
      42,
      makeSession(),
    );

    expect(String(response?.notify?.text)).toBe('Вклад A');
    expect(String(response?.screen?.text)).toBe('Экран B');
  });

  test('конверт доезжает до контроллеров целиком: command + args', async () => {
    const ctrlA = makeController('a');
    const uiApp = makeUiApp([ctrlA]);

    const update = makeCommand('tasks', 'today urgent');
    await uiApp.handleCommand(update, 42, makeSession());

    expect(ctrlA.commandCalls[0]?.command).toBe('tasks');
    expect(ctrlA.commandCalls[0]?.args).toBe('today urgent');
  });
});

describe('BotUiApp — awaitInput/release', () => {
  test('awaitInput прокидывается как есть (без path в поле)', async () => {
    const ctrlA = makeController('a').withCallbackResults({
      screen: { text: md`Вопрос` },
      awaitInput: { context: { q: 1 } },
    });
    const uiApp = makeUiApp([ctrlA]);
    const session = makeSession('a/one', 5);

    const response = await uiApp.handleCallback('a:one:ask', 42, session);

    expect(response?.awaitInput).toEqual({ context: { q: 1 } });
  });
});

// ── Инварианты: операция входа (трек 1.1, ФР-1/ФР-2) ──

describe('BotUiApp — инварианты: операция входа', () => {
  test('handleMessage при закрытом диалоге → null (next), контроллеры не дёргаются', async () => {
    const ctrlA = makeController('a');
    const uiApp = makeUiApp([ctrlA]);
    const session = {} as BotSession;

    const update: BotUpdate = {
      type: 'message',
      text: 'привет',
      telegramId: 42,
    };
    const response = await uiApp.handleMessage(update, 42, session);

    expect(ctrlA.messageCalled).toBe(0);
    expect(response).toBeNull();
  });
});

describe('BotUiApp — init-каскад', () => {
  test('init передаёт resolve и transport, getController сужен до BotController', async () => {
    const ctrl = makeController('a');
    const uiApp = new TestUiApp([ctrl]);
    const sender = { notify: mock(), invite: mock(), kickFromGroup: mock() };
    uiApp.init(
      {
        appApi: {} as never,
        eventBus: {} as never,
        actorResolver: async () => makeActor(),
      },
      sender,
    );

    expect(uiApp.getController('a')?.name).toBe('a');
  });
});
