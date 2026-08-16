import type { UiEventSubscription } from './event-subscription';
import type { UiAppResolve } from './types';
import type { UiStory } from './ui-story';

/**
 * Базовый контроллер канально-независимого UI-слоя.
 *
 * Владеет стори и агрегирует их подписки на доменные события.
 *
 * @typeParam TResolve — зависимости приложения (расширяет UiAppResolve)
 */
export abstract class UiController<
  TResolve extends UiAppResolve = UiAppResolve,
> {
  /** Уникальное имя контроллера */
  abstract readonly name: string;

  /** Зарегистрированные стори */
  protected readonly stories: UiStory<TResolve>[] = [];

  /** Инициализация — вызывается UiApp при загрузке приложения. */
  init(resolve: TResolve): void {
    for (const story of this.stories) {
      story.init(resolve);
    }
  }

  /** Подписки всех стори контроллера */
  getEventSubscriptions(): UiEventSubscription[] {
    return this.stories.flatMap((story) => story.getEventSubscriptions());
  }
}
