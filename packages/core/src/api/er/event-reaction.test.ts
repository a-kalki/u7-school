import { describe, expect, test } from 'bun:test';
import type { DomainEvent } from '#domain/events/domain-event';
import type { ModuleResolver } from '#domain/types';
import type { ErMeta } from './event-reaction';
import { EventReaction } from './event-reaction';

// ══ Тестовые типы ══

interface TestEvent extends DomainEvent {
  eventName: 'test.event';
  payload: { foo: string };
}

interface TestErMeta extends ErMeta<TestEvent> {
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
  protected readonly eventName = 'test.event' as const;

  handled: TestEvent[] = [];

  async handle(event: TestEvent): Promise<void> {
    this.handled.push(event);
  }
}

// ══ Тесты ══

describe('EventReaction', () => {
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

  test('getEventName возвращает имя события', () => {
    const er = new TestEr();
    er.init(makeResolve());

    expect(er.getEventName()).toBe('test.event');
  });

  test('handle вызывается с событием', async () => {
    const er = new TestEr();
    er.init(makeResolve());

    const event: TestEvent = {
      eventId: 'evt-1',
      eventName: 'test.event',
      occurredAt: '2026-08-14T00:00:00.000Z',
      aggregateName: 'Test',
      aggregateId: 'agg-1',
      payload: { foo: 'bar' },
    };

    await er.handle(event);

    expect(er.handled).toHaveLength(1);
    expect(er.handled[0]?.eventId).toBe('evt-1');
  });

  test('getDocType возвращает метаданные реакции', () => {
    const er = new TestEr();
    er.init(makeResolve());

    const doc = er.getDocType();

    expect(doc).toEqual({
      erName: 'record-test',
      erLabel: 'Записать тест',
      eventName: 'test.event',
    });
  });
});
