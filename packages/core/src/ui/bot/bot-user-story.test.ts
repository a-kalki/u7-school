import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import type { ApiModuleMeta, AppMeta } from '#domain/types';
import {
  getGlobalLogger,
  type Logger,
  LogLevel,
  setGlobalLogger,
} from '#shared/logger';
import { BotUserStory } from './bot-user-story';
import type { BotResponse, BotUpdate, SessionData } from './types';

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

// Тестовый актор — минимально содержит telegramId
const testActor = {
  telegramId: 123,
};

// Конкретная реализация для тестов — экспонирует protected-методы как публичные
class TestStory extends BotUserStory<TestAppMeta, TestModuleMeta> {
  readonly name = 'test_story';

  async handleCallback(
    action: string,
    _actor: { telegramId: number },
    _session: SessionData,
  ): Promise<BotResponse> {
    return { sendMessage: { text: `callback: ${action}` } };
  }

  async handleMessage(
    update: BotUpdate,
    _actor: { telegramId: number },
    _session: SessionData,
  ): Promise<BotResponse> {
    if (update.type === 'message') {
      return { sendMessage: { text: `echo: ${update.text}` } };
    }
    return { sendMessage: { text: 'ok' } };
  }

  // Экспонируем protected-методы для тестирования
  public override cb(action: string, ...ids: string[]): string {
    return super.cb(action, ...ids);
  }

  public override cbFor(
    storyName: string,
    action: string,
    ...ids: string[]
  ): string {
    return super.cbFor(storyName, action, ...ids);
  }

  public override stripPrefix(data: string): string {
    return super.stripPrefix(data);
  }

  public override get logger(): ReturnType<typeof getGlobalLogger> {
    return super.logger;
  }
}

describe('BotUserStory', () => {
  let story: TestStory;

  beforeEach(() => {
    story = new TestStory();
  });

  describe('cb', () => {
    test('формирует callback_data: storyName:action (без префикса контроллера)', () => {
      expect(story.cb('some_action')).toBe('test_story:some_action');
    });

    test('добавляет id через двоеточие', () => {
      expect(story.cb('complete', 'uuid-1', 'uuid-2')).toBe(
        'test_story:complete:uuid-1:uuid-2',
      );
    });

    test('работает с пустым действием', () => {
      expect(story.cb('')).toBe('test_story:');
    });

    test('без id — только storyName:action', () => {
      expect(story.cb('view')).toBe('test_story:view');
    });
  });

  describe('cbFor', () => {
    test('кросс-стори колбэк: targetStory:action (без префикса контроллера)', () => {
      expect(story.cbFor('view-stream', 'view')).toBe('view-stream:view');
    });

    test('кросс-стори с id', () => {
      expect(story.cbFor('monitor', 'detail', 'student-uuid')).toBe(
        'monitor:detail:student-uuid',
      );
    });

    test('кросс-стори с несколькими id', () => {
      expect(story.cbFor('monitor', 'history', 'id1', 'id2')).toBe(
        'monitor:history:id1:id2',
      );
    });
  });

  describe('stripPrefix', () => {
    test('убирает префикс имени стори', () => {
      expect(story.stripPrefix('test_story:some_action')).toBe('some_action');
    });

    test('не трогает данные без префикса', () => {
      expect(story.stripPrefix('other_story:action')).toBe(
        'other_story:action',
      );
    });

    test('не трогает частичное совпадение', () => {
      expect(story.stripPrefix('test_story_extra:action')).toBe(
        'test_story_extra:action',
      );
    });
  });

  describe('handleStart', () => {
    test('по умолчанию возвращает null', async () => {
      const result = await story.handleStart(testActor);
      expect(result).toBeNull();
    });
  });

  describe('handleCancel', () => {
    test('по умолчанию возвращает releaseInput', async () => {
      const result = await story.handleCancel(testActor, {
        activeHandler: null,
      });
      expect(result.releaseInput).toBe(true);
    });
  });

  describe('handleTimeout', () => {
    test('по умолчанию возвращает releaseInput и сообщение', async () => {
      const result = await story.handleTimeout(testActor, {
        activeHandler: null,
      });
      expect(result.releaseInput).toBe(true);
      expect(result.sendMessage?.text).toContain('истекло');
    });
  });

  describe('конкретная реализация', () => {
    test('handleCallback передаёт action', async () => {
      const resp = await story.handleCallback('my_action', testActor, {
        activeHandler: null,
      });
      expect(resp.sendMessage?.text).toBe('callback: my_action');
    });

    test('handleMessage обрабатывает текстовые сообщения', async () => {
      const resp = await story.handleMessage(
        { type: 'message', text: 'привет', telegramId: 123 },
        testActor,
        { activeHandler: null },
      );
      expect(resp.sendMessage?.text).toBe('echo: привет');
    });
  });

  describe('logger', () => {
    let savedLogger: Logger | undefined;

    beforeEach(() => {
      savedLogger = getGlobalLogger();
    });

    afterEach(() => {
      if (savedLogger) {
        setGlobalLogger(savedLogger);
      }
    });

    test('возвращает глобальный логгер, когда он установлен', () => {
      const mockLogger: Logger = {
        debug: mock(() => {}),
        info: mock(() => {}),
        warn: mock(() => {}),
        error: mock(() => {}),
        setLogLevel: mock(() => {}),
        getLogLevel: mock(() => LogLevel.DEBUG),
        setSourceLevel: mock(() => {}),
      };

      setGlobalLogger(mockLogger);

      const s = new TestStory();
      expect(s.logger).toBe(mockLogger);
    });

    test('возвращает undefined, когда глобальный логгер не установлен', () => {
      // Сбрасываем глобальный логгер
      setGlobalLogger(undefined as unknown as Logger);

      const s = new TestStory();
      expect(s.logger).toBeUndefined();
    });
  });
});
