import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import type { ApiModuleMeta, AppMeta } from '#domain/types';
import { type Logger, LogLevel, setGlobalLogger } from '#shared/logger';
import { BotController } from './bot-controller';
import { BotUiStory } from './bot-ui-story';
import type {
  BotCommand,
  BotResponse,
  BotUpdate,
  NotificationPayload,
  SessionData,
} from './types';

// Тестовый тип метаданных
type TestModuleMeta = ApiModuleMeta & {
  ucMetas: {
    ucName: 'test-mod-cmd';
    input: Record<string, never>;
    output: Record<string, never>;
  };
};
type TestAppMeta = AppMeta & {
  moduleMetas: ApiModuleMeta & {
    ucMetas: {
      ucName: 'test-cmd';
      input: { x: number };
      output: { y: number };
    };
  };
};

// Тестовый актор
const testActor = { telegramId: 123 };

// Тестовая стори
class TestStory extends BotUiStory<TestAppMeta, { telegramId: number }> {
  readonly name: string;
  initCalled = false;
  resetCalled = false;
  initReceived: unknown;

  constructor(name: string) {
    super();
    this.name = name;
  }

  async handleCallback(
    _action: string,
    _actor: unknown,
    _session: SessionData,
  ): Promise<BotResponse> {
    return { sendMessage: { text: `story_callback:${this.name}` } };
  }

  async handleMessage(
    _update: BotUpdate,
    _actor: unknown,
    _session: SessionData,
  ): Promise<BotResponse> {
    return { sendMessage: { text: `story_message:${this.name}` } };
  }

  override init(resolve: unknown, sender?: unknown): void {
    super.init(resolve as never, sender as never);
    this.initReceived = sender;
    this.initCalled = true;
  }

  override reset(): void {
    super.reset();
    this.resetCalled = true;
  }
}

// Конкретный контроллер для тестов
class TestController extends BotController<
  TestAppMeta,
  { telegramId: number }
> {
  readonly name = 'test_ctrl';

  // Экспонируем protected-методы
  public override cb(action: string): string {
    return super.cb(action);
  }

  public override stripPrefix(data: string): string {
    return super.stripPrefix(data);
  }

  public override findStory(
    name: string,
  ): BotUiStory<TestAppMeta, { telegramId: number }> | undefined {
    return super.findStory(name);
  }

  addStory(story: TestStory): void {
    (this.stories as unknown as TestStory[]).push(story);
  }
}

