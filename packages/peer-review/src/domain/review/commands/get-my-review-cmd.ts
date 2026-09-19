import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import { uuidField } from '../../shared/schema';

export const GetMyReviewCmdSchema = v.object({
  campaignId: uuidField('Некорректный формат UUID кампании'),
  authorId: uuidField('Некорректный формат UUID автора'),
  recipientId: uuidField('Некорректный формат UUID адресата'),
});

export type GetMyReviewCmd = v.InferOutput<typeof GetMyReviewCmdSchema>;

export const MyReviewSchema = v.object({
  found: v.boolean(),
  text: v.optional(v.string()),
});

export type MyReview = v.InferOutput<typeof MyReviewSchema>;

export interface GetMyReviewCmdMeta extends UcMeta {
  ucName: 'get-my-review';
  input: GetMyReviewCmd;
  output: MyReview;
  errors: never;
  requiresAuth: true;
  type: 'query';
}
