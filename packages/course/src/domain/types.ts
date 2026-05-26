/** Вспомогательные типы уровня модуля course */

/** Идентификатор модуля (UUID) */
export type ModuleId = string;

/** Идентификатор урока (UUID) */
export type LessonId = string;

/** Идентификатор шага (UUID) */
export type StepId = string;

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
