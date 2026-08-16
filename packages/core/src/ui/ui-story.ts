import type { UiEventSubscription } from './event-subscription';

/**
 * Базовая стори канально-независимого UI-слоя.
 *
 * Не знает ни про Telegram, ни про транспорт. Объявляет только подписки
 * на доменные события, на которые реагирует.
 */
export class UiStory {
  /** Подписки стори на доменные события (по умолчанию пусто). */
  getEventSubscriptions(): UiEventSubscription[] {
    return [];
  }
}
