import type { ArMeta } from '@u7-scl/core/domain';
import * as v from 'valibot';
import {
  CampaignRoleSchema,
  ParticipantOutcomeSchema,
} from '../review-campaign/entity';
import { isoMinuteField, uuidField } from '../shared/schema';

/** Минимальная длина текста отзыва (символов). */
export const REVIEW_TEXT_MIN_LENGTH = 10;

/** Максимальная длина текста отзыва (символов). */
export const REVIEW_TEXT_MAX_LENGTH = 3500;

/** Схема текста отзыва (10–3500 символов). */
export const ReviewTextSchema = v.pipe(
  v.string(),
  v.minLength(REVIEW_TEXT_MIN_LENGTH, 'Отзыв слишком короткий'),
  v.maxLength(REVIEW_TEXT_MAX_LENGTH, 'Отзыв слишком длинный'),
);

/** Схема сущности текстового отзыва. */
export const ReviewSchema = v.object({
  uuid: uuidField('Некорректный формат UUID отзыва'),
  /** Скоуп кампании — денормализация для выборок по скоупу (ФР-9). */
  scopeId: uuidField('scopeId отзыва должен быть UUID'),
  campaignId: uuidField('campaignId отзыва должен быть UUID'),
  authorId: uuidField('authorId отзыва должен быть UUID'),
  authorRole: CampaignRoleSchema,
  authorOutcome: v.optional(ParticipantOutcomeSchema),
  recipientId: uuidField('recipientId отзыва должен быть UUID'),
  recipientRole: CampaignRoleSchema,
  text: ReviewTextSchema,
  createdAt: isoMinuteField('Некорректный формат даты создания'),
  updatedAt: v.optional(isoMinuteField('Некорректный формат даты обновления')),
});

export type Review = v.InferOutput<typeof ReviewSchema>;

/** Метаданные агрегата Review */
export interface ReviewArMeta extends ArMeta {
  name: 'Review';
  label: 'Отзыв';
  state: Review;
}
