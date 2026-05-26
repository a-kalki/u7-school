import * as v from 'valibot';
import { StatusSchema } from '../status';

/** Схема проекта (value-object внутри Module) */
export const ProjectSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid('Некорректный формат UUID проекта')),
  title: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty('Заголовок проекта не может быть пустым'),
  ),
  goal: v.optional(v.string()),
  result: v.optional(v.string()),
  additional: v.optional(v.string()),
  status: StatusSchema,
  lessonIds: v.array(
    v.pipe(v.string(), v.uuid('Некорректный формат UUID lessonIds')),
  ),
});

export type Project = v.InferOutput<typeof ProjectSchema>;

/** Единственная схема модуля (бывшая CourseCommonSchema + projects) */
export const ModuleSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid('Некорректный формат UUID')),
  /** Имя модуля: Основы js */
  title: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty('Заголовок не может быть пустым'),
  ),
  /** Описание модуля: Изучаем синтаксис языка js */
  description: v.pipe(
    v.string(),
    v.trim(),
    v.nonEmpty('Описание не может быть пустым'),
  ),
  authorId: v.pipe(v.string(), v.uuid('Некорректный формат UUID автора')),
  /** Для кого: Новички в программировании, кто хочет начать писать web приложения */
  targetAudience: v.optional(v.string()),
  /** Цель: - Изучать синтаксис языка; - научиться писать код; ... */
  goal: v.optional(v.string()),
  /** Результат: Вы будете уметь писать код, понимать чужой код, ... */
  result: v.optional(v.string()),
  /** Правила модуля: Будьте вежливы, трудитесь усердно. */
  rules: v.optional(v.string()),
  /** Дополнительно: Что нибудь дополнительное, например: Давайте сделаем это!. */
  additional: v.optional(v.string()),
  /** Теги: Веб, js, javascript. */
  tags: v.optional(v.array(v.string())),
  /** Статус модуля. */
  status: StatusSchema,
  /** Проекты модуля. */
  projects: v.array(ProjectSchema),
  createdAt: v.pipe(v.string(), v.isoDateTime('Некорректный формат даты')),
  updatedAt: v.optional(
    v.pipe(v.string(), v.isoDateTime('Некорректный формат даты')),
  ),
});

export type Module = v.InferOutput<typeof ModuleSchema>;

/** Метаданные агрегата Module */
export interface ModuleArMeta {
  name: 'Module';
  label: 'Модуль';
  state: Module;
}
