import { describe, expect, test } from 'bun:test';
import type { DomainEvent } from '#domain/events/domain-event';
import type { EventBus } from '#domain/events/event-bus';
import type { UiEventSubscription } from './event-subscription';
import { eventSubscription } from './event-subscription';
import { UiApp } from './ui-app';
import { UiController } from './ui-controller';
import { UiStory } from './ui-story';

// ── Тестовое событие с конкретным именем ──

interface TestEvent extends DomainEvent {
  eventName: 'test-event';
  payload: { value: string };
}

// ── Фейковая шина событий ──

class FakeEventBus implements EventBus {
  readonly handlers = new Map<
    string,
    Array<(event: DomainEvent) => Promise<void>>
  >();

  publish<E extends DomainEvent>(event: E): void {
    for (const handler of this.handlers.get(event.eventName) ?? []) {
      void handler(event);
    }
  }

  subscribe<E extends DomainEvent>(
    eventName: string,
    handler: (event: E) => Promise<void>,
  ): () => void {
    const typed = handler as (event: DomainEvent) => Promise<void>;
    const list = this.handlers.get(eventName) ?? [];
    list.push(typed);
    this.handlers.set(eventName, list);
    return () => {
      const updated = (this.handlers.get(eventName) ?? []).filter(
        (h) => h !== typed,
      );
      if (updated.length === 0) this.handlers.delete(eventName);
      else this.handlers.set(eventName, updated);
    };
  }
}

// ── Тестовые стори/контроллер ──

class TestStory extends UiStory {
  constructor(private readonly subs: UiEventSubscription[] = []) {
    super();
  }

  override getEventSubscriptions(): UiEventSubscription[] {
    return this.subs;
  }
}

class TestController extends UiController {
  readonly name: string;

  constructor(name: string, stories: UiStory[] = []) {
    super();
    this.name = name;
    for (const story of stories) this.stories.push(story);
  }
}

function makeEvent(): TestEvent {
  return {
    eventId: 'e1',
    eventName: 'test-event',
    occurredAt: '2026-01-01T00:00:00.000Z',
    aggregateName: 'Test',
    aggregateId: 'a1',
    payload: { value: 'hello' },
  };
}

function makeResolve(bus: EventBus) {
  return {
    eventBus: bus,
    actorResolver: async () => ({ id: 'a1' }),
  };
}

describe('UiApp (общий слой)', () => {
  test('subscribeEvents регистрирует подписку с правильным eventName', () => {
    const bus = new FakeEventBus();
    const story = new TestStory([
      eventSubscription<TestEvent>('test-event', async () => {}),
    ]);
    const app = new UiApp([new TestController('ctrl', [story])]);

    app.init(makeResolve(bus));
    app.subscribeEvents();

    expect(bus.handlers.has('test-event')).toBe(true);
    expect(bus.handlers.get('test-event')).toHaveLength(1);
  });

  test('publish события вызывает handle', () => {
    const bus = new FakeEventBus();
    const received: TestEvent[] = [];
    const story = new TestStory([
      eventSubscription<TestEvent>('test-event', async (event) => {
        received.push(event);
      }),
    ]);
    const app = new UiApp([new TestController('ctrl', [story])]);
    app.init(makeResolve(bus));
    app.subscribeEvents();

    const event = makeEvent();
    bus.publish(event);

    expect(received).toHaveLength(1);
    expect(received[0]!.eventName).toBe('test-event');
    expect(received[0]!.payload.value).toBe('hello');
  });

  test('unsubscribeAll отписывает: повторный publish не вызывает handle', () => {
    const bus = new FakeEventBus();
    const received: TestEvent[] = [];
    const story = new TestStory([
      eventSubscription<TestEvent>('test-event', async (event) => {
        received.push(event);
      }),
    ]);
    const app = new UiApp([new TestController('ctrl', [story])]);
    app.init(makeResolve(bus));
    app.subscribeEvents();

    app.unsubscribeAll();
    bus.publish(makeEvent());

    expect(received).toHaveLength(0);
  });

  test('повторный subscribeEvents не дублирует обработчики', () => {
    const bus = new FakeEventBus();
    const received: TestEvent[] = [];
    const story = new TestStory([
      eventSubscription<TestEvent>('test-event', async (event) => {
        received.push(event);
      }),
    ]);
    const app = new UiApp([new TestController('ctrl', [story])]);
    app.init(makeResolve(bus));

    app.subscribeEvents();
    app.subscribeEvents();
    bus.publish(makeEvent());

    expect(received).toHaveLength(1);
  });

  test('две стори на один eventName — обе подписки вызываются', () => {
    const bus = new FakeEventBus();
    const received: string[] = [];
    const storyA = new TestStory([
      eventSubscription<TestEvent>('test-event', async () => {
        received.push('story-a');
      }),
    ]);
    const storyB = new TestStory([
      eventSubscription<TestEvent>('test-event', async () => {
        received.push('story-b');
      }),
    ]);
    const app = new UiApp([
      new TestController('ctrl-a', [storyA]),
      new TestController('ctrl-b', [storyB]),
    ]);
    app.init(makeResolve(bus));
    app.subscribeEvents();

    bus.publish(makeEvent());

    expect(received).toContain('story-a');
    expect(received).toContain('story-b');
    expect(received).toHaveLength(2);
  });

  test('subscribeEvents до init — ошибка', () => {
    const app = new UiApp([]);
    expect(() => app.subscribeEvents()).toThrow('UiApp не инициализирован');
  });
});
