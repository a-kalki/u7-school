import { U7BotController } from '@u7-scl/bot/u7-bot-controller';
import { ActivateStreamStory } from '../stories/activate-stream.story';
import { CatalogStory } from '../stories/catalog.story';
import { CreateStreamStory } from '../stories/create-stream.story';
import { EnrollStory } from '../stories/enroll.story';
import { LearningStory } from '../stories/learning.story';
import { MentorToolsStory } from '../stories/mentor-tools.story';
import { MonitorStory } from '../stories/monitor.story';
import { ProgressStory } from '../stories/progress.story';
import { ViewStreamStory } from '../stories/view-stream.story';
import { ViewStreamMentorStory } from '../stories/view-stream-mentor.story';

/**
 * Контроллер модуля Stream для Telegram-бота.
 * Тонкий реестр — делегирует все действия в U7BotUserStory.
 */
export class StreamController extends U7BotController {
  readonly name = 'stream';

  protected override readonly stories = [
    new CatalogStory(),
    new ViewStreamStory(),
    new EnrollStory(),
    new LearningStory(),
    new ProgressStory(),
    new MentorToolsStory(),
    new CreateStreamStory(),
    new ActivateStreamStory(),
    new MonitorStory(),
    new ViewStreamMentorStory(),
  ];
}
