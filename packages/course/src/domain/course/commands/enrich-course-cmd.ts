import * as v from "valibot";
import type { Course, CourseArMeta } from "../entity";
import { CourseCommonSchema } from "../entity";
import type {
	CourseAccessDeniedUcError,
	CourseNotFoundUcError,
} from "./errors";

/** Схема валидации команды обогащения курса */
export const EnrichCourseCmdSchema = v.object({
	courseId: CourseCommonSchema.entries.uuid,
	targetAudience: CourseCommonSchema.entries.targetAudience,
	goal: CourseCommonSchema.entries.goal,
	result: CourseCommonSchema.entries.result,
	rules: CourseCommonSchema.entries.rules,
	additional: CourseCommonSchema.entries.additional,
	tags: CourseCommonSchema.entries.tags,
});

/** Команда обогащения курса */
export type EnrichCourseCmd = v.InferOutput<typeof EnrichCourseCmdSchema>;

/** Мета команды обогащения курса */
export interface EnrichCourseCmdMeta {
	ucName: "enrich-course";
	arMeta: CourseArMeta;
	input: EnrichCourseCmd;
	output: Course;
	errors: EnrichCourseCmdError;
	requiresAuth: true;
	type: "command";
}

/** Ошибки команды обогащения курса */
export type EnrichCourseCmdError =
	| CourseAccessDeniedUcError
	| CourseNotFoundUcError;
