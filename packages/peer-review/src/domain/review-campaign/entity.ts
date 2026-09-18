import type { ArMeta } from '@u7-scl/core/domain';
import * as v from 'valibot';
import type { StudentCampaignCreatedEvent } from './events';

/** Роль участника кампании: студент потока или его ментор. */
export const CampaignRoleSchema = v.picklist(
  ['student', 'mentor'],
  'Недопустимая роль участника кампании',
);

export type CampaignRole = v.InferOutput<typeof CampaignRoleSchema>;

/** Исход участника-студента — проекция статуса на момент события субъекта. */
export const ParticipantOutcomeSchema = v.picklist(
  ['completed', 'in_progress', 'dropped', 'never_started'],
  'Недопустимый исход участника кампании',
);

export type ParticipantOutcome = v.InferOutput<typeof ParticipantOutcomeSchema>;

/**
 * Участник кампании — снапшот на момент создания.
 * Студент — с исходом-проекцией; ментор — отдельная роль, без исхода.
 */
export const CampaignParticipantSchema = v.object({
  userId: v.pipe(v.string(), v.uuid('userId участника должен быть UUID')),
  role: CampaignRoleSchema,
  outcome: v.optional(ParticipantOutcomeSchema),
});

export type CampaignParticipant = v.InferOutput<
  typeof CampaignParticipantSchema
>;

/** Контекст кампании — дискриминант payload. Сейчас только завершение потока. */
export const CampaignContextSchema = v.picklist(
  ['stream_ended'],
  'Недопустимый контекст кампании',
);

export type CampaignContext = v.InferOutput<typeof CampaignContextSchema>;

/** Специфика скоупа завершённого потока — «чистый случай», без доп. данных. */
export const StreamEndedPayloadSchema = v.object({});

export type StreamEndedPayload = v.InferOutput<typeof StreamEndedPayloadSchema>;

/**
 * Кампания контекста stream_ended: каркас + пустой payload.
 * `subjectId` — студент, чьё событие открыло окно судьбы (ФР-2).
 */
export const StreamEndedCampaignSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid('Некорректный формат UUID кампании')),
  context: v.literal('stream_ended'),
  scopeId: v.pipe(v.string(), v.uuid('scopeId кампании должен быть UUID')),
  subjectId: v.pipe(v.string(), v.uuid('subjectId кампании должен быть UUID')),
  createdAt: v.pipe(
    v.string(),
    v.isoDateTime('Некорректный формат даты создания'),
  ),
  /** Вычисляется при создании из константы окна и сохраняется. */
  expiresAt: v.pipe(
    v.string(),
    v.isoDateTime('Некорректный формат даты закрытия окна'),
  ),
  participants: v.array(CampaignParticipantSchema),
  payload: StreamEndedPayloadSchema,
});

export type StreamEndedCampaign = v.InferOutput<
  typeof StreamEndedCampaignSchema
>;

/**
 * Схема кампании — вариантный тип по `context`
 */
export const ReviewCampaignSchema = v.variant('context', [
  StreamEndedCampaignSchema,
]);

export type ReviewCampaign = v.InferOutput<typeof ReviewCampaignSchema>;

/** Метаданные агрегата ReviewCampaign */
export interface ReviewCampaignArMeta extends ArMeta {
  name: 'ReviewCampaign';
  label: 'Кампания отзывов';
  state: ReviewCampaign;
  events: StudentCampaignCreatedEvent;
}
