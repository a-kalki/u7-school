import type { Questionnaire } from './questionnaire/entity';
import type { QuestionnaireEngine } from './questionnaire/questionnaire-engine';
import type { QuestionnaireActionResponse } from './questionnaire/types';

/**
 * Фасад модуля questionnaire — точка входа для потребителей.
 */
export interface QuestionnaireFacade {
  /** Создать и запустить анкету (сразу в in_progress) */
  start(
    respondentId: number,
    engine: QuestionnaireEngine,
  ): Promise<QuestionnaireActionResponse>;

  /** Создать анкету в статусе intention */
  createIntention(respondentId: number): Promise<{ questionnaireId: string }>;

  /** Запустить intention-анкету */
  startMetric(
    questionnaireId: string,
    engine: QuestionnaireEngine,
  ): Promise<QuestionnaireActionResponse>;

  /** Обработать действие */
  handleAction(
    questionnaireId: string,
    action: { type: 'callback' | 'text'; value: string },
  ): Promise<QuestionnaireActionResponse>;

  /** Получить анкету */
  getQuestionnaire(questionnaireId: string): Promise<Questionnaire>;

  /** Получить анкеты пользователя */
  getQuestionnairesByUser(respondentId: number): Promise<Questionnaire[]>;
}
