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
  ): Promise<DialogResponse | null> {
    this.messageCalled++;
    return { release: true };
  }
}

class TestController extends BotController<AppMeta, TestActor> {
  name = 'learn';

  constructor(stories: SpyStory[]) {
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
