import type { ArMeta } from '@u7-scl/core/domain';
import { CourseSchema } from '@u7-scl/course/domain';
import { UserSchema } from '@u7-scl/user/domain';
import * as v from 'valibot';

/** Статус желания пройти курс. */
export const WishStatusSchema = v.picklist(
  ['expressed', 'cancelled', 'fulfilled'],
  'Некорректный статус желания',
);

export type WishStatus = v.InferOutput<typeof WishStatusSchema>;

/** Схема желания пройти курс. */
export const WishSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid('Некорректный формат UUID')),
  userId: UserSchema.entries.uuid,
  courseId: CourseSchema.entries.uuid,
  status: WishStatusSchema,
  createdAt: v.pipe(
    v.string(),
    v.isoDateTime('Некорректный формат даты создания'),
  ),
  updatedAt: v.optional(
    v.pipe(v.string(), v.isoDateTime('Некорректный формат даты обновления')),
  ),
});

export type Wish = v.InferOutput<typeof WishSchema>;

/** Метаданные агрегата Wish. */
export interface WishArMeta extends ArMeta {
  name: 'Wish';
  label: 'Желание';
  state: Wish;
}
