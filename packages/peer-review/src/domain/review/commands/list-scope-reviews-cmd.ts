import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import { StudentOutcomeSchema } from '../../review-campaign/entity';
import { isoMinuteField, uuidField } from '../../shared/schema';
import { ReviewDirectionSchema } from '../entity';
import type { ScopeReviewsProjection } from '../scope-reviews-ds';

export const ListScopeReviewsCmdSchema = v.object({
  scopeId: uuidField('Некорректный формат UUID скоупа'),
});

export type ListScopeReviewsCmd = v.InferOutput<
  typeof ListScopeReviewsCmdSchema
>;

/** Валидация снимка отзыва; тип — из домена (scope-reviews-ds). */
export const ReviewSnapshotSchema = v.object({
  reviewId: uuidField('Некорректный формат UUID отзыва'),
  authorId: uuidField('Некорректный формат UUID автора'),
  direction: ReviewDirectionSchema,
  authorOutcome: v.optional(StudentOutcomeSchema),
  text: v.string(),
  createdAt: isoMinuteField('Некорректный формат даты'),
});

export const ScopeReviewsSchema = v.object({
  scopeId: uuidField('Некорректный формат UUID скоупа'),
  /** Группы отзывов по адресатам; внутри — по времени создания. */
  recipients: v.array(
    v.object({
      recipientId: uuidField('Некорректный формат UUID адресата'),
      reviews: v.array(ReviewSnapshotSchema),
    }),
  ),
});

export interface ListScopeReviewsCmdMeta extends UcMeta {
  ucName: 'list-scope-reviews';
  input: ListScopeReviewsCmd;
  output: ScopeReviewsProjection;
  errors: never;
  requiresAuth: true;
  type: 'query';
}
