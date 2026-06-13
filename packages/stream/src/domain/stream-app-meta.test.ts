import { describe, expect, test } from 'bun:test';
import type { StreamAppMeta } from './module';

describe('StreamAppMeta (типы)', () => {
  test('StreamAppMeta имеет корректный name', () => {
    // Типовой тест: проверяем, что тип компилируется
    const meta: StreamAppMeta = {
      name: 'stream-bot',
      moduleMetas: {
        name: 'stream' as const,
        url: '/stream',
        ucMetas: {} as never,
      },
    };
    // Проверяем поле
    const _name: 'stream-bot' = meta.name;
    expect(_name).toBe('stream-bot');
  });

  test('StreamAppMeta принимает UserApiModuleMeta', () => {
    const meta: StreamAppMeta = {
      name: 'stream-bot',
      moduleMetas: {
        name: 'user' as const,
        url: '/user',
        ucMetas: {} as never,
      },
    };
    expect(meta.name).toBe('stream-bot');
  });
});
