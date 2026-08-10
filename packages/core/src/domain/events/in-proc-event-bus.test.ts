import { describe, expect, test } from 'bun:test';
import type { DomainEvent } from './domain-event';
import { InProcEventBus } from './in-proc-event-bus';

// ═══════════════════════════════════════════════════════════════════
// Фаза 2: Тесты InProcEventBus
// ═══════════════════════════════════════════════════════════════════

function makeEvent(overrides: Partial<DomainEvent> = {}): DomainEvent {
  return {
    eventId: `evt-${Math.random().toString(36).slice(2, 8)}`,
    eventType: 'test.event',
    occurredAt: new Date().toISOString(),
    aggregateType: 'Test',
    aggregateId: 't-1',
    payload: {},
    ...overrides,
  };
}

describe('core/domain/events — InProcEventBus', () => {
  test('подписка получает опубликованное событие', async () => {
    const bus = new InProcEventBus();
    let received: DomainEvent | null = null;

    bus.subscribe<DomainEvent>('test.event', async (event) => {
      received = event;
    });

    const event = makeEvent({ payload: { foo: 'bar' } });
    bus.publish(event);

    expect(received).not.toBeNull();
    expect(received!.eventId).toBe(event.eventId);
    expect(received!.payload.foo).toBe('bar');
  });

  test('несколько обработчиков на один eventType вызываются все', async () => {
    const bus = new InProcEventBus();
    const calls: string[] = [];

    bus.subscribe<DomainEvent>('multi.event', async () => {
      calls.push('handler-1');
    });
    bus.subscribe<DomainEvent>('multi.event', async () => {
      calls.push('handler-2');
    });

    bus.publish(makeEvent({ eventType: 'multi.event' }));

    expect(calls).toContain('handler-1');
    expect(calls).toContain('handler-2');
    expect(calls).toHaveLength(2);
  });

  test('отписка: обработчик не вызывается после unsubscribe', async () => {
    const bus = new InProcEventBus();
    const calls: string[] = [];

    const unsubscribe = bus.subscribe<DomainEvent>('unsub.event', async () => {
      calls.push('called');
    });

    unsubscribe();

    bus.publish(makeEvent({ eventType: 'unsub.event' }));

    expect(calls).toHaveLength(0);
  });

  test('изоляция ошибок: синхронное исключение не прерывает остальные обработчики', () => {
    const bus = new InProcEventBus();
    const calls: string[] = [];

    bus.subscribe<DomainEvent>('error.event', async () => {
      calls.push('handler-1-start');
      throw new Error('Бах!');
    });
    bus.subscribe<DomainEvent>('error.event', async () => {
      calls.push('handler-2-ok');
    });

    // publish не должен выбросить исключение
    expect(() =>
      bus.publish(makeEvent({ eventType: 'error.event' })),
    ).not.toThrow();

    // Оба обработчика должны быть вызваны
    expect(calls).toContain('handler-1-start');
    expect(calls).toContain('handler-2-ok');
  });

  test('изоляция ошибок: rejected Promise не роняет шину', async () => {
    const bus = new InProcEventBus();
    const calls: string[] = [];

    bus.subscribe<DomainEvent>('async-error.event', async () => {
      calls.push('async-1-start');
      // Возвращаем Promise, который реджектится
      return Promise.reject(new Error('Асинхронная ошибка'));
    });
    bus.subscribe<DomainEvent>('async-error.event', async () => {
      calls.push('async-2-ok');
    });

    // publish не должен выбросить исключение
    expect(() =>
      bus.publish(makeEvent({ eventType: 'async-error.event' })),
    ).not.toThrow();

    // Даём микротаскам выполниться
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Оба обработчика должны быть вызваны
    expect(calls).toContain('async-1-start');
    expect(calls).toContain('async-2-ok');
  });

  test('нет обработчиков — publish не падает', () => {
    const bus = new InProcEventBus();

    expect(() =>
      bus.publish(makeEvent({ eventType: 'noop.event' })),
    ).not.toThrow();
  });

  test('порядок вызова обработчиков соответствует порядку подписки', async () => {
    const bus = new InProcEventBus();
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

    bus.publish(makeEvent({ eventType: 'order.event' }));

    expect(order).toEqual([1, 2, 3]);
  });

  test('обработчики разных eventType изолированы друг от друга', async () => {
    const bus = new InProcEventBus();
    const callsA: string[] = [];
    const callsB: string[] = [];

    bus.subscribe<DomainEvent>('event.a', async () => {
      callsA.push('a');
    });
    bus.subscribe<DomainEvent>('event.b', async () => {
      callsB.push('b');
    });

    bus.publish(makeEvent({ eventType: 'event.a' }));

    expect(callsA).toHaveLength(1);
    expect(callsB).toHaveLength(0);
  });

  test('отписка одного обработчика не затрагивает другие на тот же eventType', async () => {
    const bus = new InProcEventBus();
    const calls: string[] = [];

    const unsub1 = bus.subscribe<DomainEvent>('shared.event', async () => {
      calls.push('handler-1');
    });
    bus.subscribe<DomainEvent>('shared.event', async () => {
      calls.push('handler-2');
    });

    unsub1();

    bus.publish(makeEvent({ eventType: 'shared.event' }));

    expect(calls).not.toContain('handler-1');
    expect(calls).toContain('handler-2');
    expect(calls).toHaveLength(1);
  });
});
