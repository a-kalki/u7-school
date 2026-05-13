import * as v from "valibot";
import type { Course, CourseArMeta } from "../entity";
import { CourseCommonSchema } from "../entity";
import type {
	CourseAccessDeniedUcError,
	CourseNotFoundUcError,
} from "./errors";

/** Схема валидации команды публикации курса */
export const PublishCourseCmdSchema = v.object({
	courseId: CourseCommonSchema.entries.uuid,
});

/** Команда публикации курса */
export type PublishCourseCmd = v.InferOutput<typeof PublishCourseCmdSchema>;

/** Мета команды публикации курса */
export interface PublishCourseCmdMeta {
	ucName: "publish-course";
	arMeta: CourseArMeta;
	input: PublishCourseCmd;
	output: Course;
	errors: PublishCourseCmdError;
	requiresAuth: true;
	type: "command";
}

/** Ошибки команды публикации курса */
export type PublishCourseCmdError =
	| CourseAccessDeniedUcError
	| CourseNotFoundUcError;
