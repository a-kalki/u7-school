import * as v from "valibot";
import type { Course, CourseArMeta } from "../entity";
import { CourseCommonSchema } from "../entity";
import type {
	CourseAccessDeniedUcError,
	CourseNotFoundUcError,
} from "./errors";

/** Схема валидации команды создания курса — только базовые поля */
export const CreateCourseCmdSchema = v.object({
	title: CourseCommonSchema.entries.title,
	description: CourseCommonSchema.entries.description,
	kind: v.picklist(["modules", "projects"]),
});

/** Команда создания курса */
export type CreateCourseCmd = v.InferOutput<typeof CreateCourseCmdSchema>;

/** Мета команды создания курса */
export interface CreateCourseCmdMeta {
	ucName: "create-course";
	arMeta: CourseArMeta;
	input: CreateCourseCmd;
	output: Course;
	errors: CreateCourseCmdError;
	requiresAuth: true;
	type: "command";
}

/** Ошибки команды создания курса */
export type CreateCourseCmdError =
	| CourseAccessDeniedUcError
	| CourseNotFoundUcError;
