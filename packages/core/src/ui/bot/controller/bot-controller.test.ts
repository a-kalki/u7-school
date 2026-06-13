import { beforeEach, describe, expect, test } from 'bun:test';
import type { ApiModuleMeta, AppMeta } from '#domain/types';
import { BotController } from './bot-controller';
import { BotUserStory } from '../bot-user-story';
import type {
  BotResponse,
  BotUpdate,
  MainMenuAction,
  SessionData,
} from '../types';

// Тестовый тип метаданных
type TestAppMeta = AppMeta & {
  moduleMetas: ApiModuleMeta & {
    ucMetas: {
      ucName: 'test-cmd';
      input: { x: number };
      output: { y: number };
    };
  };
};

// Тестовый актор — минимально содержит telegramId
const testActor = {
  telegramId: 123,
};

// Тестовая стори
class TestStory extends BotUserStory<TestAppMeta> {
  readonly name: string;
  initCalled = false;
  resetCalled = false;
  handleStartResult: MainMenuAction | null = null;

  constructor(name: string) {
    super();
    this.name = name;
  }

  async handleCallback(
    _action: string,
    _actor: { telegramId: number },
    _session: SessionData,
  ): Promise<BotResponse> {
    return { sendMessage: { text: `story_callback:${this.name}` } };
  }

  async handleMessage(
    _update: BotUpdate,
    _actor: { telegramId: number },
    _session: SessionData,
  ): Promise<BotResponse> {
    return { sendMessage: { text: `story_message:${this.name}` } };
  }

  override init(api: unknown): void {
    super.init(api as never);
    this.initCalled = true;
  }

  override reset(): void {
    super.reset();
    this.resetCalled = true;
  }

  override async handleStart(
    _actor: { telegramId: number },
  ): Promise<MainMenuAction | null> {
    return this.handleStartResult;
  }
}

// Конкретный контроллер для тестов
class TestController extends BotController<TestAppMeta> {
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
  ): BotUserStory<TestAppMeta> | undefined {
    return super.findStory(name);
  }

  addStory(story: TestStory): void {
    (this as unknown as { stories: TestStory[] }).stories.push(story);
  }

  async handleUpdate(
    _update: BotUpdate,
    _actorId: string,
  ): Promise<BotResponse> {
    return { sendMessage: { text: 'fallback_update' } };
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
        text: 'Кнопка 1',
        action: 'act1',
        priority: 20,
      };
      story2.handleStartResult = {
        text: 'Кнопка 2',
        action: 'act2',
        priority: 10,
      };

      const result = await ctrl.handleStart(testActor);

      expect(result).toHaveLength(2);
      expect(result[0]!.text).toBe('Кнопка 2');
      expect(result[0]!.action).toBe('test_ctrl:act2');
      expect(result[1]!.text).toBe('Кнопка 1');
      expect(result[1]!.action).toBe('test_ctrl:act1');
    });

    test('пропускает стори с null-результатом', async () => {
      story1.handleStartResult = null;
      story2.handleStartResult = {
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
      expect(result.releaseInput).toBe(true);
    });

    test('с активным обработчиком — делегирует стори', async () => {
      const result = await ctrl.handleCancel(testActor, {
        activeHandler: {
          path: '/test_ctrl/story_one',
        },
      });
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
      expect(result.sendMessage?.text).toBe('story_callback:story_one');
    });

    test('без совпадения стори — fallback на handleUpdate', async () => {
      const result = await ctrl.handleCallback(
        'unknown:action',
        testActor,
        { activeHandler: null },
      );
      expect(result.sendMessage?.text).toBe('fallback_update');
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
      expect(result.sendMessage?.text).toBe('story_message:story_one');
    });

    test('без активной стори — fallback на handleUpdate', async () => {
      const result = await ctrl.handleMessage(
        { type: 'message', text: 'привет', telegramId: 123 },
        testActor,
        { activeHandler: null },
      );
      expect(result.sendMessage?.text).toBe('fallback_update');
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
});
