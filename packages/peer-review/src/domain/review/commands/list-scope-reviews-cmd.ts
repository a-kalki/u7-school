import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';

export const ListScopeReviewsCmdSchema = v.object({
  scopeId: v.pipe(v.string(), v.uuid('Некорректный формат UUID скоупа')),
});

export type ListScopeReviewsCmd = v.InferOutput<
  typeof ListScopeReviewsCmdSchema
>;

/** Снимок отзыва для рендера — снапшоты ролей/исходов из самого отзыва. */
export const ReviewSnapshotSchema = v.object({
  reviewId: v.pipe(v.string(), v.uuid('Некорректный формат UUID отзыва')),
  authorId: v.pipe(v.string(), v.uuid('Некорректный формат UUID автора')),
  authorRole: v.picklist(['student', 'mentor']),
  authorOutcome: v.optional(
    v.picklist(['completed', 'dropped', 'in_progress', 'never_started']),
  ),
  text: v.string(),
  createdAt: v.pipe(v.string(), v.isoDateTime('Некорректный формат даты')),
});

export const ScopeReviewsSchema = v.object({
  scopeId: v.pipe(v.string(), v.uuid('Некорректный формат UUID скоупа')),
  /** Группы отзывов по адресатам; внутри — по времени создания. */
  recipients: v.array(
    v.object({
      recipientId: v.pipe(
        v.string(),
        v.uuid('Некорректный формат UUID адресата'),
      ),
      recipientRole: v.picklist(['student', 'mentor']),
      reviews: v.array(ReviewSnapshotSchema),
    }),
  ),
});

export type ReviewSnapshot = v.InferOutput<typeof ReviewSnapshotSchema>;
export type ScopeReviews = v.InferOutput<typeof ScopeReviewsSchema>;

export interface ListScopeReviewsCmdMeta extends UcMeta {
  ucName: 'list-scope-reviews';
  input: ListScopeReviewsCmd;
  output: ScopeReviews;
  errors: never;
  requiresAuth: true;
  type: 'query';
}
