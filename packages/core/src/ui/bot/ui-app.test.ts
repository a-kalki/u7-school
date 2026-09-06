import { describe, expect, mock, test } from 'bun:test';
import type { AppMeta } from '#domain/types';
import { md, mdRaw } from '../../shared/markdown';
import { BotController } from './bot-controller';
import { BotUiStory } from './bot-ui-story';
import type {
  BotSession,
  BotUpdate,
  CommandUpdate,
  DialogResponse,
  DialogState,
  Screen,
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
  helpScreen: Screen | null = null;

  /** Вызовы handleCommand (конвейер ФР-4). */
  commandCalls: CommandUpdate[] = [];
  /** undefined — дефолт (обобщение handleHelp/handleCancel), null/объект — явный ответ стори. */
  commandResult: DialogResponse | null | undefined = undefined;
  /** Счётчик доменной очистки (handleCancel). */
  cancelCalls = 0;

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
  override async handleCommand(
    update: CommandUpdate,
    actor: TestActor,
    session: BotSession,
  ): Promise<DialogResponse | null> {
    this.commandCalls.push(update);
    if (this.commandResult !== undefined) return this.commandResult;
    return super.handleCommand(update, actor, session);
  }
  override async handleCancel(): Promise<DialogResponse> {
    this.cancelCalls++;
    return { release: true };
  }
}

class TestController extends BotController<AppMeta, TestActor> {
  name = '';
  fakeStories: TestStory[] = [];

  private callbackQueue = new Queue<DialogResponse>([{}]);
  private _messageResult: DialogResponse | null = {};

  callbackData: string[] = [];
  messageCalled = 0;

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
}

/** Тестовый uiApp: menuPath 'menu/main', экран меню «Меню». */
class TestUiApp extends BotUiApp<AppMeta, TestActor> {
  protected override readonly menuPath = 'menu/main';
  menuScreens = 0;
  cancelScreens = 0;

  /** Вызовы appCommand-хука (конвейер ФР-4). */
  appCommandCalls: CommandUpdate[] = [];
  /** Поведение хука: null — «пропускаю» (по умолчанию). */
  appCommandHandler:
    | ((
        update: CommandUpdate,
        tgId: number,
        session: BotSession,
      ) => Promise<DialogResponse | null>)
    | null = null;

  protected override async buildMenuScreen(): Promise<Screen> {
    this.menuScreens++;
    return { text: mdRaw('Меню') };
  }

  /** /cancel — короткий экран, отдельный хук (по умолчанию = меню /start). */
  protected override async buildCancelMenuScreen(): Promise<Screen> {
    this.cancelScreens++;
    return { text: mdRaw('Выберите действие:') };
  }

