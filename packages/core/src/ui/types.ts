import type { EventBus } from '#domain/events/event-bus';

/**
 * Разрешает зависимости уровня UI-приложения.
 */
export interface UiAppResolve {
  eventBus: EventBus;
}
