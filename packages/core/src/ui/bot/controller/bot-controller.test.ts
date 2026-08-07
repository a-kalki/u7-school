import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import type { ApiModuleMeta, AppMeta } from '#domain/types';
import { type Logger, LogLevel, setGlobalLogger } from '#shared/logger';
import { BotUserStory } from '../bot-user-story';
import type { UiBotButton } from '../public-actions';
import type {
  BotResponse,
  BotUpdate,
  CbMainMenuAction,
  MainMenuAction,
  SessionData,
} from '../types';
import { BotController } from './bot-controller';

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
class TestStory extends BotUserStory<TestAppMeta, { telegramId: number }> {
  readonly name: string;
  initCalled = false;
  resetCalled = false;
  handleStartResult: MainMenuAction | null = null;
  override publicActions = {};

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

  override init(apiApp: unknown, uiApp: unknown): void {
    super.init(apiApp as never, uiApp as never);
    this.initCalled = true;
  }

  override reset(): void {
    super.reset();
    this.resetCalled = true;
  }

  override async handleStart(_actor: unknown): Promise<MainMenuAction | null> {
    return this.handleStartResult;
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
  ): BotUserStory<TestAppMeta, { telegramId: number }> | undefined {
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
      ctrl.init({} as never, undefined as never);
      expect(story1.initCalled).toBe(true);
      expect(story2.initCalled).toBe(true);
    });
  });

  describe('reset', () => {
    test('вызывает reset у всех стори', () => {
      ctrl.reset();
      expect(story1.resetCalled).toBe(true);
      expect(story2.resetCalled).toBe(true);
    });
  });

  describe('handleStart', () => {
    test('агрегирует кнопки от стори с префиксами', async () => {
      story1.handleStartResult = {
        kind: 'callback',
        text: 'Кнопка 1',
        action: 'story_one:act1',
        priority: 20,
      };
      story2.handleStartResult = {
        kind: 'callback',
        text: 'Кнопка 2',
        action: 'story_two:act2',
        priority: 10,
      };

      const result = (await ctrl.handleStart(testActor)) as CbMainMenuAction[];

      expect(result).toHaveLength(2);
      // Контроллер добавляет префикс: test_ctrl:story_two:act2
      expect(result[0]!.text).toBe('Кнопка 2');
      expect(result[0]!.action).toBe('test_ctrl:story_two:act2');
      expect(result[1]!.text).toBe('Кнопка 1');
      expect(result[1]!.action).toBe('test_ctrl:story_one:act1');
    });

    test('пропускает стори с null-результатом', async () => {
      story1.handleStartResult = null;
      story2.handleStartResult = {
        kind: 'callback',
        text: 'Кнопка',
        action: 'act',
        priority: 5,
      };

      const result = await ctrl.handleStart(testActor);
      expect(result).toHaveLength(1);
      expect(result[0]!.text).toBe('Кнопка');
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

  describe('publicActions', () => {
    test('контроллер имеет публичный доступ к stories', () => {
      const c = new TestController();
      const story = new TestStory('my_story');
      (
        story as unknown as {
          publicActions: Record<string, (...ids: string[]) => UiBotButton>;
        }
      ).publicActions = {
        view: (id: string) => ({ text: 'v', code: `my_story:view:${id}` }),
      };
      c.addStory(story);

      // publicActions доступны через story.publicActions, не через контроллер
      expect(story.publicActions).toBeDefined();
      expect(c.getStories()).toHaveLength(1);
    });

    test('контроллер собирает publicActions с нескольких стори', () => {
      const c = new TestController();
      const story1 = new TestStory('story1');
      const story2 = new TestStory('story2');
      (
        story1 as unknown as {
          publicActions: Record<string, (...ids: string[]) => UiBotButton>;
        }
      ).publicActions = {
        doA: () => ({ text: 'a', code: 'a' }),
      };
      (
        story2 as unknown as {
          publicActions: Record<string, (...ids: string[]) => UiBotButton>;
        }
      ).publicActions = {
        doB: () => ({ text: 'b', code: 'b' }),
      };
      c.addStory(story1);
      c.addStory(story2);

      // Проверяем что обе стори доступны
      expect(c.getStories()).toHaveLength(2);
      expect(
        (
          c.getStories()[0] as unknown as {
            publicActions: Record<string, unknown>;
          }
        ).publicActions,
      ).toBeDefined();
      expect(
        (
          c.getStories()[1] as unknown as {
            publicActions: Record<string, unknown>;
          }
        ).publicActions,
      ).toBeDefined();
    });
  });

  describe('init', () => {
    test('пробрасывает uiApp всем стори', () => {
      const c = new TestController();
      const story1 = new TestStory('s1');
      const story2 = new TestStory('s2');
      c.addStory(story1);
      c.addStory(story2);

      const mockUiApp = { getAction: () => undefined } as unknown as ReturnType<
        typeof import('../ui-app').UiApp.prototype.getAction
      >;
      c.init({} as never, mockUiApp as never);

      expect(story1.uiApp).toBe(mockUiApp as never);
      expect(story2.uiApp).toBe(mockUiApp as never);
    });

    test('init с пустым контроллером не падает', () => {
      const c = new TestController();
      c.init({} as never, {} as never);
    });
  });
});