  protected override async handleAppCommand(
    update: CommandUpdate,
    tgId: number,
    session: BotSession,
  ): Promise<DialogResponse | null> {
    this.appCommandCalls.push(update);
    return this.appCommandHandler
      ? this.appCommandHandler(update, tgId, session)
      : null;
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

// ── Конвейер команд (трек 1.1, ФР-4): appCommand-хук → стори → дефолты ──

describe('BotUiApp — конвейер handleCommand (ФР-4)', () => {
  function makeStoryUiApp(story: TestStory): {
    uiApp: TestUiApp;
    ctrlA: TestController;
  } {
    const ctrlA = makeController('a');
    ctrlA.fakeStories = [story];
    return { uiApp: makeUiApp([ctrlA]), ctrlA };
  }

  // ── Уровень 1: appCommand-хук ──

  test('appCommand-хук: непустой ответ завершает конвейер — стори и дефолты не дёргаются', async () => {
    const story = new TestStory('one');
    const { uiApp } = makeStoryUiApp(story);
    uiApp.appCommandHandler = async () => ({ info: { text: md`Перехвачено` } });
    const session = makeSession('a/one', 5, { context: { step: 2 } });

    const response = await uiApp.handleCommand(
      makeCommand('cancel'),
      42,
      session,
    );

    expect(String(response?.info?.text)).toBe('Перехвачено');
    expect(uiApp.appCommandCalls.length).toBe(1);
    // конвейер прерван: стори не опрошена, дефолт-cancel не сбросил диалог
    expect(story.commandCalls.length).toBe(0);
    expect(session.dialog.path).toBe('a/one');
    expect(session.dialog.seq).toBe(5);
  });

  test('appCommand-хук: null («пропускаю») — конвейер продолжается до дефолта', async () => {
    const { uiApp } = makeStoryUiApp(new TestStory('one'));
    const session = makeSession('a/one', 5);

    const response = await uiApp.handleCommand(
      makeCommand('start'),
      42,
      session,
    );

    expect(uiApp.appCommandCalls.length).toBe(1);
    expect(String(response?.screen?.text)).toBe('Меню');
    expect(session.dialog.path).toBe('menu/main');
  });

  // ── /start: с любого места — основное меню ──

  test('/start: с любого места — reopen меню + welcome, активная стори не опрашивается', async () => {
    const story = new TestStory('one');
    story.commandResult = { screen: { text: md`Стоп` } };
    const { uiApp } = makeStoryUiApp(story);
    const session = makeSession('a/one', 5, { context: { step: 2 } });

    const response = await uiApp.handleCommand(
      makeCommand('start'),
      42,
      session,
    );

    expect(story.commandCalls.length).toBe(0);
    expect(session.dialog.path).toBe('menu/main');
    expect(session.dialog.seq).toBe(6);
    expect(session.dialog.input).toBeUndefined();
    expect(String(response?.screen?.text)).toBe('Меню');
  });

  test('/start при закрытом диалоге открывает меню с seq=1', async () => {
    const { uiApp } = makeStoryUiApp(new TestStory('one'));
    const session = {} as BotSession;

    await uiApp.handleCommand(makeCommand('start'), 42, session);

    expect(session.dialog?.path).toBe('menu/main');
    expect(session.dialog?.seq).toBe(1);
  });

  // ── /help: три уровня (стори → main-help на меню → fallback) ──

  test('/help уровень «стори»: активная стори дала справку → её info-реплика, диалог не тронут', async () => {
    const story = new TestStory('one');
    story.commandResult = { info: { text: md`Вы в анкете, вопрос 3 из 10` } };
    const { uiApp } = makeStoryUiApp(story);
    const session = makeSession('a/one', 5);

    const response = await uiApp.handleCommand(
      makeCommand('help'),
      42,
      session,
    );

    expect(String(response?.info?.text)).toBe('Вы в анкете, вопрос 3 из 10');
    expect(response?.screen).toBeUndefined();
    expect(session.dialog.path).toBe('a/one');
    expect(session.dialog.seq).toBe(5);
  });

  test('/help: стори вернула screen → текст экрана уходит info-репликой, экран диалога не рендерится', async () => {
    const story = new TestStory('one');
    story.commandResult = { screen: { text: md`Справка анкеты` } };
    const { uiApp } = makeStoryUiApp(story);
    const session = makeSession('a/one', 5);

    const response = await uiApp.handleCommand(
      makeCommand('help'),
      42,
      session,
    );

    expect(String(response?.info?.text)).toBe('Справка анкеты');
    expect(response?.screen).toBeUndefined();
    expect(session.dialog.seq).toBe(5);
  });

  test('/help уровень «стори» через дефолт: handleHelp стори подхватывается обобщением handleCommand', async () => {
    const story = new TestStory('one');
    story.helpScreen = { text: md`Контекстная справка` };
    const { uiApp } = makeStoryUiApp(story);
    const session = makeSession('a/one', 5);

    const response = await uiApp.handleCommand(
      makeCommand('help'),
      42,
      session,
    );

    expect(String(response?.info?.text)).toBe('Контекстная справка');
  });

  test('/help без стори (меню/закрыт диалог) → общий fallback', async () => {
    const { uiApp } = makeStoryUiApp(new TestStory('one'));
    const session = makeSession('menu/main', 2);

    const response = await uiApp.handleCommand(
      makeCommand('help'),
      42,
      session,
    );

    expect(String(response?.info?.text)).toContain('Справка');
    expect(response?.screen).toBeUndefined();
  });

  // ── /cancel: доменная очистка → сброс приложения → меню ──

  test('/cancel: доменная очистка активной стори вызывается ВСЕГДА (и без ожидания ввода)', async () => {
    const story = new TestStory('one');
    const { uiApp } = makeStoryUiApp(story);
    const session = makeSession('a/one', 5); // без input

    await uiApp.handleCommand(makeCommand('cancel'), 42, session);

    expect(story.commandCalls.length).toBe(1);
    // дефолт handleCommand('cancel') обобщает handleCancel — доменная очистка
    expect(story.cancelCalls).toBe(1);
  });

  test('/cancel: пустой ответ стори → сброс диалога (seq++, меню-якорь) и короткое меню', async () => {
    const story = new TestStory('one');
    const { uiApp } = makeStoryUiApp(story);
    const session = makeSession('a/one', 5, { context: { step: 2 } });

    const response = await uiApp.handleCommand(
      makeCommand('cancel'),
      42,
      session,
    );

    expect(session.dialog.path).toBe('menu/main');
    expect(session.dialog.seq).toBe(6);
    expect(session.dialog.input).toBeUndefined();
    expect(String(response?.screen?.text)).toBe('Выберите действие:');
    expect(uiApp.cancelScreens).toBe(1);
    expect(uiApp.menuScreens).toBe(0);
  });

  test('/cancel: доменный текст стори («Анкета отменена») — info-реплика НАД меню, экран — меню', async () => {
    const story = new TestStory('one');
    story.commandResult = {
      release: true,
      screen: { text: md`Анкета отменена` },
    };
    const { uiApp } = makeStoryUiApp(story);
    const session = makeSession('a/one', 5, { context: {} });

    const response = await uiApp.handleCommand(
      makeCommand('cancel'),
      42,
      session,
    );

    expect(String(response?.info?.text)).toBe('Анкета отменена');
    expect(String(response?.screen?.text)).toBe('Выберите действие:');
    expect(session.dialog.path).toBe('menu/main');
    expect(session.dialog.seq).toBe(6);
  });

  test('/cancel при закрытом диалоге → reopen меню seq=1 (нечего чистить)', async () => {
    const { uiApp } = makeStoryUiApp(new TestStory('one'));
    const session = {} as BotSession;

    const response = await uiApp.handleCommand(
      makeCommand('cancel'),
      42,
      session,
    );

    expect(session.dialog?.path).toBe('menu/main');
    expect(session.dialog?.seq).toBe(1);
    expect(String(response?.screen?.text)).toBe('Выберите действие:');
  });

  // ── доменные команды стори (задел под /tasks) ──

  test('доменная команда: стори ответила — её ответ как есть (screen допустим)', async () => {
    const story = new TestStory('one');
    story.commandResult = { screen: { text: md`Список задач` } };
    const { uiApp } = makeStoryUiApp(story);
    const session = makeSession('a/one', 5);

    const response = await uiApp.handleCommand(
      makeCommand('tasks'),
      42,
      session,
    );

    expect(String(response?.screen?.text)).toBe('Список задач');
    expect(session.dialog.seq).toBe(5);
  });

  test('конверт доезжает до стори целиком: command + args', async () => {
    const story = new TestStory('one');
    const { uiApp } = makeStoryUiApp(story);
    const session = makeSession('a/one', 5);

    const update = makeCommand('tasks', 'today urgent');
    await uiApp.handleCommand(update, 42, session);

    expect(story.commandCalls[0]?.command).toBe('tasks');
    expect(story.commandCalls[0]?.args).toBe('today urgent');
  });

  test('неизвестная команда без обработчика → info-подсказка, диалог не тронут', async () => {
    const { uiApp } = makeStoryUiApp(new TestStory('one'));
    const session = makeSession('a/one', 5);

    const response = await uiApp.handleCommand(makeCommand('foo'), 42, session);

    expect(response?.info).toBeDefined();
    expect(response?.screen).toBeUndefined();
    expect(session.dialog.path).toBe('a/one');
    expect(session.dialog.seq).toBe(5);
  });

  test('неизвестная команда при закрытом диалоге → info-подсказка (не падение)', async () => {
    const { uiApp } = makeStoryUiApp(new TestStory('one'));
    const session = {} as BotSession;

    const response = await uiApp.handleCommand(makeCommand('foo'), 42, session);

    expect(response?.info).toBeDefined();
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
  test('повторный /start — reopen: seq++ даже «меню → меню» (не no-op)', async () => {
    const uiApp = makeUiApp([makeController('a')]);
    const session = makeSession('menu/main', 5);

    await uiApp.handleCommand(makeCommand('start'), 42, session);

    expect(session.dialog.seq).toBe(6);
  });

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

  test('/help при закрытом диалоге → общий fallback (info-реплика)', async () => {
    const uiApp = makeUiApp([makeController('a')]);
    const session = {} as BotSession;

    const response = await uiApp.handleCommand(
      makeCommand('help'),
      42,
      session,
    );

    expect(String(response?.info?.text).length).toBeGreaterThan(0);
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
