import { describe, expect, test } from 'bun:test';
import type { DomainEvent } from '#domain/events/domain-event';
import { InProcEventBus } from '../../infra/in-proc-event-bus';
import { UseCase } from './use-case';

// ═══════════════════════════════════════════════════════════════════
// Моки
// ═══════════════════════════════════════════════════════════════════

/** Заглушка агрегата с событиями */
class ArWithEvents {
  private events: DomainEvent[] = [];

  addEvent(event: DomainEvent) {
    this.events.push(event);
  }

  hasEvents(): boolean {
    return this.events.length > 0;
  }

  flushEvents(): DomainEvent[] {
    const copy = [...this.events];
    this.events = [];
    return copy;
  }
}

/** Заглушка агрегата без событий */
class ArWithoutEvents {
  hasEvents(): boolean {
    return false;
  }

  flushEvents(): DomainEvent[] {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════
// Тестовый UseCase
// ═══════════════════════════════════════════════════════════════════

type TestMeta = {
  ucName: 'test-publish';
  arMeta: { name: 'TestAr'; label: 'Тестовый агрегат' };
  input: { action: string };
  output: { ok: boolean };
  errors: never;
  requiresAuth: false;
  type: 'command';
};

class TestUc extends UseCase<TestMeta> {
  protected readonly ucName = 'test-publish' as const;
  protected readonly ucLabel = 'Тестовый UseCase';
  protected readonly arMeta = {
    arName: 'TestAr' as const,
    arLabel: 'Тестовый агрегат' as const,
  };
  protected readonly type = 'command' as const;
  protected readonly requiresAuth = false as const;
  protected readonly inputSchema = {} as never;
  protected readonly outputSchema = {} as never;

  /** Выставляет publishEvents наружу для тестов */
  testPublishEvents(ar: {
    hasEvents(): boolean;
    flushEvents(): DomainEvent[];
  }) {
    this.publishEvents(ar);
  }

  protected async execute(
    command: TestMeta['input'],
    _actorId: string | undefined,
  ): Promise<TestMeta['output']> {
    return { ok: command.action === 'ok' };
  }
}

// ═══════════════════════════════════════════════════════════════════
// Тесты
// ═══════════════════════════════════════════════════════════════════

describe('UseCase.publishEvents', () => {
  test('агрегат с событиями → события публикуются', () => {
    const eventBus = new InProcEventBus();
    const received: DomainEvent[] = [];
    eventBus.subscribe('completed', async (e: DomainEvent) => {
      received.push(e);
    });

    const uc = new TestUc();
    uc.init({ eventBus } as never);

    const ar = new ArWithEvents();
    const event: DomainEvent = {
      eventId: 'evt-001',
      eventName: 'completed',
      occurredAt: new Date().toISOString(),
      aggregateName: 'TestAr',
      aggregateId: 'ar-1',
      payload: { score: 100 },
    };
    ar.addEvent(event);

    uc.testPublishEvents(ar);

    expect(received).toHaveLength(1);
    expect(received[0]!.eventId).toBe('evt-001');
    // После публикации события в агрегате больше нет
    expect(ar.hasEvents()).toBe(false);
  });

  test('без EventBus в resolve — не падает', () => {
    const uc = new TestUc();
    uc.init({} as never); // resolve без eventBus

    const ar = new ArWithEvents();
    ar.addEvent({
      eventId: 'evt-002',
      eventName: 'completed',
      occurredAt: new Date().toISOString(),
      aggregateName: 'TestAr',
      aggregateId: 'ar-1',
      payload: {},
    });

    // Не должно упасть
    expect(() => uc.testPublishEvents(ar)).not.toThrow();
  });

  test('агрегат без событий — не падает, ничего не публикует', () => {
    const eventBus = new InProcEventBus();
    const received: DomainEvent[] = [];
    eventBus.subscribe('completed', async (e: DomainEvent) => {
      received.push(e);
    });

    const uc = new TestUc();
    uc.init({ eventBus } as never);

    const ar = new ArWithoutEvents();

    expect(() => uc.testPublishEvents(ar)).not.toThrow();
    expect(received).toHaveLength(0);
  });

  test('несколько событий публикуются все', () => {
    const eventBus = new InProcEventBus();
    const received: DomainEvent[] = [];
    eventBus.subscribe('completed', async (e: DomainEvent) => {
      received.push(e);
    });
    eventBus.subscribe('failed', async (e: DomainEvent) => {
      received.push(e);
    });

    const uc = new TestUc();
    uc.init({ eventBus } as never);

    const ar = new ArWithEvents();
    ar.addEvent({
      eventId: 'evt-003',
      eventName: 'completed',
      occurredAt: new Date().toISOString(),
      aggregateName: 'TestAr',
      aggregateId: 'ar-1',
      payload: {},
    });
    ar.addEvent({
      eventId: 'evt-004',
      eventName: 'failed',
      occurredAt: new Date().toISOString(),
      aggregateName: 'TestAr',
      aggregateId: 'ar-1',
      payload: {},
    });

    uc.testPublishEvents(ar);

    expect(received).toHaveLength(2);
  });
});
