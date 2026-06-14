import { describe, expect, test } from 'bun:test';

describe('@u7-scl/app/domain — мета-типы приложения', () => {
  test('U7BotAppMeta и U7AppResolver доступны на уровне типов', async () => {
    const mod = await import('@u7-scl/app/domain');
    // Типы стираются в рантайме; проверяем что модуль импортируется без ошибок
    expect(mod).toBeDefined();
  });
});
