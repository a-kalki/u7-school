import { describe, expect, test } from 'bun:test';
import { InProcEventBus } from '@u7-scl/core/infra';
import { ConsoleLogger } from '@u7-scl/core/shared';
import { WishApiModule } from './module';

// Минимальный резолвер: тесты проверяют только декларативный контракт модуля
const module = new WishApiModule({
  appResolver: { logger: new ConsoleLogger(), mode: 'development' },
  eventBus: new InProcEventBus(),
} as never);

describe('WishApiModule', () => {
  test('имя модуля — wish', () => {
    expect(module.name).toBe('wish');
  });

  test('модуль не содержит job (явное пустое объявление по контракту ApiModule)', () => {
    expect(module.jobs).toEqual([]);
  });
});
