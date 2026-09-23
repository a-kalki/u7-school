import type { UcMeta } from '@u7-scl/core/api';
import * as v from 'valibot';
import { uuidField } from '../../shared/schema';
import { ReviewSnapshotSchema } from './list-scope-reviews-cmd';

export const ListMyReviewsCmdSchema = v.object({
  userId: uuidField('Некорректный формат UUID пользователя'),
});

export type ListMyReviewsCmd = v.InferOutput<typeof ListMyReviewsCmdSchema>;

/** Проекция «Отзывы мне»: плоский список отзывов адресата. */
export const MyReviewsSchema = v.object({
  /** Новые наверху: createdAt (затем uuid) по убыванию. */
  reviews: v.array(ReviewSnapshotSchema),
});

export type MyReviewsProjection = v.InferOutput<typeof MyReviewsSchema>;

export interface ListMyReviewsCmdMeta extends UcMeta {
  ucName: 'list-my-reviews';
  input: ListMyReviewsCmd;
  output: MyReviewsProjection;
  errors: never;
  requiresAuth: true;
  type: 'query';
}
