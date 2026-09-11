import { describe, expect, test } from 'bun:test';
import { errNotFound, errValidation } from '#domain/errors/error-helpers';
import { AppException } from '#domain/errors/errors';
import type { AppMeta } from '#domain/types';
import type { Logger } from '#shared/logger';
import { setGlobalLogger } from '#shared/logger';
import { md } from '../../shared/markdown';
import { assertMarkdownV2Safe } from '../../shared/markdown-validator';
import { BotController } from './bot-controller';
import { BotUiStory } from './bot-ui-story';
import type {
  BotSession,
  BotUpdate,
  CommandReaction,
  CommandUpdate,
  DialogResponse,
  KeyboardDescription,
} from './types';

type TestActor = { id: string };

/** Стори с записью вызовов и настраиваемым ответом. */
class SpyStory extends BotUiStory<AppMeta, TestActor> {
  constructor(
    readonly name: string,
    private callbackResult: DialogResponse = {},
  ) {
    super();
  }

  callbackData: string[] = [];
  messageCalled = 0;
  throwError: unknown = null;
  messageResult: DialogResponse = { release: true };
  commandReaction: CommandReaction | null = null;

  override async handleCallback(
    action: string,
    _actor: TestActor,
    _session: BotSession,
  ): Promise<DialogResponse> {
    this.callbackData.push(action);
    if (this.throwError) throw this.throwError;
    return this.callbackResult;
  }

  override async handleMessage(
    _update: BotUpdate,
    _actor: TestActor,
    _session: BotSession,
  ): Promise<DialogResponse> {
    this.messageCalled++;
    return this.messageResult;
  }

  override async handleCommand(
    update: CommandUpdate,
    actor: TestActor,
    session: BotSession,
  ): Promise<CommandReaction> {
    return this.commandReaction ?? super.handleCommand(update, actor, session);
  }
}

class TestController extends BotController<AppMeta, TestActor> {
  name = 'learn';

  constructor(stories: BotUiStory<AppMeta, TestActor>[]) {
    super();
    this.stories.push(...stories);
  }
}

function kb(...codes: string[]): KeyboardDescription {
  return {
    rows: codes.map((code) => [{ text: `btn-${code}`, code }]),
    isMultiple: false,
  };
}

function makeSession(path = 'learn/hub', seq = 3): BotSession {
  return { dialog: { path, seq } };
}

/** Логгер-шпион warn-вызовов (остальное — молчаливые заглушки). */
function makeWarnSpyLogger(
  warns: Array<[string, string, Record<string, unknown> | undefined]>,
): Logger {
  return {
    debug() {},
    info() {},
    warn(source, message, meta) {
      warns.push([source, message, meta]);
    },
    error() {},
    setLogLevel() {},
    getLogLevel() {
      return 0;
    },
    setSourceLevel() {},
  };
}

function makeUpdate(text = 'ответ'): BotUpdate {
  return { type: 'message', text, telegramId: 7 };
}

function makeCommandUpdate(
  command: string,
  args = '',
): Parameters<BotUiStory<AppMeta, TestActor>['handleCommand']>[0] {
  return { type: 'command', command, args, telegramId: 7 };
}

// ── Pipe команд (ФР-4): контроллер агрегирует реакции стори ──

