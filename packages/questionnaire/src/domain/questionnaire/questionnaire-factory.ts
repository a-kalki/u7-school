import { isoNow } from '@u7-scl/core/shared';
import * as v from 'valibot';
import type { Questionnaire } from './entity';
import type { LikertQuestionPool } from './likert/likert-question';
import { LikertQuestionPoolSchema } from './likert/likert-question';
import type { LikertQuestionnaire } from './likert/likert-questionnaire';
import { LikertQuestionnaireAr } from './likert/likert-questionnaire-ar';
import type { QuestionnairePool } from './question';
import { QuestionnairePoolSchema } from './question';
import type { QuestionnaireState } from './repo';
import { QuestionnaireAr } from './standard/questionnaire-ar';

/**
 * Единая фабрика агрегатов анкеты.
 * Объявляет все конструкторы: обычная анкета, likert-анкета, восстановление
 * из сохранённого состояния.
 */
export const QuestionnaireFactory = {
  /** Создаёт обычную анкету в статусе invited. */
  createStandard: (
    respondentId: string,
    pool: QuestionnairePool,
    ownerInfo: Record<string, unknown> = {},
  ): QuestionnaireAr => {
    v.parse(QuestionnairePoolSchema, pool);

    const state: Questionnaire = {
      kind: 'standard',
      uuid: crypto.randomUUID(),
      respondentId,
      status: 'invited',
      currentQuestionCode: null,
      draftAnswers: {},
      answers: [],
      questionPool: pool,
      ownerInfo,
      createdAt: isoNow(),
      completedAt: null,
    };
    return new QuestionnaireAr(state);
  },

  /** Создаёт likert-анкету в статусе invited из пула и ownerInfo. */
  createLikert: (
    respondentId: string,
    pool: LikertQuestionPool,
    ownerInfo: Record<string, unknown> = {},
  ): LikertQuestionnaireAr => {
    const parsedPool = v.parse(LikertQuestionPoolSchema, pool);

    const state: LikertQuestionnaire = {
      kind: 'likert',
      uuid: crypto.randomUUID(),
      respondentId,
      status: 'invited',
      currentQuestionCode: null,
      draftAnswers: {},
      answers: [],
      questionPool: parsedPool,
      ownerInfo,
      createdAt: isoNow(),
      completedAt: null,
    };
    return new LikertQuestionnaireAr(state);
  },

  /** Восстанавливает агрегат из сохранённого состояния по дискриминатору kind. */
  restore: (
    state: QuestionnaireState,
  ): QuestionnaireAr | LikertQuestionnaireAr => {
    if (state.kind === 'likert') {
      return new LikertQuestionnaireAr(state);
    }
    return new QuestionnaireAr(state);
  },
};
