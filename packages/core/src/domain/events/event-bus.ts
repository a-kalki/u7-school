import type { DomainEvent } from './domain-event';

/**
 * Шина доменных событий.
 * Позволяет публиковать события и подписываться на них по имени события.
 * Реализация — синхронная InProc, с изоляцией ошибок обработчиков.
 */
export interface EventBus {
  /** Опубликовать событие — синхронно вызывает все подписанные обработчики */
  publish<E extends DomainEvent>(event: E): void;

  /**
   * Подписаться на события с указанным именем.
   * @param eventName — имя события (например "completed", "started")
   * @returns функция отписки (unsubscribe)
   */
  subscribe<E extends DomainEvent>(
    eventName: string,
    handler: (event: E) => Promise<void>,
  ): () => void;
}
