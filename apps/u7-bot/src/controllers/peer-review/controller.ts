import { U7BotController } from '@u7-scl/bot/u7-bot-controller';
import { CampaignStory } from './stories/campaign.story';
import { InviteStory } from './stories/invite.story';
import { MyReviewsStory } from './stories/my-reviews.story';
import { ReviewsForMeStory } from './stories/reviews-for-me.story';
import { ScopeReviewsStory } from './stories/scope-reviews.story';

/**
 * Контроллер peer-review — «Отзывы» (S01–S08).
 *
 * Тонкий реестр — делегирует все действия в U7BotUiStory.
 * Содержит стори: invite (S01 — проактивные приглашения),
 * my-reviews (S02 — хаб), campaign (S03–S06 — кампания отзывов),
 * scope-reviews (S07 — постраничный просмотр отзывов потока),
 * reviews-for-me (S08 — все отзывы, адресованные пользователю).
 */
export class PeerReviewController extends U7BotController {
  readonly name = 'peer-review';

  protected override readonly stories = (() => {
    // Хаб передаётся в стори кампании: возврат после сохранения
    // при единственном адресате (S03 у такой кампании не показывается)
    const hub = new MyReviewsStory();
    return [
      hub,
      new CampaignStory(hub),
      new InviteStory(),
      new ScopeReviewsStory(),
      new ReviewsForMeStory(),
    ];
  })();
}
