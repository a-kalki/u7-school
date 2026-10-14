import { U7BotController } from '@u7-scl/bot/u7-bot-controller';
import { SchoolHubStory } from './stories/school-hub.story';

/**
 * Контроллер school — хаб «🏫 Школа».
 *
 * Тонкий реестр — делегирует действия в свои стори:
 * - SchoolHubStory (визитная карточка SH01)
 */
export class SchoolController extends U7BotController {
  readonly name = 'school';

  protected override readonly stories = [new SchoolHubStory()];
}