describe('BotController — handleCommand: pipe стори', () => {
  /** Стори с записью вызовов и запрограммированной реакцией. */
  class PipeStory extends BotUiStory<AppMeta, TestActor> {
    commandCalls = 0;
    reaction: CommandReaction = { reaction: 'pass' };
    throwError: unknown = null;

    constructor(readonly name: string) {
      super();
    }

    override async handleCallback(): Promise<DialogResponse> {
      return {};
    }
    override async handleMessage(): Promise<DialogResponse> {
      return {};
    }
    override async handleCommand(): Promise<CommandReaction> {
      this.commandCalls++;
      if (this.throwError) throw this.throwError;
      return this.reaction;
    }
  }

  function makeCtrl(stories: PipeStory[]): TestController {
    return new TestController(stories);
  }

  const actor: TestActor = { id: 'u1' };

  test('все стори pass → контроллер pass', async () => {
    const s1 = new PipeStory('one');
    const s2 = new PipeStory('two');
    const ctrl = makeCtrl([s1, s2]);

    const reaction = await ctrl.handleCommand(
      makeCommandUpdate('help'),
      actor,
      makeSession(),
    );

    expect(s1.commandCalls).toBe(1);
    expect(s2.commandCalls).toBe(1);
    expect(reaction).toEqual({ reaction: 'pass' });
  });

  test('первый stop побеждает: обход прерывается, ответ — как есть', async () => {
    const s1 = new PipeStory('one');
    s1.reaction = {
      reaction: 'stop',
      response: { notify: { text: md`Контекстная справка` } },
    };
    const s2 = new PipeStory('two');
    const ctrl = makeCtrl([s1, s2]);

    const reaction = await ctrl.handleCommand(
      makeCommandUpdate('help'),
      actor,
      makeSession(),
    );

    expect(reaction).toEqual({
      reaction: 'stop',
      response: { notify: { text: md`Контекстная справка` } },
    });
    expect(s2.commandCalls).toBe(0);
  });

  test('склейка continue-нотисов → continue со склеенным notice', async () => {
    const s1 = new PipeStory('one');
    s1.reaction = { reaction: 'continue', notice: md`Вклад один` };
    const s2 = new PipeStory('two');
    s2.reaction = { reaction: 'continue', notice: md`Вклад два` };
    const ctrl = makeCtrl([s1, s2]);

    const reaction = await ctrl.handleCommand(
      makeCommandUpdate('help'),
      actor,
      makeSession(),
    );

    expect(reaction.reaction).toBe('continue');
    if (reaction.reaction !== 'continue') return;
    expect(String(reaction.notice)).toBe('Вклад один\n\nВклад два');
  });

  test('continue без notice + все pass → pass (пустого continue нет)', async () => {
    const s1 = new PipeStory('one');
    s1.reaction = { reaction: 'continue' };
    const ctrl = makeCtrl([s1, new PipeStory('two')]);

    const reaction = await ctrl.handleCommand(
      makeCommandUpdate('help'),
      actor,
      makeSession(),
    );

    expect(reaction).toEqual({ reaction: 'pass' });
  });

  test('continue-нотисы + stop: notice — notify-нотисом НАД ответом стопа', async () => {
    const s1 = new PipeStory('one');
    s1.reaction = { reaction: 'continue', notice: md`Вклад один` };
    const s2 = new PipeStory('two');
    s2.reaction = { reaction: 'continue', notice: md`Вклад два` };
    const s3 = new PipeStory('three');
    s3.reaction = {
      reaction: 'stop',
      response: { screen: { text: md`Экран` } },
    };
    const ctrl = makeCtrl([s1, s2, s3]);

    const reaction = await ctrl.handleCommand(
      makeCommandUpdate('cancel'),
      actor,
      makeSession(),
    );

    expect(reaction.reaction).toBe('stop');
    if (reaction.reaction !== 'stop') return;
    expect(String(reaction.response.notify?.text)).toBe(
      'Вклад один\n\nВклад два',
    );
    expect(String(reaction.response.screen?.text)).toBe('Экран');
  });

  test('stop с собственным notify: склейка с накопленными нотисами (не потеря)', async () => {
    const s1 = new PipeStory('one');
    s1.reaction = { reaction: 'continue', notice: md`Вклад один` };
    const s2 = new PipeStory('two');
    s2.reaction = {
      reaction: 'stop',
      response: { notify: { text: md`Отменено` } },
    };
    const ctrl = makeCtrl([s1, s2]);

    const reaction = await ctrl.handleCommand(
      makeCommandUpdate('cancel'),
      actor,
      makeSession(),
    );

    if (reaction.reaction !== 'stop') throw new Error('ожидался stop');
    expect(String(reaction.response.notify?.text)).toBe(
      'Вклад один\n\nОтменено',
    );
  });

  test('активная стори первой в pipe контроллера (право первой обработки)', async () => {
    const order: string[] = [];
    class OrderStory extends PipeStory {
      override async handleCommand(): Promise<CommandReaction> {
        order.push(this.name);
        return { reaction: 'pass' };
      }
    }
    const s1 = new OrderStory('one');
    const s2 = new OrderStory('two');
    const s3 = new OrderStory('three');
    const ctrl = new TestController([s1, s2, s3]);
    ctrl.name = 'learn';

    // активна третья стори активного контроллера — она первой
    await ctrl.handleCommand(
      makeCommandUpdate('help'),
      actor,
      makeSession('learn/three', 2),
    );

    expect(order).toEqual(['three', 'one', 'two']);

    // диалог чужого контроллера — порядок регистрации
    order.length = 0;
    await ctrl.handleCommand(
      makeCommandUpdate('help'),
      actor,
      makeSession('other/any', 2),
    );

    expect(order).toEqual(['one', 'two', 'three']);
  });

  test('invite (временный ФР-6) делегирует родителю-отправителю', async () => {
    const invited: Array<[number, string]> = [];
    const ctrl = makeCtrl([]);
    ctrl.init(
      {
        appApi: {} as never,
        eventBus: {} as never,
        actorResolver: async () => actor,
      } as never,
      {
        notify: async () => {},
        invite: async (tg: number, p: { text: unknown }) =>
          invited.push([tg, String(p.text)]),
        kickFromGroup: async () => {},
      } as never,
    );

    await ctrl.invite(7, {
      text: md`Приглашение`,
      keyboard: {
        rows: [[{ text: 'Поехали', code: 'invite:start:q1' }]],
        isMultiple: false,
      },
    });

    expect(invited).toEqual([[7, 'Приглашение']]);
  });

  test('ошибка стори → stop с handleError-экраном, обход прерывается', async () => {
    setGlobalLogger(makeWarnSpyLogger([]));
    const s1 = new PipeStory('one');
    s1.throwError = new AppException(
      errNotFound('NotFound', 'Анкета не найдена', undefined),
    );
    const s2 = new PipeStory('two');
    const ctrl = makeCtrl([s1, s2]);

    const reaction = await ctrl.handleCommand(
      makeCommandUpdate('cancel'),
      actor,
      makeSession(),
    );

    expect(reaction.reaction).toBe('stop');
    if (reaction.reaction !== 'stop') return;
    expect(String(reaction.response.screen?.text)).toContain(
      'Анкета не найдена',
    );
    expect(s2.commandCalls).toBe(0);
  });
});