describe('BotController', () => {
  let ctrl: TestController;
  let story1: TestStory;
  let story2: TestStory;

  beforeEach(() => {
    ctrl = new TestController();
    story1 = new TestStory('story_one');
    story2 = new TestStory('story_two');
    ctrl.addStory(story1);
    ctrl.addStory(story2);
  });

  describe('init', () => {
    test('вызывает init у всех стори', () => {
      ctrl.init({} as never);
      expect(story1.initCalled).toBe(true);
      expect(story2.initCalled).toBe(true);
    });
  });

  describe('init (proactiveSender)', () => {
    test('передаёт себя стори отдельным аргументом', () => {
      const mockSender = {
        send: mock(async () => {}),
        notify: mock(async () => {}),
        kickFromGroup: mock(async () => {}),
      };
      ctrl.init({} as never, mockSender);
      expect(story1.initReceived).toBe(ctrl);
      expect(story2.initReceived).toBe(ctrl);
    });
  });

  describe('send (ProactiveSender)', () => {
    test('префиксирует коды кнопок и делегирует в родителя', async () => {
      const mockSender = {
        send: mock(async () => {}),
        notify: mock(async () => {}),
        kickFromGroup: mock(async () => {}),
      };
      ctrl.addStory(new TestStory('fill'));
      ctrl.init({} as never, mockSender);

      await ctrl.send(123, {
        sendMessage: {
          text: 'Привет',
          keyboard: {
            rows: [[{ text: 'Начать', code: 'fill:start:q1' }]],
            isMultiple: false,
          },
        },
      });

      expect(mockSender.send).toHaveBeenCalled();
      const [tgId, command] = (mockSender.send as ReturnType<typeof mock>).mock
        .calls[0] as [number, BotCommand];
      expect(tgId).toBe(123);
      expect(command.sendMessage?.keyboard?.rows[0]?.[0]?.code).toBe(
        'test_ctrl:fill:start:q1',
      );
    });
  });

  describe('notify (ProactiveSender)', () => {
    test('делегирует payload родителю без изменений (кнопок в уведомлении нет)', async () => {
      const mockSender = {
        send: mock(async () => {}),
        notify: mock(async () => {}),
        kickFromGroup: mock(async () => {}),
      };
      ctrl.addStory(new TestStory('hub'));
      ctrl.init({} as never, mockSender);

      await ctrl.notify(123, {
        text: '🎓 Ты зачислен',
        parseMode: 'MarkdownV2',
      });

      expect(mockSender.notify).toHaveBeenCalled();
      const [tgId, payload] = (mockSender.notify as ReturnType<typeof mock>)
        .mock.calls[0] as [number, NotificationPayload];
      expect(tgId).toBe(123);
      expect(payload).toEqual({
        text: '🎓 Ты зачислен',
        parseMode: 'MarkdownV2',
      });
    });
  });

  describe('reset', () => {
    test('вызывает reset у всех стори', () => {
      ctrl.reset();
      expect(story1.resetCalled).toBe(true);
      expect(story2.resetCalled).toBe(true);
    });
  });

  describe('findStory', () => {
    test('находит стори по имени', () => {
      expect(ctrl.findStory('story_one')).toBe(story1);
      expect(ctrl.findStory('story_two')).toBe(story2);
    });

    test('возвращает undefined для неизвестного имени', () => {
      expect(ctrl.findStory('unknown')).toBeUndefined();
    });
  });

  describe('handleCancel', () => {
    test('без активного обработчика — освобождает ввод', async () => {
      const result = await ctrl.handleCancel(testActor, {
        activeHandler: null,
      });
      assertResponseMarkdownSafe(result);
      expect(result.releaseInput).toBe(true);
    });

    test('с активным обработчиком — делегирует стори', async () => {
      const result = await ctrl.handleCancel(testActor, {
        activeHandler: {
          path: '/test_ctrl/story_one',
        },
      });
      assertResponseMarkdownSafe(result);
      expect(result.releaseInput).toBe(true);
    });
  });

  describe('handleCallback', () => {
    test('делегирует в стори по префиксу в data', async () => {
      const result = await ctrl.handleCallback(
        'story_one:some_action',
        testActor,
        { activeHandler: null },
      );
      assertResponseMarkdownSafe(result);
      expect(result.sendMessage?.text).toBe('story_callback:story_one');
    });

    test('кнопка app:main-menu не префиксируется контроллером (roundtrip)', async () => {
      const story = new TestStory('app_test');
      story.handleCallback = async () => ({
        sendMessage: {
          text: 'Меню',
          keyboard: {
            rows: [[{ text: '↩️ Главное меню', code: 'app:main-menu' }]],
            isMultiple: false,
          },
        },
      });
      const c = new TestController();
      c.addStory(story);

      const result = await c.handleCallback('app_test:action', testActor, {
        activeHandler: null,
      });

      assertResponseMarkdownSafe(result);
      // Код кнопки НЕ должен быть префиксирован именем контроллера
      const btnCode = result.sendMessage?.keyboard?.rows[0]?.[0]?.code;
      expect(btnCode).toBe('app:main-menu');
      expect(btnCode).not.toContain('test_ctrl');
    });

    test('код стори префиксируется именем контроллера', async () => {
      const story = new TestStory('app_test');
      story.handleCallback = async () => ({
        sendMessage: {
          text: 'Меню',
          keyboard: {
            rows: [[{ text: 'Далее', code: 'app_test:next' }]],
            isMultiple: false,
          },
        },
      });
      const c = new TestController();
      c.addStory(story);

      const result = await c.handleCallback('app_test:action', testActor, {
        activeHandler: null,
      });

      const btnCode = result.sendMessage?.keyboard?.rows[0]?.[0]?.code;
      expect(btnCode).toBe('test_ctrl:app_test:next');
    });

    test('без совпадения стори — возвращает ошибку', async () => {
      const result = await ctrl.handleCallback('unknown:action', testActor, {
        activeHandler: null,
      });
      assertResponseMarkdownSafe(result);
      expect(result.sendMessage?.text).toBe('⚠️ Неизвестная команда');
    });
  });

  describe('handleMessage', () => {
    test('с активной стори — делегирует ей', async () => {
      const result = await ctrl.handleMessage(
        { type: 'message', text: 'привет', telegramId: 123 },
        testActor,
        {
          activeHandler: { path: '/test_ctrl/story_one' },
        },
      );
      assertResponseMarkdownSafe(result);
      expect(result.sendMessage?.text).toBe('story_message:story_one');
    });

    test('без активной стори — возвращает ошибку', async () => {
      const result = await ctrl.handleMessage(
        { type: 'message', text: 'привет', telegramId: 123 },
        testActor,
        { activeHandler: null },
      );
      assertResponseMarkdownSafe(result);
      expect(result.sendMessage?.text).toBe('⚠️ Неизвестная команда');
    });
  });

  describe('cb / stripPrefix', () => {
    test('cb добавляет префикс контроллера', () => {
      expect(ctrl.cb('action')).toBe('test_ctrl:action');
    });

    test('stripPrefix убирает префикс контроллера', () => {
      expect(ctrl.stripPrefix('test_ctrl:action')).toBe('action');
    });

    test('stripPrefix не трогает чужие префиксы', () => {
      expect(ctrl.stripPrefix('other_ctrl:action')).toBe('other_ctrl:action');
    });
  });

  describe('перехват ошибок стори', () => {
    let mockLogger: Logger & { error: ReturnType<typeof mock> };

    beforeEach(() => {
      mockLogger = {
        debug: mock(() => {}),
        info: mock(() => {}),
        warn: mock(() => {}),
        error: mock(() => {}),
        setLogLevel: mock(() => {}),
        getLogLevel: mock(() => LogLevel.DEBUG),
        setSourceLevel: mock(() => {}),
      } as unknown as Logger & { error: ReturnType<typeof mock> };
      setGlobalLogger(mockLogger);
    });

    afterEach(() => {
      // Сбрасываем
    });

    test('перехватывает исключение в handleCallback и логирует', async () => {
      const errorStory = new TestStory('error_story');
      errorStory.handleCallback = async () => {
        throw new Error('Бум!');
      };
      const c = new TestController();
      c.addStory(errorStory);

      const result = await c.handleCallback(
        'error_story:some_action',
        testActor,
        { activeHandler: null },
      );

      // Пользователь видит общее сообщение, не детали
      assertResponseMarkdownSafe(result);
      expect(result.sendMessage?.text).toContain('внутренняя ошибка');
      expect(result.sendMessage?.text).not.toContain('Бум');

      // Ошибка залогирована
      expect(mockLogger.error).toHaveBeenCalled();
      const errorCall = (mockLogger.error as ReturnType<typeof mock>).mock
        .calls[0];
      expect(errorCall![0]).toBe('bot');
    });

    test('перехватывает исключение в handleMessage и логирует', async () => {
      const errorStory = new TestStory('error_story');
      errorStory.handleMessage = async () => {
        throw new Error('Бум в сообщении!');
      };
      const c = new TestController();
      c.addStory(errorStory);

      const result = await c.handleMessage(
        { type: 'message', text: 'привет', telegramId: 123 },
        testActor,
        { activeHandler: { path: '/test_ctrl/error_story' } },
      );

      assertResponseMarkdownSafe(result);
      expect(result.sendMessage?.text).toContain('внутренняя ошибка');
      expect(result.sendMessage?.text).not.toContain('Бум в сообщении');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('init', () => {
    test('init с пустым контроллером не падает', () => {
      const c = new TestController();
      c.init({} as never);
    });
  });
});
