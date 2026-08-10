import type { DomainEvent } from '../domain/events/domain-event';
import type { EventBus } from '../domain/events/event-bus';

/**
 * Синхронная in-process реализация EventBus.
 *
 * - Хранит обработчики в Map<eventName, handler[]>
 * - publish вызывает обработчики последовательно (в порядке подписки)
 * - Исключения в обработчиках изолируются: логируются через console.error,
 *   остальные обработчики продолжают выполняться
 * - subscribe возвращает функцию отписки
 * - Потокобезопасность не требуется (однопоточный runtime)
 */
export class InProcEventBus implements EventBus {
  private readonly handlers = new Map<
    string,
    Array<(event: DomainEvent) => Promise<void>>
  >();

  publish<E extends DomainEvent>(event: E): void {
    const eventHandlers = this.handlers.get(event.eventName);
    if (!eventHandlers || eventHandlers.length === 0) {
      return;
    }

    for (const handler of eventHandlers) {
      try {
        const result = handler(event as DomainEvent);
        if (result instanceof Promise) {
          result.catch((err: unknown) => {
            console.error(
              `[EventBus] Ошибка в обработчике события "${event.eventName}" (агрегат "${event.aggregateName}"):`,
              err instanceof Error ? err.message : err,
            );
          });
        }
      } catch (err: unknown) {
        console.error(
          `[EventBus] Ошибка в обработчике события "${event.eventName}" (агрегат "${event.aggregateName}"):`,
          err instanceof Error ? err.message : err,
        );
      }
    }
  }

  subscribe<E extends DomainEvent>(
    eventName: string,
    handler: (event: E) => Promise<void>,
  ): () => void {
    const existing = this.handlers.get(eventName) ?? [];
    const typedHandler = handler as (event: DomainEvent) => Promise<void>;
    existing.push(typedHandler);
    this.handlers.set(eventName, existing);

    return () => {
      const updated = (this.handlers.get(eventName) ?? []).filter(
        (h) => h !== typedHandler,
      );
      if (updated.length === 0) {
        this.handlers.delete(eventName);
      } else {
        this.handlers.set(eventName, updated);
      }
    };
  }
}
