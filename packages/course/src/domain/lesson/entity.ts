import * as v from 'valibot';
import { StatusSchema } from '../status';

/** Схема урока */
export const LessonSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid('Некорректный формат UUID')),
  courseId: v.pipe(v.string(), v.uuid('Некорректный формат UUID')),
  title: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty('Заголовок не может быть пустым'),
  ),
  additional: v.optional(v.string()),
  status: StatusSchema,
  createdAt: v.pipe(v.string(), v.isoDateTime('Некорректный формат даты')),
  updatedAt: v.optional(
    v.pipe(v.string(), v.isoDateTime('Некорректный формат даты')),
  ),
  estimatedMinutes: v.optional(
    v.pipe(
      v.number(),
      v.integer('estimatedMinutes должен быть целым числом'),
      v.minValue(1, 'estimatedMinutes должен быть положительным'),
    ),
  ),
  stepIds: v.array(
    v.pipe(v.string(), v.uuid('Некорректный формат UUID stepIds')),
  ),
  mentorStepIds: v.array(
    v.pipe(v.string(), v.uuid('Некорректный формат UUID mentorStepIds')),
  ),
});

export type Lesson = v.InferOutput<typeof LessonSchema>;

/** Метаданные агрегата Lesson */
export interface LessonArMeta {
  name: 'Lesson';
  label: 'Урок';
  state: Lesson;
}
