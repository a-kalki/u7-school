import { beforeEach, describe, expect, test } from 'bun:test';
import type { ApiModuleMeta, AppMeta } from '#domain/types';
import { BotUserStory } from './bot-user-story';
import type {
  BotActor,
  BotResponse,
  BotUpdate,
  MainMenuAction,
  SessionData,
} from './types';

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

// Тестовый актор
const testActor: BotActor = {
  telegramId: 123,
  uuid: 'uuid-1',
  name: 'Тестовый',
  roles: ['STUDENT'],
};

// Конкретная реализация для тестов — экспонирует protected-методы как публичные
class TestStory extends BotUserStory<TestAppMeta> {
  readonly name = 'test_story';

  async handleCallback(
    action: string,
    _actor: BotActor,
    _session: SessionData,
  ): Promise<BotResponse> {
    return { sendMessage: { text: `callback: ${action}` } };
  }

  async handleMessage(
    update: BotUpdate,
    _actor: BotActor,
    _session: SessionData,
  ): Promise<BotResponse> {
    if (update.type === 'message') {
      return { sendMessage: { text: `echo: ${update.text}` } };
    }
    return { sendMessage: { text: 'ok' } };
  }

  // Экспонируем protected-методы для тестирования
  public override cb(action: string): string {
    return super.cb(action);
  }

  public override stripPrefix(data: string): string {
    return super.stripPrefix(data);
  }

  public override shrink(value: string): string {
    return super.shrink(value);
  }

  public override expand(key: string): string | undefined {
    return super.expand(key);
  }
}

describe('BotUserStory', () => {
  let story: TestStory;

  beforeEach(() => {
    story = new TestStory();
  });

  describe('cb', () => {
    test('добавляет префикс имени стори', () => {
      expect(story.cb('some_action')).toBe('test_story:some_action');
    });

    test('работает с пустым действием', () => {
      expect(story.cb('')).toBe('test_story:');
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

  describe('shrink / expand', () => {
    test('shrink генерирует 8-символьный hex-ключ и сохраняет значение', () => {
      const key = story.shrink('очень длинное значение');
      expect(key).toMatch(/^[0-9a-f]{8}$/);
    });

    test('expand восстанавливает значение по ключу', () => {
      const key = story.shrink('значение');
      expect(story.expand(key)).toBe('значение');
    });

    test('shrink генерирует уникальные ключи', () => {
      const key1 = story.shrink('a');
      const key2 = story.shrink('b');
      expect(key1).not.toBe(key2);
    });

    test('expand возвращает undefined для неизвестного ключа', () => {
      expect(story.expand('unknown')).toBeUndefined();
    });
  });

  describe('reset', () => {
    test('очищает shortIds', () => {
      const key1 = story.shrink('value1');
      const key2 = story.shrink('value2');
      expect(story.expand(key1)).toBe('value1');

      story.reset();
      expect(story.expand(key1)).toBeUndefined();
      expect(story.expand(key2)).toBeUndefined();
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
});
