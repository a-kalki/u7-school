import type { DomainEvent } from './domain-event';
import type { EventBus } from './event-bus';

/**
 * Синхронная in-process реализация EventBus.
 *
 * - Хранит обработчики в Map<eventType, handler[]>
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
    const eventHandlers = this.handlers.get(event.eventType);
    if (!eventHandlers || eventHandlers.length === 0) {
      return;
    }

    for (const handler of eventHandlers) {
      try {
        // Вызываем синхронно — обработчики не должны блокировать надолго.
        // Promise, возвращаемый handler, игнорируется осознанно —
        // исключения внутри async-функций приводят к rejected promise,
        // а не к синхронному throw. Для перехвата таких ошибок
        // обработчики должны использовать try/catch внутри себя.
        const result = handler(event as DomainEvent);
        // Если handler синхронно вернул Promise — цепляем catch
        if (result instanceof Promise) {
          result.catch((err: unknown) => {
            console.error(
              `[EventBus] Ошибка в обработчике события "${event.eventType}":`,
              err instanceof Error ? err.message : err,
            );
          });
        }
      } catch (err: unknown) {
        console.error(
          `[EventBus] Ошибка в обработчике события "${event.eventType}":`,
          err instanceof Error ? err.message : err,
        );
        // Продолжаем цепочку — не прерываем остальные обработчики
      }
    }
  }

  subscribe<E extends DomainEvent>(
    eventType: string,
    handler: (event: E) => Promise<void>,
  ): () => void {
    const existing = this.handlers.get(eventType) ?? [];
    const typedHandler = handler as (event: DomainEvent) => Promise<void>;
    existing.push(typedHandler);
    this.handlers.set(eventType, existing);

    return () => {
      const updated = (this.handlers.get(eventType) ?? []).filter(
        (h) => h !== typedHandler,
      );
      if (updated.length === 0) {
        this.handlers.delete(eventType);
      } else {
        this.handlers.set(eventType, updated);
      }
    };
  }
}
