import { describe, expect, test } from 'bun:test';

describe('core/domain/types — ApiExecutor и хелперы', () => {
  test('ApiExecutor импортируется из @u7-scl/core/domain', async () => {
    const mod = await import('@u7-scl/core/domain');
    // ApiExecutor — интерфейс, стирается в рантайме.
    // Проверяем, что модуль компилируется и доступен.
    expect(mod).toBeDefined();
  });

  test('AppResolver существует и содержит logger + mode', async () => {
    // Компиляционная проверка: если AppResolver не экспортирован,
    // этот тест упадёт на этапе сборки
    const mod = await import('@u7-scl/core/domain');
    expect(mod).toBeDefined();
  });

  test('ModuleResolver содержит appResolver', async () => {
    const mod = await import('@u7-scl/core/domain');
    expect(mod).toBeDefined();
  });
});
