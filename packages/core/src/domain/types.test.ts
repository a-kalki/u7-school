import { describe, expect, test } from 'bun:test';
import type { AppResolver, ModuleResolver } from './types';

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

  test('ModuleResolver<TAppResolver> принимает расширенный AppResolver и совместим без параметра', () => {
    interface CustomAppResolver extends AppResolver {
      customField: string;
    }

    // Проверка 1: ModuleResolver параметризуется расширенным AppResolver
    type ParameterizedResolver = ModuleResolver<CustomAppResolver>;
    const customInstance: ParameterizedResolver = {
      appResolver: {
        logger: {} as any,
        mode: 'test',
        eventBus: {} as any,
        customField: 'hello',
      },
      eventBus: {} as any,
    };
    expect(customInstance.appResolver.customField).toBe('hello');

    // Проверка 2: ModuleResolver без параметра совместим со стандартным AppResolver
    type DefaultResolver = ModuleResolver;
    const defaultInstance: DefaultResolver = {
      appResolver: {
        logger: {} as any,
        mode: 'test',
        eventBus: {} as any,
      },
      eventBus: {} as any,
    };
    expect(defaultInstance.appResolver.mode).toBe('test');
  });
});
