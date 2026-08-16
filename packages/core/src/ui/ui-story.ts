import type { UiEventSubscription } from './event-subscription';
import type { UiAppResolve } from './types';

/**
 * Базовая стори UI-слоя.
 */
export class UiStory<TResolve extends UiAppResolve = UiAppResolve> {
  protected resolver!: TResolve;

  init(resolver: TResolve): void {
    this.resolver = resolver;
  }

  /** Подписки стори на доменные события */
  getEventSubscriptions(): UiEventSubscription[] {
    return [];
  }
}
