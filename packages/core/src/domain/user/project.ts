import * as v from "valibot";

/**
 * Схема проекта платформы u7-school.
 * Контейнер для группы связанных задач или уроков внутри модуля.
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
});

/** Тип проекта, выводимый из схемы Valibot */
export type Project = v.InferOutput<typeof ProjectSchema>;
