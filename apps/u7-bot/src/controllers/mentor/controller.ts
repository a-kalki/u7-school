import { U7BotController } from '@u7-scl/bot/u7-bot-controller';
import { MyStreamsStory } from './stories/my-streams';
import { SubmenuStory } from './stories/submenu';
import { ViewStreamMentorStory } from './stories/view-stream-mentor';

/**
 * Контроллер mentor — «Инструменты ментора» (S02m, S07-S09).
 *
 * Тонкий реестр — делегирует все действия в U7BotUserStory.
 * Видимость: только роли MENTOR и ADMIN.
 */
export class MentorController extends U7BotController {
  readonly name = 'mentor';

  protected override readonly stories = [
    new SubmenuStory(),
    new MyStreamsStory(),
    new ViewStreamMentorStory(),
  ];
}
