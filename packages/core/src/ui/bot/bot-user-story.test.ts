import { beforeEach, describe, expect, test } from 'bun:test';
import type { ApiModuleMeta, AppMeta } from '#domain/types';
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
    test('shrink использует первые 8 символов значения как ключ', () => {
      const key = story.shrink('очень длинное значение');
      // Берутся первые 8 символов строки
      expect(key).toBe('очень дл');
    });

    test('expand восстанавливает значение по ключу', () => {
      const key = story.shrink('значение');
      expect(story.expand(key)).toBe('значение');
    });

    test('shrink: разные значения с разным префиксом дают разные ключи', () => {
      const key1 = story.shrink('abcdefgh');
      const key2 = story.shrink('bbcdefgh');
      expect(key1).not.toBe(key2);
    });

    test('shrink: коллизия по префиксу добавляет суффикс', () => {
      // Два значения с одинаковыми первыми 8 символами
      const key1 = story.shrink('12345678-aaaa');
      const key2 = story.shrink('12345678-bbbb');
      // Второй ключ должен отличаться от первого (добавлен суффикс)
      expect(key1).toBe('12345678');
      expect(key2).not.toBe(key1);
      expect(key2).toMatch(/^12345678-/);
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
