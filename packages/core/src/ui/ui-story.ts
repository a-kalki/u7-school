import type { UiEventSubscription } from './event-subscription';
import type { UiAppResolve } from './types';

/**
 * Базовая стори канально-независимого UI-слоя.
 *
 * Не знает ни про Telegram, ни про транспорт. Объявляет только подписки
 * на доменные события, на которые реагирует.
 *
 * @typeParam TResolve — зависимости приложения (расширяет UiAppResolve)
 */
export class UiStory<TResolve extends UiAppResolve = UiAppResolve> {
  /** Инициализация — вызывается контроллером при загрузке приложения. */
  init(_resolve: TResolve): void {}

  /** Подписки стори на доменные события (по умолчанию пусто). */
  getEventSubscriptions(): UiEventSubscription[] {
    return [];
  }
}
