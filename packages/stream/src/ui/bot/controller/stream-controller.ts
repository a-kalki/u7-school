import type { User } from '@u7-scl/app/domain';
import { U7BotController } from '@u7-scl/app/ui';
import type { StreamApiModuleMeta } from '../../../domain/module';
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
 * Тонкий реестр — делегирует все действия в U7BotUserStory.
 */
export class StreamController extends U7BotController<StreamApiModuleMeta> {
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
