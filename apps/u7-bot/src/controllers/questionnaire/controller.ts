import type { QuestionnaireApiModule } from '@u7-scl/questionnaire/api';
import { U7BotController } from '../../core/u7-bot-controller';
import { FillStory } from './fill.story';

/**
 * Контроллер questionnaire для Telegram-бота.
 *
 * Принимает QuestionnaireApiModule напрямую (standalone-модуль,
 * не зарегистрирован в ApiApp из-за конфликтов имён UC с onboarding).
 */
export class QuestionnaireController extends U7BotController {
  override readonly name = 'questionnaire';

  constructor(questionnaireModule: QuestionnaireApiModule) {
    super();
    this.stories.push(new FillStory(questionnaireModule));
  }
}
