import { U7BotController } from '@u7-scl/bot/u7-bot-controller';
import type { CourseApiModuleMeta } from '../../../domain/module';
import { CourseCatalogStory } from '../stories/course-catalog.story';

/**
 * Контроллер модуля Course для Telegram-бота.
 * Тонкий реестр — делегирует все действия в U7BotUserStory.
 */
export class CourseController extends U7BotController<CourseApiModuleMeta> {
  readonly name = 'course';

  protected override readonly stories = [new CourseCatalogStory()];
}
