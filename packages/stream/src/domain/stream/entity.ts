import * as v from 'valibot';
import { StreamStatusSchema } from '../status';
import type { ArMeta } from '@u7-scl/core/domain';

/** Схема шага внутри снимка контента */
export const LessonSnapshotSchema = v.object({
  lessonId: v.pipe(v.string(), v.uuid('Некорректный формат UUID урока')),
  lessonTitle: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty('Заголовок урока не может быть пустым'),
  ),
  stepIds: v.array(v.pipe(v.string(), v.uuid('Некорректный формат UUID шага'))),
});

/** Схема проекта внутри снимка контента */
export const ProjectSnapshotSchema = v.object({
  projectId: v.pipe(v.string(), v.uuid('Некорректный формат UUID проекта')),
  projectTitle: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty('Заголовок проекта не может быть пустым'),
  ),
  lessons: v.array(LessonSnapshotSchema),
});

/** Снимок контента модуля — дерево проектов с уроками и шагами */
export const ContentSnapshotSchema = v.array(ProjectSnapshotSchema);
export type ContentSnapshot = v.InferOutput<typeof ContentSnapshotSchema>;

/** Схема сущности потока курсов */
export const StreamSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid('Некорректный формат UUID потока')),
  title: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty('Заголовок потока не может быть пустым'),
  ),
  description: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty('Описание потока не может быть пустым'),
  ),
  mentorId: v.pipe(v.string(), v.uuid('Некорректный формат UUID ментора')),
  moduleId: v.pipe(v.string(), v.uuid('Некорректный формат UUID модуля')),
  startDate: v.pipe(
    v.string(),
    v.isoDateTime('Некорректный формат даты начала'),
  ),
  status: StreamStatusSchema,
  telegramGroupId: v.optional(v.string()),

  goal: v.optional(v.string()),
  result: v.optional(v.string()),
  rules: v.optional(v.string()),
  additional: v.optional(v.string()),
  targetAudience: v.optional(v.string()),

  contentSnapshot: ContentSnapshotSchema,

  createdAt: v.pipe(
    v.string(),
    v.isoDateTime('Некорректный формат даты создания'),
  ),
  updatedAt: v.optional(
    v.pipe(v.string(), v.isoDateTime('Некорректный формат даты обновления')),
  ),
});

export type Stream = v.InferOutput<typeof StreamSchema>;

export interface StreamArMeta extends ArMeta {
  name: 'Stream';
  label: 'Поток';
  state: Stream;
}
