import { describe, expect, test } from 'bun:test';
import { InProcEventBus } from '@u7-scl/core/infra';
import { ConsoleLogger } from '@u7-scl/core/shared';
import { StreamApiModule } from './module';

// Минимальный резолвер: тесты проверяют только декларативный контракт модуля
const module = new StreamApiModule({
  appResolver: { logger: new ConsoleLogger(), mode: 'development' },
  eventBus: new InProcEventBus(),
} as never);

describe('StreamApiModule', () => {
  test('имя модуля — stream', () => {
    expect(module.name).toBe('stream');
  });

  test('модуль регистрирует job мониторинга бездействующих студентов', () => {
    expect(module.jobs).toHaveLength(1);
    expect(module.jobs[0]?.jobName).toBe('inactivity-sweep');
    expect(module.jobs[0]?.schedule).toEqual({
      kind: 'dailyAt',
      hour: 19,
      minute: 0,
    });
  });
});
