import { describe, expect, test } from 'bun:test';

describe('Пакет @u7-scl/app — инициализация', () => {
  test('корневой экспорт @u7-scl/app доступен', async () => {
    const mod = await import('@u7-scl/app');
    expect(mod).toBeDefined();
  });

  test('экспорт @u7-scl/app/domain доступен', async () => {
    const mod = await import('@u7-scl/app/domain');
    expect(mod).toBeDefined();
  });

  test('экспорт @u7-scl/app/ui доступен', async () => {
    const mod = await import('@u7-scl/app/ui');
    expect(mod).toBeDefined();
  });
});
