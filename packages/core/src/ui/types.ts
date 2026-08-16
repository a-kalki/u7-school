import type { EventBus } from '#domain/events/event-bus';

/**
 * Зависимости уровня UI-приложения (аналог AppResolver из API-слоя).
 * Передаются вниз по дереву через UiApp.init().
 * Конкретное приложение расширяет этот тип своими зависимостями.
 *
 * @typeParam TActor — тип актора (пользователя) приложения
 */
export interface UiAppResolve<TActor = unknown> {
  eventBus: EventBus;
  /** Резолвер актора по канальному идентификатору (например telegramId) */
  actorResolver: (tgId: number) => Promise<TActor>;
}
