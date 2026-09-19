import { U7BotController } from '@u7-scl/bot/u7-bot-controller';
import { CampaignStory } from './stories/campaign.story';

/**
 * Контроллер peer-review — «Отзывы» (S01–S07).
 *
 * Тонкий реестр — делегирует все действия в U7BotUiStory.
 * Содержит стори: campaign (S03–S06 — кампания отзывов).
 */
export class PeerReviewController extends U7BotController {
  readonly name = 'peer-review';

  protected override readonly stories = [new CampaignStory()];
}
