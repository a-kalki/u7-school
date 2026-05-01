import * as v from "valibot";

// Временная заглушка для урока (будет заменена на LessonSchema в Фазе 4)
const LessonRefSchema = v.object({
  id: v.string(),
  title: v.string(),
});

/**
 * Схема проекта платформы u7-school.
 * Основная рабочая единица. Содержит список уроков.
 */
export const ProjectSchema = v.object({
  /** Уникальный идентификатор проекта */
  id: v.pipe(v.string(), v.nonEmpty("ID проекта не может быть пустым")),
  /** Название проекта */
  title: v.pipe(v.string(), v.nonEmpty("Название проекта не может быть пустым")),
  /** Цель проекта */
  goal: v.optional(v.string()),
  /** Что будет уметь или какой результат получит студент */
  result: v.optional(v.string()),
  /** Дополнительная информация */
  additional: v.optional(v.string()),
  /** Список уроков в проекте */
  lessons: v.optional(v.array(LessonRefSchema)),
});

/** Тип проекта, выводимый из схемы Valibot */
export type Project = v.InferOutput<typeof ProjectSchema>;
