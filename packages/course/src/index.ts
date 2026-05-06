// Пользователи

export type {
	Course,
	CourseWithModules,
	CourseWithProjects,
} from "./domain/course/course";
// Курс
export { CourseSchema } from "./domain/course/course";
export type { FileMetadata } from "./domain/lesson/file";
// Файл
export { FileMetadataSchema } from "./domain/lesson/file";
export type { Lesson } from "./domain/lesson/lesson";
// Урок
export { LessonSchema } from "./domain/lesson/lesson";
export type { CodeStep, FileStep, Step, TextStep } from "./domain/lesson/step";
// Шаг
export { StepSchema } from "./domain/lesson/step";
export type { Module } from "./domain/module/module";
// Модуль
export { ModuleSchema } from "./domain/module/module";
export type { Project } from "./domain/project/project";
// Проект
export { ProjectSchema } from "./domain/project/project";
// Статусы
export { Status, StatusSchema } from "./domain/shared/status";
// Auth module exports migrated to @u7/user