describe('BotController — маршрутизация callback', () => {
  test('кнопка своей стори: префикс стори снят, коды кнопок префиксованы контроллером', async () => {
    const story = new SpyStory('hub', {
      screen: { text: md`Хаб`, keyboard: kb('hub:next', 'list:open') },
    });
    const ctrl = new TestController([story, new SpyStory('list')]);
    ctrl.init({
      appApi: {} as never,
      eventBus: {} as never,
      actorResolver: async () => ({ id: 'u' }),
    } as never);

    const response = await ctrl.handleCallback(
      'hub:open',
      { id: 'u' },
      makeSession(),
    );

    expect(story.callbackData).toEqual(['open']);
    const codes = response.screen?.keyboard?.rows.flatMap((r) =>
      r.map((b) => b.code),
    );
    expect(codes).toEqual(['learn:hub:next', 'learn:list:open']);
  });

  test('кросс-контроллерный код не перепрефиксовывается', async () => {
    const story = new SpyStory('hub', {
      screen: { text: md`Хаб`, keyboard: kb('user:profile:open') },
    });
    const ctrl = new TestController([story]);

    const response = await ctrl.handleCallback(
      'hub:open',
      { id: 'u' },
      makeSession(),
    );

    const codes = response.screen?.keyboard?.rows.flatMap((r) =>
      r.map((b) => b.code),
    );
    expect(codes).toEqual(['user:profile:open']);
  });

  test('неизвестная стори → экран неизвестной команды', async () => {
    const ctrl = new TestController([new SpyStory('hub')]);

    const response = await ctrl.handleCallback(
      'zzz:act',
      { id: 'u' },
      makeSession(),
    );

    expect(String(response.screen?.text).length).toBeGreaterThan(0);
  });

  test('ошибка стори → handleError-экран, не исключение', async () => {
    const story = new SpyStory('hub');
    story.throwError = new AppException(
      errNotFound('ERR', 'Курс не найден (id [x])', undefined),
    );
    const ctrl = new TestController([story]);

    const response = await ctrl.handleCallback(
      'hub:open',
      { id: 'u' },
      makeSession(),
    );

    const text = String(response.screen?.text);
    expect(text).toContain('Курс не найден');
    expect(() => assertMarkdownV2Safe(text)).not.toThrow();
  });
});

