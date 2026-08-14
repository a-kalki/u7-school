import type { DomainEvent } from '@u7-scl/core/domain';
import type { MetricScore } from './metric/metric-question';
import type { MetricAssessment } from './metric/metric-questionnaire';

/** Базовый payload событий анкеты. */
type QuestionnairePayload = {
  questionnaireId: string;
  respondentId: string;
};

/** Событие завершения анкеты — генерирует базовый QuestionnaireAr. */
export interface QuestionnaireCompleted extends DomainEvent {
  eventName: 'questionnaire.completed';
  aggregateName: 'Questionnaire';
  payload: QuestionnairePayload;
}

/** Событие отказа от приглашения — генерирует базовый QuestionnaireAr. */
export interface QuestionnaireDeclined extends DomainEvent {
  eventName: 'questionnaire.declined';
  aggregateName: 'Questionnaire';
  payload: QuestionnairePayload;
}

/** Событие прерывания анкеты — генерирует базовый QuestionnaireAr. */
export interface QuestionnaireAbandoned extends DomainEvent {
  eventName: 'questionnaire.abandoned';
  aggregateName: 'Questionnaire';
  payload: QuestionnairePayload;
}

/**
 * Событие завершения метрик-анкеты — генерирует MetricQuestionnaireAr.
 * Расширяет payload оценочным контекстом и вычисленными баллами.
 */
export interface MetricQuestionnaireCompleted extends QuestionnaireCompleted {
  payload: QuestionnairePayload &
    MetricAssessment & { metricScores: MetricScore[] };
}

/** Событие отказа от метрик-анкеты. */
export interface MetricQuestionnaireDeclined extends QuestionnaireDeclined {
  payload: QuestionnairePayload & MetricAssessment;
}

/** Событие прерывания метрик-анкеты. */
export interface MetricQuestionnaireAbandoned extends QuestionnaireAbandoned {
  payload: QuestionnairePayload & MetricAssessment;
}
