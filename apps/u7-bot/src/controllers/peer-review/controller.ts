import { U7BotController } from '@u7-scl/bot/u7-bot-controller';
import { CampaignStory } from './stories/campaign.story';
import { InviteStory } from './stories/invite.story';
import { MyReviewsStory } from './stories/my-reviews.story';

/**
 * Контроллер peer-review — «Отзывы» (S01–S07).
 *
 * Тонкий реестр — делегирует все действия в U7BotUiStory.
 * Содержит стори: invite (S01 — проактивные приглашения),
 * my-reviews (S02 — хаб), campaign (S03–S06 — кампания отзывов).
 */
export class PeerReviewController extends U7BotController {
  readonly name = 'peer-review';

  protected override readonly stories = [
    new MyReviewsStory(),
    new CampaignStory(),
    new InviteStory(),
  ];
}
