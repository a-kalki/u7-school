import { U7BotController } from '@u7-scl/bot/u7-bot-controller';
import { CourseCatalogStory } from './stories/course-catalog.story';

/**
 * Контроллер «Программы курсов» для Telegram-бота.
 *
 * Тонкий реестр — все действия в CourseCatalogStory.
 * Префикс callback'ов: `course:course-catalog:*`
 */
export class CoursesController extends U7BotController {
  readonly name = 'course';

  protected override readonly stories = [new CourseCatalogStory()];
}
