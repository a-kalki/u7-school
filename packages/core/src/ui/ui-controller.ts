import type { UiEventSubscription } from './event-subscription';
import type { UiAppResolve } from './types';
import type { UiStory } from './ui-story';

/**
 * Базовый контроллер UI-слоя.
 */
export abstract class UiController<
  TResolve extends UiAppResolve = UiAppResolve,
> {
  abstract readonly name: string;

  protected readonly stories: UiStory<TResolve>[] = [];

  init(resolve: TResolve): void {
    for (const story of this.stories) {
      story.init(resolve);
    }
  }

  getEventSubscriptions(): UiEventSubscription[] {
    return this.stories.flatMap((story) => story.getEventSubscriptions());
  }
}
