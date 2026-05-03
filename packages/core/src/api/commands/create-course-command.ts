import * as v from "valibot";
import { CourseBaseSchema } from "../../domain/course/course";

/** Схема валидации команды создания курса */
export const CreateCourseCommandSchema = v.object({
	title: CourseBaseSchema.entries.title,
	description: CourseBaseSchema.entries.description,
	authorId: CourseBaseSchema.entries.authorId,
});

/** Команда создания курса */
export type CreateCourseCommand = v.InferOutput<
	typeof CreateCourseCommandSchema
>;
