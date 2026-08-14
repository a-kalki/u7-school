import type { DomainEvent } from '@u7-scl/core/domain';
import type { BaseQuestionnaireArMeta } from './entity';
import type { LikertScore } from './likert/likert-question';

/** Базовый payload событий анкеты (без дискриминатора kind). */
type QuestionnaireBasePayload = {
  questionnaireId: string;
  respondentId: string;
};

/** Событие завершения обычной анкеты. */
export interface QuestionnaireCompleteEvent<
  TOwnerInfo extends Record<string, unknown> = Record<string, unknown>,
> extends DomainEvent {
  eventName: 'questionnaire:complete';
  aggregateName: 'Questionnaire';
  ownerInfo: TOwnerInfo;
  payload: QuestionnaireBasePayload;
}

/** Событие отказа от приглашения обычной анкеты. */
export interface QuestionnaireDeclineEvent<
  TOwnerInfo extends Record<string, unknown> = Record<string, unknown>,
> extends DomainEvent {
  eventName: 'questionnaire:decline';
  aggregateName: BaseQuestionnaireArMeta['name'];
  ownerInfo: TOwnerInfo;
  payload: QuestionnaireBasePayload;
}

/** Событие прерывания обычной анкеты. */
export interface QuestionnaireAbandonEvent<
  TOwnerInfo extends Record<string, unknown> = Record<string, unknown>,
> extends DomainEvent {
  eventName: 'questionnaire:abandon';
  aggregateName: BaseQuestionnaireArMeta['name'];
  ownerInfo: TOwnerInfo;
  payload: QuestionnaireBasePayload;
}

/** Событие завершения likert-анкеты: ownerInfo + вычисленные баллы. */
export interface LikertQuestionnaireCompleteEvent<
  TOwnerInfo extends Record<string, unknown> = Record<string, unknown>,
> extends DomainEvent {
  eventName: 'questionnaire:likert-complete';
  aggregateName: BaseQuestionnaireArMeta['name'];
  ownerInfo: TOwnerInfo;
  payload: QuestionnaireBasePayload & { likertScores: LikertScore[] };
}

/** Событие отказа от приглашения likert-анкеты. */
export interface LikertQuestionnaireDeclineEvent<
  TOwnerInfo extends Record<string, unknown> = Record<string, unknown>,
> extends DomainEvent {
  eventName: 'questionnaire:likert-decline';
  aggregateName: BaseQuestionnaireArMeta['name'];
  ownerInfo: TOwnerInfo;
  payload: QuestionnaireBasePayload;
}

/** Событие прерывания likert-анкеты. */
export interface LikertQuestionnaireAbandonEvent<
  TOwnerInfo extends Record<string, unknown> = Record<string, unknown>,
> extends DomainEvent {
  eventName: 'questionnaire:likert-abandon';
  aggregateName: BaseQuestionnaireArMeta['name'];
  ownerInfo: TOwnerInfo;
  payload: QuestionnaireBasePayload;
}
