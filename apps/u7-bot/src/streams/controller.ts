import { U7BotController } from '@u7-scl/bot/u7-bot-controller';
import { ActivateStreamStory } from '@u7-scl/stream/ui/bot/stories/activate-stream.story';
import { CreateStreamStory } from '@u7-scl/stream/ui/bot/stories/create-stream.story';
import { EnrollStory } from '@u7-scl/stream/ui/bot/stories/enroll.story';
import { LearningStory } from '@u7-scl/stream/ui/bot/stories/learning.story';
import { MentorToolsStory } from '@u7-scl/stream/ui/bot/stories/mentor-tools.story';
import { MonitorStory } from '@u7-scl/stream/ui/bot/stories/monitor.story';
import { ProgressStory } from '@u7-scl/stream/ui/bot/stories/progress.story';
import { ViewStreamMentorStory } from '@u7-scl/stream/ui/bot/stories/view-stream-mentor.story';
import { CatalogStory } from './stories/stream-catalog.story';
import { ViewStreamStory } from './stories/view-stream.story';

/**
 * Контроллер streams — «Потоки курсов».
 *
 * Тонкий реестр — делегирует все действия в U7BotUserStory.
 * Содержит мигрированные стори (catalog, view-stream) и старые импорты из packages/stream.
 */
export class StreamsController extends U7BotController {
  readonly name = 'stream';

  protected override readonly stories = [
    // Мигрированные стори (новые версии в apps/u7-bot)
    new CatalogStory(),
    new ViewStreamStory(),
    // Немигрированные стори (старые версии из packages/stream)
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
