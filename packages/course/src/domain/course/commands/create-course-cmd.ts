import * as v from "valibot";
import type { Course, CourseArMeta } from "../entity";
import { CourseCommonSchema, ModuleSchema, ProjectSchema } from "../entity";
import type { CourseAccessDeniedUcError } from "./errors";

/** Схема валидации команды создания курса */
export const CreateCourseCmdSchema = v.object({
	title: CourseCommonSchema.entries.title,
	description: CourseCommonSchema.entries.description,
	kind: v.picklist(["modules", "projects"]),
	targetAudience: CourseCommonSchema.entries.targetAudience,
	goal: CourseCommonSchema.entries.goal,
	result: CourseCommonSchema.entries.result,
	rules: CourseCommonSchema.entries.rules,
	additional: CourseCommonSchema.entries.additional,
	tags: CourseCommonSchema.entries.tags,
	status: CourseCommonSchema.entries.status,
	modules: v.optional(v.array(ModuleSchema)),
	projects: v.optional(v.array(ProjectSchema)),
});

/** Команда создания курса */
export type CreateCourseCmd = v.InferOutput<typeof CreateCourseCmdSchema>;

/** Мета команды создания курса */
export interface CreateCourseCmdMeta {
	commandName: "create-course";
	description: "Создать курс";
	arMeta: CourseArMeta;
	input: CreateCourseCmd;
	output: Course;
	errors: CreateCourseCmdError;
	requiresAuth: true;
	type: "command";
}

/** Ошибки команды создания курса */
export type CreateCourseCmdError = CourseAccessDeniedUcError;
