import { BotController } from '@u7-scl/core/ui';
import type { StreamAppMeta } from '../../../domain/module';
import { ActivateStreamStory } from '../stories/activate-stream.story';
import { CatalogStory } from '../stories/catalog.story';
import { CreateStreamStory } from '../stories/create-stream.story';
import { EnrollStory } from '../stories/enroll.story';
import { LearningStory } from '../stories/learning.story';
import { MonitorStory } from '../stories/monitor.story';
import { ProgressStory } from '../stories/progress.story';
import { ViewStreamStory } from '../stories/view-stream.story';

/**
 * Контроллер модуля Stream для Telegram-бота.
 * Тонкий реестр — делегирует все действия в BotUserStory.
 */
export class StreamController extends BotController<StreamAppMeta> {
  readonly name = 'stream';

  protected override readonly stories = [
    new CatalogStory(),
    new ViewStreamStory(),
    new EnrollStory(),
    new LearningStory(),
    new ProgressStory(),
    new CreateStreamStory(),
    new ActivateStreamStory(),
    new MonitorStory(),
  ];
}
