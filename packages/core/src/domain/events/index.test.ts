import { describe, expect, test } from 'bun:test';
import { InProcEventBus } from '../../infra/in-proc-event-bus';
import type { DomainEvent } from './domain-event';
import type { EventBus } from './event-bus';

// ═══════════════════════════════════════════════════════════════════
// Тесты интерфейсных контрактов DomainEvent и EventBus
// (используется реальный InProcEventBus — infra реализация)
// ═══════════════════════════════════════════════════════════════════

describe('core/domain/events — DomainEvent (контракт)', () => {
  test('объект, соответствующий DomainEvent, имеет обязательные поля', () => {
    const event: DomainEvent = {
      eventId: 'evt-001',
      eventName: 'completed',
      occurredAt: new Date().toISOString(),
      aggregateName: 'Questionnaire',
      aggregateId: 'q-123',
      payload: { respondentId: 42 },
    };

    expect(event.eventId).toBeString();
    expect(event.eventName).toBe('completed');
    expect(event.occurredAt).toBeString();
    expect(event.aggregateName).toBe('Questionnaire');
    expect(event.aggregateId).toBe('q-123');
    expect(event.payload).toBeObject();
    expect(event.payload.respondentId).toBe(42);
  });

  test('eventId уникален для каждого события', () => {
    const event1: DomainEvent = {
      eventId: 'evt-aaa',
      eventName: 'completed',
      occurredAt: new Date().toISOString(),
      aggregateName: 'Test',
      aggregateId: 't-1',
      payload: {},
    };

    const event2: DomainEvent = {
      eventId: 'evt-bbb',
      eventName: 'completed',
      occurredAt: new Date().toISOString(),
      aggregateName: 'Test',
      aggregateId: 't-1',
      payload: {},
    };

    expect(event1.eventId).not.toBe(event2.eventId);
  });
});

describe('core/domain/events — EventBus (контракт через InProcEventBus)', () => {
  test('подписка получает опубликованное событие', async () => {
    const bus = new InProcEventBus();
    let received: DomainEvent | null = null;

    bus.subscribe<DomainEvent>('completed', async (event) => {
      received = event;
    });

    const event: DomainEvent = {
      eventId: 'evt-test',
      eventName: 'completed',
      occurredAt: new Date().toISOString(),
      aggregateName: 'Test',
      aggregateId: 't-1',
      payload: { foo: 'bar' },
    };

    bus.publish(event);

    expect(received).not.toBeNull();
    expect(received!.eventId).toBe('evt-test');
    expect(received!.payload.foo).toBe('bar');
  });

  test('несколько обработчиков на один eventName вызываются все', async () => {
    const bus = new InProcEventBus();
    const calls: string[] = [];

    bus.subscribe<DomainEvent>('completed', async () => {
      calls.push('handler-1');
    });
    bus.subscribe<DomainEvent>('completed', async () => {
      calls.push('handler-2');
    });

    bus.publish({
      eventId: 'evt-multi',
      eventName: 'completed',
      occurredAt: new Date().toISOString(),
      aggregateName: 'Test',
      aggregateId: 't-1',
      payload: {},
    });

    expect(calls).toContain('handler-1');
    expect(calls).toContain('handler-2');
    expect(calls).toHaveLength(2);
  });

  test('отписка: обработчик не вызывается после unsubscribe', async () => {
    const bus = new InProcEventBus();
    const calls: string[] = [];

    const unsubscribe = bus.subscribe<DomainEvent>('completed', async () => {
      calls.push('called');
    });

    unsubscribe();

    bus.publish({
      eventId: 'evt-unsub',
      eventName: 'completed',
      occurredAt: new Date().toISOString(),
      aggregateName: 'Test',
      aggregateId: 't-1',
      payload: {},
    });

    expect(calls).toHaveLength(0);
  });

  test('нет обработчиков — publish не падает', () => {
    const bus = new InProcEventBus();

    expect(() =>
      bus.publish({
        eventId: 'evt-noop',
        eventName: 'completed',
        occurredAt: new Date().toISOString(),
        aggregateName: 'Test',
        aggregateId: 't-1',
        payload: {},
      }),
    ).not.toThrow();
  });

  test('порядок вызова обработчиков соответствует порядку подписки', async () => {
    const bus = new InProcEventBus();
    const order: number[] = [];

    bus.subscribe<DomainEvent>('completed', async () => {
      order.push(1);
    });
    bus.subscribe<DomainEvent>('completed', async () => {
      order.push(2);
    });
    bus.subscribe<DomainEvent>('completed', async () => {
      order.push(3);
    });

    bus.publish({
      eventId: 'evt-order',
      eventName: 'completed',
      occurredAt: new Date().toISOString(),
      aggregateName: 'Test',
      aggregateId: 't-1',
      payload: {},
    });

    expect(order).toEqual([1, 2, 3]);
  });

  test('изоляция ошибок: исключение в одном обработчике не прерывает остальные', async () => {
    const bus = new InProcEventBus();
    const calls: string[] = [];

    bus.subscribe<DomainEvent>('completed', async () => {
      throw new Error('Ошибка в обработчике 1');
    });
    bus.subscribe<DomainEvent>('completed', async () => {
      calls.push('handler-2-ok');
    });

    // Не должно выбросить исключение
    expect(() =>
      bus.publish({
        eventId: 'evt-error',
        eventName: 'completed',
        occurredAt: new Date().toISOString(),
        aggregateName: 'Test',
        aggregateId: 't-1',
        payload: {},
      }),
    ).not.toThrow();

    expect(calls).toContain('handler-2-ok');
  });
});
