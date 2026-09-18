import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import type { PeerReviewUcErrors } from '../../../api/errors';
import { uuidField } from '../../shared/schema';

export const CreateReviewCmdSchema = v.object({
  campaignId: uuidField('Некорректный формат UUID кампании'),
  authorId: uuidField('Некорректный формат UUID автора'),
  recipientId: uuidField('Некорректный формат UUID адресата'),
  text: v.pipe(v.string(), v.nonEmpty('Текст отзыва обязателен')),
});

export type CreateReviewCmd = v.InferOutput<typeof CreateReviewCmdSchema>;

export const ReviewSavedSchema = v.object({
  reviewId: uuidField('Некорректный формат UUID отзыва'),
  campaignId: uuidField('Некорректный формат UUID кампании'),
  recipientId: uuidField('Некорректный формат UUID адресата'),
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
