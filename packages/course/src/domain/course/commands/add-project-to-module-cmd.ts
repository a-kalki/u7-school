import * as v from "valibot";
import type { Course, CourseArMeta } from "../entity";
import { CourseCommonSchema, ProjectSchema } from "../entity";
import type {
	CourseAccessDeniedUcError,
	CourseNotFoundUcError,
} from "./errors";

/** Схема валидации команды добавления проекта в модуль курса */
export const AddProjectToModuleCmdSchema = v.object({
	courseId: CourseCommonSchema.entries.uuid,
	moduleUuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID модуля")),
	title: ProjectSchema.entries.title,
	goal: ProjectSchema.entries.goal,
	result: ProjectSchema.entries.result,
	additional: ProjectSchema.entries.additional,
});

/** Команда добавления проекта в модуль */
export type AddProjectToModuleCmd = v.InferOutput<
	typeof AddProjectToModuleCmdSchema
>;

/** Мета команды добавления проекта в модуль */
export interface AddProjectToModuleCmdMeta {
	ucName: "add-project-to-module";
	arMeta: CourseArMeta;
	input: AddProjectToModuleCmd;
	output: Course;
	errors: AddProjectToModuleCmdError;
	requiresAuth: true;
	type: "command";
}

/** Ошибки команды добавления проекта в модуль */
export type AddProjectToModuleCmdError =
	| CourseAccessDeniedUcError
	| CourseNotFoundUcError;
