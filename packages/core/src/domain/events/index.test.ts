import { describe, expect, test } from 'bun:test';
import type { DomainEvent } from './domain-event';
import type { EventBus } from './event-bus';

// ═══════════════════════════════════════════════════════════════════
// Фаза 1 (Red): Тесты интерфейсных контрактов DomainEvent и EventBus
// ═══════════════════════════════════════════════════════════════════

// Мок-реализация EventBus для проверки контракта интерфейса
class MockEventBus implements EventBus {
  private handlers = new Map<string, Array<(event: DomainEvent) => Promise<void>>>();

  publish<E extends DomainEvent>(event: E): void {
    const eventHandlers = this.handlers.get(event.eventType) ?? [];
    for (const handler of eventHandlers) {
      handler(event as DomainEvent);
    }
  }

  subscribe<E extends DomainEvent>(
    eventType: string,
    handler: (event: E) => Promise<void>,
  ): () => void {
    const existing = this.handlers.get(eventType) ?? [];
    existing.push(handler as (event: DomainEvent) => Promise<void>);
    this.handlers.set(eventType, existing);
    return () => {
      const updated = (this.handlers.get(eventType) ?? []).filter(
        (h) => h !== (handler as (event: DomainEvent) => Promise<void>),
      );
      this.handlers.set(eventType, updated);
    };
  }
}

describe('core/domain/events — DomainEvent (контракт)', () => {
  test('объект, соответствующий DomainEvent, имеет обязательные поля', () => {
    const event: DomainEvent = {
      eventId: 'evt-001',
      eventType: 'questionnaire.completed',
      occurredAt: new Date().toISOString(),
      aggregateType: 'Questionnaire',
      aggregateId: 'q-123',
      payload: { respondentId: 42 },
    };

    expect(event.eventId).toBeString();
    expect(event.eventType).toBe('questionnaire.completed');
    expect(event.occurredAt).toBeString();
    expect(event.aggregateType).toBe('Questionnaire');
    expect(event.aggregateId).toBe('q-123');
    expect(event.payload).toBeObject();
    expect(event.payload.respondentId).toBe(42);
  });

  test('eventId уникален для каждого события', () => {
    const event1: DomainEvent = {
      eventId: 'evt-aaa',
      eventType: 'test.event',
      occurredAt: new Date().toISOString(),
      aggregateType: 'Test',
      aggregateId: 't-1',
      payload: {},
    };

    const event2: DomainEvent = {
      eventId: 'evt-bbb',
      eventType: 'test.event',
      occurredAt: new Date().toISOString(),
      aggregateType: 'Test',
      aggregateId: 't-1',
      payload: {},
    };

    expect(event1.eventId).not.toBe(event2.eventId);
  });
});

describe('core/domain/events — EventBus (контракт через MockEventBus)', () => {
  test('подписка получает опубликованное событие', async () => {
    const bus = new MockEventBus();
    let received: DomainEvent | null = null;

    bus.subscribe<DomainEvent>('test.event', async (event) => {
      received = event;
    });

    const event: DomainEvent = {
      eventId: 'evt-test',
      eventType: 'test.event',
      occurredAt: new Date().toISOString(),
      aggregateType: 'Test',
      aggregateId: 't-1',
      payload: { foo: 'bar' },
    };

    bus.publish(event);

    expect(received).not.toBeNull();
    expect(received!.eventId).toBe('evt-test');
    expect(received!.payload.foo).toBe('bar');
  });

  test('несколько обработчиков на один eventType вызываются все', async () => {
    const bus = new MockEventBus();
    const calls: string[] = [];

    bus.subscribe<DomainEvent>('multi.event', async () => {
      calls.push('handler-1');
    });
    bus.subscribe<DomainEvent>('multi.event', async () => {
      calls.push('handler-2');
    });

    bus.publish({
      eventId: 'evt-multi',
      eventType: 'multi.event',
      occurredAt: new Date().toISOString(),
      aggregateType: 'Test',
      aggregateId: 't-1',
      payload: {},
    });

    expect(calls).toContain('handler-1');
    expect(calls).toContain('handler-2');
    expect(calls).toHaveLength(2);
  });

  test('отписка: обработчик не вызывается после unsubscribe', async () => {
    const bus = new MockEventBus();
    const calls: string[] = [];

    const unsubscribe = bus.subscribe<DomainEvent>('unsub.event', async () => {
      calls.push('called');
    });

    unsubscribe();

    bus.publish({
      eventId: 'evt-unsub',
      eventType: 'unsub.event',
      occurredAt: new Date().toISOString(),
      aggregateType: 'Test',
      aggregateId: 't-1',
      payload: {},
    });

    expect(calls).toHaveLength(0);
  });

  test('нет обработчиков — publish не падает', () => {
    const bus = new MockEventBus();

    expect(() =>
      bus.publish({
        eventId: 'evt-noop',
        eventType: 'noop.event',
        occurredAt: new Date().toISOString(),
        aggregateType: 'Test',
        aggregateId: 't-1',
        payload: {},
      }),
    ).not.toThrow();
  });

  test('порядок вызова обработчиков соответствует порядку подписки', async () => {
    const bus = new MockEventBus();
    const order: number[] = [];

    bus.subscribe<DomainEvent>('order.event', async () => {
      order.push(1);
    });
    bus.subscribe<DomainEvent>('order.event', async () => {
      order.push(2);
    });
    bus.subscribe<DomainEvent>('order.event', async () => {
      order.push(3);
    });

    bus.publish({
      eventId: 'evt-order',
      eventType: 'order.event',
      occurredAt: new Date().toISOString(),
      aggregateType: 'Test',
      aggregateId: 't-1',
      payload: {},
    });

    expect(order).toEqual([1, 2, 3]);
  });

  test('изоляция ошибок: исключение в одном обработчике не прерывает остальные', async () => {
    const bus = new MockEventBus();
    const calls: string[] = [];

    bus.subscribe<DomainEvent>('error.event', async () => {
      throw new Error('Ошибка в обработчике 1');
    });
    bus.subscribe<DomainEvent>('error.event', async () => {
      calls.push('handler-2-ok');
    });

    // Не должно выбросить исключение
    expect(() =>
      bus.publish({
        eventId: 'evt-error',
        eventType: 'error.event',
        occurredAt: new Date().toISOString(),
        aggregateType: 'Test',
        aggregateId: 't-1',
        payload: {},
      }),
    ).not.toThrow();

    expect(calls).toContain('handler-2-ok');
  });
});
