import { U7BotController } from '../../core/u7-bot-controller';
import { FillStory } from './stories/fill.story';
import { InviteStory } from './stories/invite.story';

/**
 * Контроллер questionnaire для Telegram-бота.
 */
export class QuestionnaireController extends U7BotController {
  override readonly name = 'questionnaire';

  constructor() {
    super();
    this.stories.push(new FillStory(), new InviteStory());
  }
}
