import * as v from "valibot";
import type { Course, CourseArMeta } from "../entity";
import { CourseCommonSchema, ProjectSchema } from "../entity";
import type {
	CourseAccessDeniedUcError,
	CourseNotFoundUcError,
} from "./errors";

/** Схема валидации команды добавления проекта в курс */
export const AddProjectCmdSchema = v.object({
	courseId: CourseCommonSchema.entries.uuid,
	title: ProjectSchema.entries.title,
	goal: ProjectSchema.entries.goal,
	result: ProjectSchema.entries.result,
	additional: ProjectSchema.entries.additional,
});

/** Команда добавления проекта в курс */
export type AddProjectCmd = v.InferOutput<typeof AddProjectCmdSchema>;

/** Мета команды добавления проекта */
export interface AddProjectCmdMeta {
	ucName: "add-project";
	arMeta: CourseArMeta;
	input: AddProjectCmd;
	output: Course;
	errors: AddProjectCmdError;
	requiresAuth: true;
	type: "command";
}

/** Ошибки команды добавления проекта */
export type AddProjectCmdError =
	| CourseAccessDeniedUcError
	| CourseNotFoundUcError;
