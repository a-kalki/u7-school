import type { LikertQuestionPool } from './questionnaire/likert/likert-question';
import type { QuestionnairePool } from './questionnaire/question';

/**
 * Фасад модуля questionnaire для внешних модулей.
 * Предоставляет запуск обычной анкеты и отправку приглашения на likert-анкету.
 */
export interface QuestionnaireFacade {
  /** Создать и сразу запустить обычную анкету. */
  startStandard<
    TOwnerInfo extends Record<string, unknown> = Record<string, unknown>,
  >(
    actorId: string,
    pool: QuestionnairePool,
    ownerInfo: TOwnerInfo,
  ): Promise<void>;

  /** Отправить приглашение на likert-анкету (invited). */
  sendLikertInvite<
    TOwnerInfo extends Record<string, unknown> = Record<string, unknown>,
  >(
    actorId: string,
    pool: LikertQuestionPool,
    ownerInfo: TOwnerInfo,
  ): Promise<void>;
}
