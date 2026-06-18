import * as v from 'valibot';

/** Элемент снимка контента модуля */
export interface ContentSnapshotItem {
  projectId: string;
  projectTitle: string;
  lessons: {
    lessonId: string;
    lessonTitle: string;
    stepIds: string[];
  }[];
}

/** Снимок контента модуля — дерево проектов с уроками и шагами */
export type ContentSnapshot = ContentSnapshotItem[];

/** Схема урока внутри снимка контента */
export const LessonSnapshotSchema = v.object({
  lessonId: v.pipe(v.string(), v.uuid('Некорректный формат UUID урока')),
  lessonTitle: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty('Заголовок урока не может быть пустым'),
  ),
  stepIds: v.array(v.pipe(v.string(), v.uuid('Некорректный формат UUID шага'))),
});

/** Схема элемента снимка контента */
export const ContentSnapshotItemSchema = v.object({
  projectId: v.pipe(v.string(), v.uuid('Некорректный формат UUID проекта')),
  projectTitle: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty('Заголовок проекта не может быть пустым'),
  ),
  lessons: v.array(LessonSnapshotSchema),
});

/** Схема снимка контента — массив проектов */
export const ContentSnapshotSchema = v.array(ContentSnapshotItemSchema);
