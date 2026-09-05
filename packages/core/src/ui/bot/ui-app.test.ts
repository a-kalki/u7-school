import { describe, expect, mock, test } from 'bun:test';
import type { AppMeta } from '#domain/types';
import { md, mdRaw } from '../../shared/markdown';
import { BotController } from './bot-controller';
import { BotUiStory } from './bot-ui-story';
import type { BotSession, BotUpdate, DialogResponse, Screen } from './types';
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
  helpScreen: Screen | null = null;

  constructor(name: string) {
    super();
    this.name = name;
  }

  override async handleCallback(): Promise<DialogResponse> {
    return {};
  }
  override async handleMessage(): Promise<DialogResponse | null> {
    return null;
  }
  override async handleHelp(): Promise<Screen | null> {
    return this.helpScreen;
  }
}

class TestController extends BotController<AppMeta, TestActor> {
  name = '';
  fakeStories: TestStory[] = [];

  private callbackQueue = new Queue<DialogResponse>([{}]);
  private _messageResult: DialogResponse | null = {};
  private _cancelResult: DialogResponse = { release: true };

  callbackData: string[] = [];
  messageCalled = 0;
  cancelCalled = 0;

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
  withCancelResult(res: DialogResponse): this {
    this._cancelResult = res;
    return this;
  }

  override getStories(): BotUiStory<AppMeta, TestActor>[] {
    return this.fakeStories;
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
  ): Promise<DialogResponse | null> {
    this.messageCalled++;
    return this._messageResult;
  }

  override async handleCancel(
    _actor: TestActor,
    _session: BotSession,
  ): Promise<DialogResponse> {
    this.cancelCalled++;
    return this._cancelResult;
  }
}

/** Тестовый uiApp: menuPath 'menu/main', экран меню «Меню». */
class TestUiApp extends BotUiApp<AppMeta, TestActor> {
  protected override readonly menuPath = 'menu/main';
  menuScreens = 0;

  protected override async buildMenuScreen(): Promise<Screen> {
    this.menuScreens++;
    return { text: mdRaw('Меню') };
  }
}

function makeController(name: string): TestController {
  const c = new TestController();
  c.name = name;
  return c;
}

function makeSession(
  path = 'menu/main',
  seq = 3,
  input?: { context?: unknown },
): BotSession {
  return { dialog: { path, seq, ...(input ? { input } : {}) } };
}

function makeActor(): TestActor {
  return { id: 'u1', name: 'Тест' };
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
  test('delegate: info инициатора + screen делегата, seq++ при смене пути', async () => {
    const ctrlA = makeController('a').withCallbackResults({
      info: { text: md`Переход в каталог` },
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
    // слоты: info от инициатора, screen от делегата
    expect(String(response?.info?.text)).toBe('Переход в каталог');
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

describe('BotUiApp — /start (handleWelcome)', () => {
  test('закрывает диалог: seq++, path = menuPath, input сброшен, экран меню', async () => {
    const uiApp = makeUiApp([makeController('a')]);
    const session = makeSession('a/one', 5, { context: { step: 3 } });

    const response = await uiApp.handleWelcome(42, session);

    expect(session.dialog.path).toBe('menu/main');
    expect(session.dialog.seq).toBe(6);
    expect(session.dialog.input).toBeUndefined();
    expect(String(response.screen?.text)).toBe('Меню');
  });
});

describe('BotUiApp — /help (handleHelp)', () => {
  test('активная стори с handleHelp → её экран как info-реплика', async () => {
    const story = new TestStory('one');
    story.helpScreen = { text: md`Вы в анкете, вопрос 3 из 10` };
    const ctrlA = makeController('a');
    ctrlA.fakeStories = [story];
    const uiApp = makeUiApp([ctrlA]);
    const session = makeSession('a/one', 5);

    const response = await uiApp.handleHelp(42, session);

    expect(String(response.info?.text)).toBe('Вы в анкете, вопрос 3 из 10');
  });

  test('стори без handleHelp → общий fallback (buildHelpScreen)', async () => {
    const ctrlA = makeController('a');
    ctrlA.fakeStories = [new TestStory('one')];
    const uiApp = makeUiApp([ctrlA]);
    const session = makeSession('a/one', 5);

    const response = await uiApp.handleHelp(42, session);

    expect(response.info?.keyboard).toBeUndefined();
    expect(String(response.info?.text).length).toBeGreaterThan(0);
    expect(String(response.info?.text)).not.toBe('Вы в анкете, вопрос 3 из 10');
  });

  test('общий fallback: диалог не меняется (info не трогает сессию)', async () => {
    const uiApp = makeUiApp([makeController('a')]);
    const session = makeSession('a/one', 5);

    await uiApp.handleHelp(42, session);

    expect(session.dialog.path).toBe('a/one');
    expect(session.dialog.seq).toBe(5);
  });
});

describe('BotUiApp — /cancel (handleCancel)', () => {
  test('активный ввод: доменная очистка стори, дефолт пустой → возврат в меню (seq++)', async () => {
    const ctrlA = makeController('a').withCancelResult({ release: true });
    const uiApp = makeUiApp([ctrlA]);
    const session = makeSession('a/one', 5, { context: { step: 2 } });

    const response = await uiApp.handleCancel(42, session);

    expect(ctrlA.cancelCalled).toBe(1);
    expect(session.dialog.path).toBe('menu/main');
    expect(session.dialog.seq).toBe(6);
    expect(String(response?.screen?.text)).toBe('Меню');
  });

  test('стори вернула свой экран отмены → он рендерится, диалог остаётся', async () => {
    const ctrlA = makeController('a').withCancelResult({
      release: true,
      screen: { text: md`Анкета отменена` },
    });
    const uiApp = makeUiApp([ctrlA]);
    const session = makeSession('a/one', 5, { context: {} });

    const response = await uiApp.handleCancel(42, session);

    expect(String(response?.screen?.text)).toBe('Анкета отменена');
    expect(session.dialog.path).toBe('a/one');
  });

  test('без активного ввода → сразу меню, стори не дёргается', async () => {
    const ctrlA = makeController('a');
    const uiApp = makeUiApp([ctrlA]);
    const session = makeSession('a/one', 5);

    const response = await uiApp.handleCancel(42, session);

    expect(ctrlA.cancelCalled).toBe(0);
    expect(session.dialog.path).toBe('menu/main');
    expect(String(response?.screen?.text)).toBe('Меню');
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

describe('BotUiApp — init-каскад', () => {
  test('init передаёт resolve и transport, getController сужен до BotController', async () => {
    const ctrl = makeController('a');
    const uiApp = new TestUiApp([ctrl]);
    const sender = { notify: mock(), kickFromGroup: mock() };
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