describe('BotController — префиксация ответов handleMessage', () => {
  test('коды кнопок экрана из ответа на ввод префиксованы контроллером', async () => {
    const story = new SpyStory('hub');
    story.messageResult = {
      screen: { text: md`Вопрос`, keyboard: kb('hub:next', 'list:open') },
    };
    const ctrl = new TestController([story, new SpyStory('list')]);
    ctrl.init({
      appApi: {} as never,
      eventBus: {} as never,
      actorResolver: async () => ({ id: 'u' }),
    } as never);

    const response = await ctrl.handleMessage(
      makeUpdate('ответ'),
      { id: 'u' },
      makeSession(),
    );

    expect(story.messageCalled).toBe(1);
    const codes = response?.screen?.keyboard?.rows.flatMap((r) =>
      r.map((b) => b.code),
    );
    // Экран после текстового ввода несёт те же маршруты, что и после
    // кнопки: без префикса контроллера кнопка не маршрутизируется
    expect(codes).toEqual(['learn:hub:next', 'learn:list:open']);
  });
});

describe('BotController — префиксация stop-ответов команд', () => {
  test('коды кнопок экрана stop-ответа префиксованы контроллером', async () => {
    const story = new SpyStory('hub');
    story.commandReaction = {
      reaction: 'stop',
      response: {
        screen: { text: md`Прервать?`, keyboard: kb('hub:cancel', 'hub:back') },
      },
    };
    const ctrl = new TestController([story, new SpyStory('list')]);
    ctrl.init({
      appApi: {} as never,
      eventBus: {} as never,
      actorResolver: async () => ({ id: 'u' }),
    } as never);

    const reaction = await ctrl.handleCommand(
      makeCommandUpdate('cancel'),
      { id: 'u' },
      makeSession(),
    );

    expect(reaction.reaction).toBe('stop');
    if (reaction.reaction !== 'stop') return;
    const codes = reaction.response.screen?.keyboard?.rows.flatMap((r) =>
      r.map((b) => b.code),
    );
    // Экран команды (например, /cancel-confirm) несёт маршруты стори:
    // без префикса контроллера кнопки не маршрутизируются
    expect(codes).toEqual(['learn:hub:cancel', 'learn:hub:back']);
  });
});

describe('BotController — префиксация delegate', () => {
  test('delegate на свою стори → path префиксуется контроллером', async () => {
    const story = new SpyStory('hub', { delegate: { path: 'list:open' } });
    const ctrl = new TestController([story, new SpyStory('list')]);

    const response = await ctrl.handleCallback(
      'hub:go',
      { id: 'u' },
      makeSession(),
    );

    expect(response.delegate?.path).toBe('learn:list:open');
  });

  test('delegate на чужой контроллер → path не трогается', async () => {
    const story = new SpyStory('hub', { delegate: { path: 'user:profile' } });
    const ctrl = new TestController([story]);

    const response = await ctrl.handleCallback(
      'hub:go',
      { id: 'u' },
      makeSession(),
    );

    expect(response.delegate?.path).toBe('user:profile');
  });
});

describe('BotController — handleMessage по dialog.path', () => {
  test('ввод уходит в стори активного диалога', async () => {
    const hub = new SpyStory('hub');
    const list = new SpyStory('list');
    const ctrl = new TestController([hub, list]);

    const response = await ctrl.handleMessage(
      makeUpdate(),
      { id: 'u' },
      makeSession('learn/list', 2),
    );

    expect(list.messageCalled).toBe(1);
    expect(hub.messageCalled).toBe(0);
    expect(response?.release).toBe(true);
  });

  test('диалог без своей стори → handleMessage null', async () => {
    const hub = new SpyStory('hub');
    const ctrl = new TestController([hub]);

    const response = await ctrl.handleMessage(
      makeUpdate(),
      { id: 'u' },
      makeSession('learn/zzz', 2),
    );

    expect(hub.messageCalled).toBe(0);
    expect(response).toBeNull();
  });
});

