import { UserSchema } from '@u7-scl/user/domain';
import * as v from 'valibot';
import { ModuleSchema } from '#domain/module/entity';
import { StatusSchema } from '../status';

/** Схема фазы курса (value-object внутри Course) */
export const PhaseSchema = v.object({
  title: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty('Заголовок фазы не может быть пустым'),
  ),
  track: v.optional(v.string()),
  moduleIds: v.array(ModuleSchema.entries.uuid),
});

export type Phase = v.InferOutput<typeof PhaseSchema>;

/** Схема курса */
export const CourseSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid('Некорректный формат UUID')),
  title: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty('Заголовок не может быть пустым'),
  ),
  description: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty('Описание не может быть пустым'),
  ),
  authorId: UserSchema.entries.uuid,
  phases: v.array(PhaseSchema),
  status: StatusSchema,
  createdAt: v.pipe(v.string(), v.isoDateTime('Некорректный формат даты')),
  updatedAt: v.optional(
    v.pipe(v.string(), v.isoDateTime('Некорректный формат даты')),
  ),
});

export type Course = v.InferOutput<typeof CourseSchema>;

/** Метаданные агрегата Course */
export interface CourseArMeta {
  name: 'Course';
  label: 'Курс';
  state: Course;
}
