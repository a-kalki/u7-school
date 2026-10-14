import { U7BotController } from '@u7-scl/bot/u7-bot-controller';
import { CommunityStory } from './stories/community.story';
import { SchoolHubStory } from './stories/school-hub.story';
import { SchoolInfoStory } from './stories/school-info.story';
import { SchoolReviewsStory } from './stories/school-reviews.story';

/**
 * Контроллер school — хаб «🏫 Школа».
 *
 * Тонкий реестр — делегирует действия в свои стори:
 * - SchoolHubStory (визитная карточка SH01)
 * - SchoolInfoStory (экран «Инфо» SH02)
 * - SchoolReviewsStory (экран «Отзывы» SH03)
 * - CommunityStory (сообщество школы)
 */
export class SchoolController extends U7BotController {
  readonly name = 'school';

  protected override readonly stories = [
    new SchoolHubStory(),
    new SchoolInfoStory(),
    new SchoolReviewsStory(),
    new CommunityStory(),
  ];
}
