import type { ArMeta } from '@u7-scl/core/domain';
import { CourseSchema, ModuleSchema } from '@u7-scl/course/domain';
import { UserSchema } from '@u7-scl/user/domain';
import * as v from 'valibot';

/**
 * Цель желания — универсальная ссылка на объект желания.
 * Дискриминированный союз по `kind`:
 * - `course` — желание пройти курс (вся программа, начиная со стартового модуля);
 * - `module` — желание пройти конкретный модуль (следующий/тот же).
 */
export const WishTargetSchema = v.variant('kind', [
  v.object({ kind: v.literal('course'), courseId: CourseSchema.entries.uuid }),
  v.object({ kind: v.literal('module'), moduleId: ModuleSchema.entries.uuid }),
]);

export type WishTarget = v.InferOutput<typeof WishTargetSchema>;

/**
 * Статус желания.
 * - `expressed` — мгновенная фиксация (курс без пула анкеты);
 * - `pending` — анкета начата, желание зафиксировано в ожидании;
 * - `confirmed` — анкета завершена, желание подтверждено;
 * - `cancelled` — отменено пользователем (из expressed/confirmed);
 * - `abandoned` — анкета брошена (из pending);
 * - `fulfilled` — реализовано (трек C2).
 */
export const WishStatusSchema = v.picklist(
  ['expressed', 'pending', 'confirmed', 'cancelled', 'abandoned', 'fulfilled'],
  'Некорректный статус желания',
);

export type WishStatus = v.InferOutput<typeof WishStatusSchema>;

/** Схема желания. */
export const WishSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid('Некорректный формат UUID')),
  userId: UserSchema.entries.uuid,
  target: WishTargetSchema,
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
