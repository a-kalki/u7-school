import * as v from "valibot";
import { ProjectSchema } from "./project";

/**
 * Схема модуля платформы u7-school.
 * Логическая единица курса, содержит список проектов.
 */
export const ModuleSchema = v.object({
  /** Уникальный идентификатор модуля */
  id: v.pipe(v.string(), v.nonEmpty("ID модуля не может быть пустым")),
  /** Название модуля */
  title: v.pipe(v.string(), v.nonEmpty("Название модуля не может быть пустым")),
  /** Цель модуля */
  goal: v.optional(v.string()),
  /** Результат прохождения модуля */
  result: v.optional(v.string()),
  /** Дополнительная информация */
  additional: v.optional(v.string()),
  /** Список проектов в модуле */
  projects: v.pipe(
    v.array(ProjectSchema),
    v.nonEmpty("Модуль должен содержать хотя бы один проект"),
  ),
});

/** Тип модуля, выводимый из схемы Valibot */
export type Module = v.InferOutput<typeof ModuleSchema>;
