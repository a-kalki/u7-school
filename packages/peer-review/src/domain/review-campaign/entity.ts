import type { ArMeta } from '@u7-scl/core/domain';
import * as v from 'valibot';
import type { CampaignCreatedEvent } from './events';

/** Роль участника кампании: студент потока или его ментор. */
export const CampaignRoleSchema = v.picklist(
  ['student', 'mentor'],
  'Недопустимая роль участника кампании',
);

export type CampaignRole = v.InferOutput<typeof CampaignRoleSchema>;

/** Статус участника при окончании модуля. */
export const ParticipantOutcomeSchema = v.picklist(
  ['completed', 'dropped', 'never_started'],
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
  ['stream_completed'],
  'Недопустимый контекст кампании',
);

export type CampaignContext = v.InferOutput<typeof CampaignContextSchema>;

/** Специфика скоупа завершённого потока — «чистый случай», без доп. данных. */
export const StreamCompletedPayloadSchema = v.object({});

export type StreamCompletedPayload = v.InferOutput<
  typeof StreamCompletedPayloadSchema
>;

/** Кампания контекста stream_completed: каркас + пустой payload. */
export const StreamCompletedCampaignSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid('Некорректный формат UUID кампании')),
  context: v.literal('stream_completed'),
  scopeId: v.pipe(
    v.string(),
    v.uuid('scopeId кампании должен быть UUID (для потока — streamId)'),
  ),
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
  payload: StreamCompletedPayloadSchema,
});

export type StreamCompletedCampaign = v.InferOutput<
  typeof StreamCompletedCampaignSchema
>;

/**
 * Схема кампании — вариантный тип по `context`
 */
export const ReviewCampaignSchema = v.variant('context', [
  StreamCompletedCampaignSchema,
]);

export type ReviewCampaign = v.InferOutput<typeof ReviewCampaignSchema>;

/** Метаданные агрегата ReviewCampaign */
export interface ReviewCampaignArMeta extends ArMeta {
  name: 'ReviewCampaign';
  label: 'Кампания отзывов';
  state: ReviewCampaign;
  events: CampaignCreatedEvent;
}
