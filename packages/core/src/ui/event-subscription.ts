import type { DomainEvent } from '#domain/events/domain-event';

/**
 * Подписка UI на доменное событие.
 *
 * Объявляется стори, агрегируется контроллером и UiApp, а затем физически
 * подписывается на шину событий общим UiApp.
 *
 * @typeParam TEvent — тип доменного события
 */
export interface UiEventSubscription<TEvent extends DomainEvent = DomainEvent> {
  /** Имя события (например "questionnaire:start") */
  readonly eventName: TEvent['eventName'];
  /** Обработчик события */
  handle(event: TEvent): Promise<void>;
}

/**
 * Фабрика типизированной подписки.
 * Обёртка без логики — объединяет имя события и обработчик в один объект.
 */
export function eventSubscription<TEvent extends DomainEvent>(
  eventName: TEvent['eventName'],
  handle: (event: TEvent) => Promise<void>,
): UiEventSubscription<TEvent> {
  return { eventName, handle };
}
