import type { UiEventSubscription } from './event-subscription';
import type { UiStory } from './ui-story';

/**
 * Базовый контроллер канально-независимого UI-слоя.
 *
 * Владеет стори и агрегирует их подписки на доменные события.
 *
 * @typeParam TStory — тип стори (по умолчанию UiStory)
 */
export abstract class UiController<TStory extends UiStory = UiStory> {
  /** Уникальное имя контроллера */
  abstract readonly name: string;

  /** Зарегистрированные стори */
  protected readonly stories: TStory[] = [];

  /** Подписки всех стори контроллера */
  getEventSubscriptions(): UiEventSubscription[] {
    return this.stories.flatMap((story) => story.getEventSubscriptions());
  }
}
