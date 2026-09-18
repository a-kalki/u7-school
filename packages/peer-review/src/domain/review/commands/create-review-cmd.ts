import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import type { PeerReviewUcErrors } from '../../../api/errors';

export const CreateReviewCmdSchema = v.object({
  campaignId: v.pipe(v.string(), v.uuid('Некорректный формат UUID кампании')),
  authorId: v.pipe(v.string(), v.uuid('Некорректный формат UUID автора')),
  recipientId: v.pipe(v.string(), v.uuid('Некорректный формат UUID адресата')),
  text: v.pipe(v.string(), v.nonEmpty('Текст отзыва обязателен')),
});

export type CreateReviewCmd = v.InferOutput<typeof CreateReviewCmdSchema>;

export const ReviewSavedSchema = v.object({
  reviewId: v.pipe(v.string(), v.uuid('Некорректный формат UUID отзыва')),
  campaignId: v.pipe(v.string(), v.uuid('Некорректный формат UUID кампании')),
  recipientId: v.pipe(v.string(), v.uuid('Некорректный формат UUID адресата')),
});

export type ReviewSaved = v.InferOutput<typeof ReviewSavedSchema>;

export interface CreateReviewCmdMeta extends UcMeta {
  ucName: 'create-review';
  input: CreateReviewCmd;
  output: ReviewSaved;
  errors: PeerReviewUcErrors;
  requiresAuth: true;
  type: 'command';
}
