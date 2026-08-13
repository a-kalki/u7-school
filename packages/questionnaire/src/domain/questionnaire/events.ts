import type { DomainEvent } from '@u7-scl/core/domain';
import type { MetricScore } from './metric/metric-question';
import type { MetricAssessment } from './metric/metric-questionnaire';

/** Событие завершения анкеты — генерирует базовый QuestionnaireAr. */
export interface QuestionnaireCompleted extends DomainEvent {
  eventName: 'questionnaire.completed';
  aggregateName: 'Questionnaire';
  payload: {
    questionnaireId: string;
    respondentId: string;
  };
}

/**
 * Событие завершения метрик-анкеты — генерирует MetricQuestionnaireAr.
 * Расширяет payload оценочным контекстом и вычисленными баллами.
 */
export interface MetricQuestionnaireCompleted extends QuestionnaireCompleted {
  payload: QuestionnaireCompleted['payload'] &
    MetricAssessment & {
      metricScores: MetricScore[];
    };
}
