import * as v from "valibot";
import { LessonSchema } from "../lesson/lesson";
import { StatusSchema } from "../shared/status";

export const ProjectSchema = v.object({
	uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
	title: v.pipe(
		v.string(),
		v.nonEmpty("Название проекта не может быть пустым"),
	),
	goal: v.optional(v.string()),
	result: v.optional(v.string()),
	additional: v.optional(v.string()),
	status: StatusSchema,
	order: v.pipe(v.number(), v.integer(), v.minValue(0)),
	createdAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
	updatedAt: v.optional(
		v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
	),
	/** Уроки проекта (обязательно, может быть пустым) */
	lessons: v.array(LessonSchema),
});

export type Project = v.InferOutput<typeof ProjectSchema>;
