import type { DomainEvent } from './domain-event';

/**
 * Шина доменных событий.
 * Позволяет публиковать события и подписываться на них.
 * Реализация — синхронная InProc, с изоляцией ошибок обработчиков.
 */
export interface EventBus {
  /** Опубликовать событие — синхронно вызывает все подписанные обработчики */
  publish<E extends DomainEvent>(event: E): void;

  /**
   * Подписаться на события указанного типа.
   * @returns функция отписки (unsubscribe)
   */
  subscribe<E extends DomainEvent>(
    eventType: string,
    handler: (event: E) => Promise<void>,
  ): () => void;
}
