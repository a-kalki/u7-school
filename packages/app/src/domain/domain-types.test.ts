import { describe, expect, test } from 'bun:test';

describe('@u7-scl/app/domain — мета-типы приложения', () => {
  test('User, UserArMeta, Role доступны', async () => {
    const mod = await import('@u7-scl/app/domain');
    // Типы стираются в рантайме; проверяем что модуль импортируется без ошибок
    expect(mod).toBeDefined();
  });

  test('U7BotAppMeta и U7AppResolver доступны из нового пути', async () => {
    const mod = await import('@u7-scl/bot/u7-bot-app-meta');
    expect(mod).toBeDefined();
  });
});
