import type { DomainEvent } from '#domain/events/domain-event';

/**
 * Подписка UI на доменное событие.
 */
export interface UiEventSubscription<TEvent extends DomainEvent = DomainEvent> {
  readonly eventName: TEvent['eventName'];
  handle(event: TEvent): Promise<void>;
}

/**
 * Фабрика типизированной подписки.
 */
export function eventSubscription<TEvent extends DomainEvent>(
  eventName: TEvent['eventName'],
  handle: (event: TEvent) => Promise<void>,
): UiEventSubscription<TEvent> {
  return { eventName, handle };
}
