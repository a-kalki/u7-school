import * as v from "valibot";
import { StatusSchema } from "../status";

/** Схема модуля (value-object внутри Course) */
export const ModuleSchema = v.object({
	uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID модуля")),
	title: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty("Заголовок модуля не может быть пустым"),
	),
	goal: v.optional(v.string()),
	result: v.optional(v.string()),
	additional: v.optional(v.string()),
	status: StatusSchema,
	projects: v.array(v.lazy(() => ProjectSchema)),
});

export type Module = v.InferOutput<typeof ModuleSchema>;

/** Схема проекта (value-object внутри Course) */
export const ProjectSchema = v.object({
	uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID проекта")),
	title: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty("Заголовок проекта не может быть пустым"),
	),
	goal: v.optional(v.string()),
	result: v.optional(v.string()),
	additional: v.optional(v.string()),
	status: StatusSchema,
	lessonIds: v.array(
		v.pipe(v.string(), v.uuid("Некорректный формат UUID lessonIds")),
	),
});

export type Project = v.InferOutput<typeof ProjectSchema>;

/** Общие поля курса */
export const CourseCommonSchema = v.object({
	uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
	/** Имя курса: Основы js */
	title: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty("Заголовок не может быть пустым"),
	),
	/** Описание курса: Изучаем синтаксис языка js */
	description: v.pipe(
		v.string(),
		v.trim(),
		v.nonEmpty("Описание не может быть пустым"),
	),
	authorId: v.pipe(v.string(), v.uuid("Некорректный формат UUID автора")),
	/** Для кого: Новички в программировании, кто хочет начать писать web приложения */
	targetAudience: v.optional(v.string()),
	/** Цель: - Изучать синтаксис языка; - научиться писать код; - научиться понимать код; - научиться понимать как кода будет выполняться; */
	goal: v.optional(v.string()),
	/** Результат: Вы будете уметь писать код, понимать чужой код, переводить задачи с человеческого языка в код; */
	result: v.optional(v.string()),
	/** Правила курсов: Будьте вежливы, трудитесь усердно. */
	rules: v.optional(v.string()),
	/** Дополнительно: Что нибудь дополнительное, например: Давайте сделаем это!. */
	additional: v.optional(v.string()),
	/** Теги: Веб, js, javascript. */
	tags: v.optional(v.array(v.string())),
	/** Статус: Статус курса. */
	status: StatusSchema,
	createdAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
	updatedAt: v.optional(
		v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
	),
});

/** Вариант modules — курс с модулями */
const ModulesCourseSchema = v.object({
	...CourseCommonSchema.entries,
	kind: v.literal("modules"),
	modules: v.array(ModuleSchema),
});

/** Вариант projects — курс с проектами */
const ProjectsCourseSchema = v.object({
	...CourseCommonSchema.entries,
	kind: v.literal("projects"),
	projects: v.array(ProjectSchema),
});

/** Схема валидации курса (discriminated union по kind) */
export const CourseSchema = v.variant("kind", [
	ModulesCourseSchema,
	ProjectsCourseSchema,
]);

export type Course = v.InferOutput<typeof CourseSchema>;
export type CourseModules = v.InferOutput<typeof ModulesCourseSchema>;
export type CourseProjects = v.InferOutput<typeof ProjectsCourseSchema>;

/** Метаданные агрегата Course */
export interface CourseArMeta {
	name: "Course";
	label: "Курс";
	state: Course;
}
