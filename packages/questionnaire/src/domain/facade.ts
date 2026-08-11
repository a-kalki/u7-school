import type { Questionnaire } from './questionnaire/entity';
import type { Question } from './questionnaire/question';
import type { QuestionnaireActionResponse } from './questionnaire/types';

/**
 * Фасад модуля questionnaire — точка входа для потребителей.
 */
export interface QuestionnaireFacade {
  /** Создать намерение (анкету в статусе intention) */
  createIntention(respondentId: number): Promise<{ questionnaireId: string }>;

  /** Запустить анкету: передать пул вопросов и получить первый вопрос */
  start(
    questionnaireId: string,
    pool: Question[],
  ): Promise<QuestionnaireActionResponse>;

  /** Создать и сразу запустить (intention + start) */
  startNew(
    respondentId: number,
    pool: Question[],
  ): Promise<QuestionnaireActionResponse>;

  /** Обработать действие пользователя */
  handleAction(
    questionnaireId: string,
    action: { type: 'callback' | 'text'; value: string },
  ): Promise<QuestionnaireActionResponse>;

  /** Получить анкету */
  getQuestionnaire(questionnaireId: string): Promise<Questionnaire>;

  /** Получить анкеты пользователя */
  getQuestionnairesByUser(respondentId: number): Promise<Questionnaire[]>;
}
