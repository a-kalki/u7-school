import { describe, expect, test } from 'bun:test';
import type { DomainEvent } from '#domain/events/domain-event';
import type { UiEventSubscription } from './event-subscription';
import { eventSubscription } from './event-subscription';
import { UiController } from './ui-controller';
import { UiStory } from './ui-story';

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

describe('UiController', () => {
  test('getEventSubscriptions агрегирует подписки всех стори', () => {
    const sub1 = eventSubscription<DomainEvent>('event-1', async () => {});
    const sub2 = eventSubscription<DomainEvent>('event-2', async () => {});
    const sub3 = eventSubscription<DomainEvent>('event-3', async () => {});

    const storyA = new TestStory([sub1]);
    const storyB = new TestStory([sub2, sub3]);
    const ctrl = new TestController('ctrl', [storyA, storyB]);

    const subs = ctrl.getEventSubscriptions();

    expect(subs).toHaveLength(3);
    expect(subs.map((s) => s.eventName)).toEqual([
      'event-1',
      'event-2',
      'event-3',
    ]);
  });

  test('без стори — пустой список', () => {
    const ctrl = new TestController('ctrl');
    expect(ctrl.getEventSubscriptions()).toEqual([]);
  });
});

describe('UiStory', () => {
  test('getEventSubscriptions по умолчанию возвращает []', () => {
    expect(new UiStory().getEventSubscriptions()).toEqual([]);
  });
});
