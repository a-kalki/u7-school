import { isoNow } from '@u7-scl/core/shared';
import * as v from 'valibot';
import type { Questionnaire } from './entity';
import type { MetricQuestionPool } from './metric/metric-question';
import { MetricQuestionPoolSchema } from './metric/metric-question';
import type {
  MetricAssessment,
  MetricQuestionnaire,
} from './metric/metric-questionnaire';
import { MetricAssessmentSchema } from './metric/metric-questionnaire';
import { MetricQuestionnaireAr } from './metric/metric-questionnaire-ar';
import type { QuestionnairePool } from './question';
import { QuestionnairePoolSchema } from './question';
import type { QuestionnaireState } from './repo';
import { QuestionnaireAr } from './standard/questionnaire-ar';

/**
 * Единая фабрика агрегатов анкеты.
 * Объявляет все конструкторы: обычная анкета, метрик-анкета, восстановление
 * из сохранённого состояния.
 */
export const QuestionnaireFactory = {
  /** Создаёт обычную анкету в статусе invited. */
  createStandard: (
    respondentId: string,
    pool: QuestionnairePool,
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
      createdAt: isoNow(),
      completedAt: null,
    };
    return new QuestionnaireAr(state);
  },

  /** Создаёт метрик-анкету в статусе invited из пула метрик и оценочного контекста. */
  createMetric: (
    respondentId: string,
    pool: MetricQuestionPool,
    assessment: MetricAssessment,
  ): MetricQuestionnaireAr => {
    const parsedPool = v.parse(MetricQuestionPoolSchema, pool);
    const parsedAssessment = v.parse(MetricAssessmentSchema, assessment);

    const state: MetricQuestionnaire = {
      kind: 'metric',
      uuid: crypto.randomUUID(),
      respondentId,
      status: 'invited',
      currentQuestionCode: null,
      draftAnswers: {},
      answers: [],
      questionPool: parsedPool,
      assessment: parsedAssessment,
      createdAt: isoNow(),
      completedAt: null,
    };
    return new MetricQuestionnaireAr(state);
  },

  /** Восстанавливает агрегат из сохранённого состояния по дискриминатору kind. */
  restore: (
    state: QuestionnaireState,
  ): QuestionnaireAr | MetricQuestionnaireAr => {
    if (state.kind === 'metric') {
      return new MetricQuestionnaireAr(state);
    }
    return new QuestionnaireAr(state);
  },
};
