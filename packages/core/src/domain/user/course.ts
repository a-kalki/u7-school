import * as v from "valibot";

/**
 * Схема курса платформы u7-school.
 * Корневой элемент образовательного контента. Содержит метаданные и список модулей.
 */
export const CourseSchema = v.object({
  /** Уникальный идентификатор курса */
  id: v.pipe(v.string(), v.nonEmpty("ID курса не может быть пустым")),
  /** Название курса */
  title: v.pipe(v.string(), v.nonEmpty("Название курса не может быть пустым")),
  /** Описание курса */
  description: v.pipe(
    v.string(),
    v.nonEmpty("Описание курса не может быть пустым"),
  ),
  /** ID автора (ментора), создавшего курс */
  authorId: v.pipe(
    v.string(),
    v.nonEmpty("ID автора не может быть пустым"),
  ),
  /** Для кого предназначен курс */
  targetAudience: v.optional(v.string()),
  /** Цель курса */
  goal: v.optional(v.string()),
  /** Что будет уметь студент в конце курса */
  result: v.optional(v.string()),
  /** Правила прохождения курса */
  rules: v.optional(v.string()),
  /** Дополнительная информация от ментора */
  additional: v.optional(v.string()),
});

/** Тип курса, выводимый из схемы Valibot */
export type Course = v.InferOutput<typeof CourseSchema>;
