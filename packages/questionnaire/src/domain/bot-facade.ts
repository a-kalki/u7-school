import type { User } from '@u7-scl/user/domain';
import type {
  InviteResponse,
  QuestionnaireActionResponse,
} from './questionnaire/types';

/**
 * Интерфейс для UI-слоя (бота), который рендерит приглашения и вопросы анкет.
 * Реализуется в адаптере бота (TelegramBotFacade).
 */
export interface QuestionnaireBotFacade {
  /** Отправить приглашение пройти анкету */
  sendQuestionnaireInvite(user: User, response: InviteResponse): Promise<void>;

  /** Начать анкету — отобразить первый вопрос */
  startQuestionnaire(
    user: User,
    response: QuestionnaireActionResponse,
  ): Promise<void>;
}
