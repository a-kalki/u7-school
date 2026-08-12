import type { User } from '@u7-scl/user/domain';
import type {
  InviteResponse,
  QuestionnaireActionResponse,
} from './questionnaire/types';

/**
 * Интерфейс для бота UI-слоя для запуска анкет.
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
