import { U7BotController } from '@u7-scl/bot/u7-bot-controller';
import { CourseCatalogStory } from './stories/course-catalog.story';
import { WishConfirmedStory } from './stories/wish-confirmed.story';
import { WishInviteStory } from './stories/wish-invite.story';

/**
 * Контроллер «Программы курсов» для Telegram-бота.
 *
 * Тонкий реестр — все действия в CourseCatalogStory (каталог, желания),
 * WishInviteStory (S11 — проактивное приглашение при открытии набора)
 * и WishConfirmedStory (уведомление менторам о подтверждённом желании).
 * Префикс callback'ов: `course:course-catalog:*`, `course:wish-invite:*`
 */
export class CoursesController extends U7BotController {
  readonly name = 'course';

  protected override readonly stories = [
    new CourseCatalogStory(),
    new WishInviteStory(),
    new WishConfirmedStory(),
  ];
}
