import { U7BotController } from '../../core/u7-bot-controller';
import { HubStory } from './stories/hub';
import { NavTreeStory } from './stories/nav-tree';
import { ProgressStory } from './stories/progress';
import { StepViewStory } from './stories/step-view';
import { TransitionStory } from './stories/transition';

/**
 * Контроллер learning — «Моя учёба» (S05, S06, S10).
 *
 * Доступен только роли STUDENT.
 * Содержит стори: hub, step-view, nav-tree, transition, progress, enroll.
 */
export class LearningController extends U7BotController {
  readonly name = 'learning';

  protected override readonly stories = [
    new HubStory(),
    new StepViewStory(),
    new NavTreeStory(),
    new TransitionStory(),
    new ProgressStory(),
  ];
}