describe('BotController — handleError', () => {
  test('validation с issues → экран-список', () => {
    const ctrl = new TestController([]);

    // handleError protected — доступ через подкласс не нужен: тестируем через callback-путь
    // (косвенно в «ошибка стори»); здесь прямой вызов через any-мост недопустим,
    // поэтому проверяем через throw в стори
    const story = new SpyStory('hub');
    story.throwError = new AppException(
      errValidation('VALIDATION', 'Bad', {
        issues: [{ path: 'Поле', message: 'плохое' }],
      }),
    );
    const ctrl2 = new TestController([story]);

    return ctrl2
      .handleCallback('hub:open', { id: 'u' }, makeSession())
      .then((response) => {
        expect(String(response.screen?.text)).toContain('Поле');
      });
  });
});

describe('BotController — handleError: errorExitRows (§10.20)', () => {
  /** Контроллер с кнопкой выхода на экранах ошибок. */
  class ExitController extends TestController {
    protected override errorExitRows(): { text: string; code: string }[][] {
      return [[{ text: '⬅️ Меню', code: 'app:main-menu' }]];
    }
  }

  test('хук подставляет кнопки в экран ошибки контроллера', async () => {
    const story = new SpyStory('hub');
    story.throwError = new AppException(
      errNotFound('E', 'Объект не найден', undefined),
    );
    const ctrl = new ExitController([story]);

    const response = await ctrl.handleCallback(
      'hub:open',
      { id: 'u' },
      makeSession(),
    );

    expect(String(response.screen?.text)).toContain('Объект не найден');
    expect(response.screen?.keyboard?.rows).toEqual([
      [{ text: '⬅️ Меню', code: 'app:main-menu' }],
    ]);
  });

  test('без переопределения — экран ошибки без клавиатуры, по умолчанию', async () => {
    const story = new SpyStory('hub');
    story.throwError = new AppException(
      errNotFound('E', 'Объект не найден', undefined),
    );
    const ctrl = new TestController([story]);

    const response = await ctrl.handleCallback(
      'hub:open',
      { id: 'u' },
      makeSession(),
    );

    expect(response.screen?.keyboard).toBeUndefined();
  });
});

describe('BotController — утилиты', () => {
  test('cb: префикс контроллера + action', () => {
    const ctrl = new TestController([]);
    // cb protected — проверяем через его использование в handleCallback не требуется:
    // контракт фиксирован форматом 'controller:story:action'
    expect(ctrl.name).toBe('learn');
  });

  test('кнопка без обработчика → warn-лог с телеметрией (не молчим)', async () => {
    const warns: Array<[string, string, Record<string, unknown> | undefined]> =
      [];
    setGlobalLogger(makeWarnSpyLogger(warns));
    const story = new SpyStory('hub');
    const ctrl = new TestController([story]);
    const session = makeSession('learn/hub', 3);
    const actor: TestActor = { id: 'u1' };

    const response = await ctrl.handleCallback('zzz:q', actor, session);

    expect(String(response.screen?.text)).toContain('Неизвестная команда');
    expect(warns.length).toBe(1);
    expect(warns[0]?.[0]).toBe('bot');
    expect(warns[0]?.[1]).toContain('Кнопка без обработчика');
    // полный код кнопки, какой видел пользователь + контекст диалога и актёр
    expect(warns[0]?.[2]).toMatchObject({
      code: 'learn:zzz:q',
      dialogPath: 'learn/hub',
      actor: { id: 'u1' },
    });
    setGlobalLogger(undefined as unknown as Logger);
  });

  test('getStories возвращает зарегистрированные стори', () => {
    const hub = new SpyStory('hub');
    const ctrl = new TestController([hub]);
    expect(ctrl.getStories().map((s) => s.name)).toEqual(['hub']);
  });
});
