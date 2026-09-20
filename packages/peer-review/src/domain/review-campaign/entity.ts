import type { ArMeta } from '@u7-scl/core/domain';
import * as v from 'valibot';
import { isoMinuteField, uuidField } from '../shared/schema';
import type { StudentCampaignCreatedEvent } from './events';

/**
 * Исход судьбы студента — 4-значная проекция (ФР-1):
 * завершил и прошел / завершил и не прошел / забросил / не начал.
 * «Ещё учится» не хранится вовсе; сырые статусы студента сюда не попадают.
 */
export const StudentOutcomeSchema = v.picklist(
  ['completed_passed', 'completed_not_passed', 'dropped', 'never_started'],
  'Недопустимый исход судьбы студента',
);

export type StudentOutcome = v.InferOutput<typeof StudentOutcomeSchema>;

/** Контекст кампании — дискриминант payload. Окно судьбы студента потока. */
export const CampaignContextSchema = v.picklist(
  ['stream_fate'],
  'Недопустимый контекст кампании',
);

export type CampaignContext = v.InferOutput<typeof CampaignContextSchema>;

/** Специфика окна судьбы студента потока: исход субъекта и его ментор. */
export const StreamFatePayloadSchema = v.object({
  subjectOutcome: StudentOutcomeSchema,
  mentorId: uuidField('mentorId кампании должен быть UUID'),
});

export type StreamFatePayload = v.InferOutput<typeof StreamFatePayloadSchema>;

/**
 * Кампания контекста stream_fate: каркас + payload { subjectOutcome, mentorId }.
 * `subjectId` — студент, чьё событие открыло окно судьбы;
 * `participants` — только id адресуемых соучеников (без субъекта, ментора
 * и каких-либо статусов/ролей; пустой список — адресат только ментор).
 */
export const StreamFateCampaignSchema = v.object({
  uuid: uuidField('Некорректный формат UUID кампании'),
  context: v.literal('stream_fate'),
  scopeId: uuidField('scopeId кампании должен быть UUID'),
  subjectId: uuidField('subjectId кампании должен быть UUID'),
  createdAt: isoMinuteField('Некорректный формат даты создания'),
  updatedAt: v.optional(isoMinuteField('Некорректный формат даты обновления')),
  expiresAt: isoMinuteField('Некорректный формат даты закрытия окна'),
  participants: v.array(uuidField('userId участника должен быть UUID')),
  payload: StreamFatePayloadSchema,
});

export type StreamFateCampaign = v.InferOutput<typeof StreamFateCampaignSchema>;

/**
 * Схема кампании — вариантный тип по `context`
 */
export const ReviewCampaignSchema = v.variant('context', [
  StreamFateCampaignSchema,
]);

export type ReviewCampaign = v.InferOutput<typeof ReviewCampaignSchema>;

/** Метаданные агрегата ReviewCampaign */
export interface ReviewCampaignArMeta extends ArMeta {
  name: 'ReviewCampaign';
  label: 'Кампания отзывов';
  state: ReviewCampaign;
  events: StudentCampaignCreatedEvent;
}
