import { describe, expect, test } from 'bun:test';
import type { DomainEvent } from '#domain/events/domain-event';
import type { ModuleResolver } from '#domain/types';
import type { ErMeta } from './event-reaction';
import { EventReaction } from './event-reaction';

// ══ Тестовые типы ══

interface TestEventA extends DomainEvent {
  eventName: 'test.a';
  payload: { kind: 'a'; foo: string };
}

interface TestEventB extends DomainEvent {
  eventName: 'test.b';
  payload: { kind: 'b'; bar: number };
}

/**
 * Мета по точному юниону событий: без деградации до DomainEvent.
 * TMeta['event'] = TestEventA | TestEventB,
 * TMeta['event']['eventName'] = 'test.a' | 'test.b'.
 */
interface TestErMeta extends ErMeta<TestEventA | TestEventB> {
  erName: 'record-test';
}

interface TestResolve extends ModuleResolver {
  value: string;
}

// ══ Тестовый резолвер ══

function makeResolve(): TestResolve {
  const eventBus = {
    publish: () => {},
    subscribe: () => () => {},
  };
  return {
    value: 'resolved',
    eventBus,
    appResolver: {
      eventBus,
      logger: {},
      mode: 'test',
    } as unknown as TestResolve['appResolver'],
  };
}

// ══ Тестовый EventReaction ══

class TestEr extends EventReaction<TestErMeta, TestResolve> {
  protected readonly erName = 'record-test' as const;
  protected readonly erLabel = 'Записать тест';
  protected readonly eventNames = ['test.a', 'test.b'] as const;

  handled: Array<TestEventA | TestEventB> = [];
  /** Имена веток, прошедших сужение (для проверки exhaustive-контроля). */
  narrowed: string[] = [];

  async handle(event: TestEventA | TestEventB): Promise<void> {
    this.handled.push(event);
    // Разбор юниона — сужение по дискриминанту eventName
    // с exhaustive-веткой (never-контроль).
    switch (event.eventName) {
      case 'test.a': {
        this.narrowed.push(`a:${event.payload.foo}`);
        break;
      }
      case 'test.b': {
        this.narrowed.push(`b:${event.payload.bar}`);
        break;
      }
      default: {
        // exhaustive-контроль: непокрытая ветка ломает компиляцию
        const exhaustive: never = event;
        this.narrowed.push(
          `unknown:${String((exhaustive as { eventName: string }).eventName)}`,
        );
      }
    }
  }
}

// ══ Тесты ══

describe('EventReaction (мультисобытийная подписка)', () => {
  test('init сохраняет резолвер и делает его доступным', () => {
    const er = new TestEr();
    const resolve = makeResolve();

    er.init(resolve);

    expect(er.getErName()).toBe('record-test');
  });

  test('getErName возвращает имя реакции', () => {
    const er = new TestEr();
    er.init(makeResolve());

    expect(er.getErName()).toBe('record-test');
  });

  test('getEventNames возвращает все имена подписки', () => {
    const er = new TestEr();
    er.init(makeResolve());

    expect(er.getEventNames()).toEqual(['test.a', 'test.b']);
  });

  test('handle вызывается с событием первого типа юниона', async () => {
    const er = new TestEr();
    er.init(makeResolve());

    const event: TestEventA = {
      eventId: 'evt-1',
      eventName: 'test.a',
      occurredAt: '2026-08-14T00:00:00.000Z',
      aggregateName: 'Test',
      aggregateId: 'agg-1',
      payload: { kind: 'a', foo: 'bar' },
    };

    await er.handle(event);

    expect(er.handled).toHaveLength(1);
    expect(er.handled[0]?.eventId).toBe('evt-1');
    // сужение по дискриминанту: доступ к полям payload ветки A
    expect(er.narrowed).toEqual(['a:bar']);
  });

  test('handle вызывается с событием второго типа юниона', async () => {
    const er = new TestEr();
    er.init(makeResolve());

    const event: TestEventB = {
      eventId: 'evt-2',
      eventName: 'test.b',
      occurredAt: '2026-08-14T00:00:00.000Z',
      aggregateName: 'Test',
      aggregateId: 'agg-2',
      payload: { kind: 'b', bar: 42 },
    };

    await er.handle(event);

    expect(er.handled).toHaveLength(1);
    expect(er.handled[0]?.eventId).toBe('evt-2');
    // сужение по дискриминанту: доступ к полям payload ветки B
    expect(er.narrowed).toEqual(['b:42']);
  });

  test('getDocType возвращает метаданные со списком eventNames', () => {
    const er = new TestEr();
    er.init(makeResolve());

    const doc = er.getDocType();

    expect(doc).toEqual({
      erName: 'record-test',
      erLabel: 'Записать тест',
      eventNames: ['test.a', 'test.b'],
    });
  });
});
