import * as v from "valibot";
import { ApplicationAnswersSchema } from "./answers";
import { ApplicationStatus } from "./status";

/** Схема заявки кандидата */
export const ApplicationSchema = v.object({
	uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
	userId: v.pipe(v.string(), v.uuid("Некорректный формат UUID пользователя")),
	status: v.picklist(Object.values(ApplicationStatus)),
	answers: ApplicationAnswersSchema,
	createdAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
	submittedAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
	updatedAt: v.optional(
		v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
	),
});

/** Заявка кандидата */
export type Application = v.InferOutput<typeof ApplicationSchema>;

/** Метаданные агрегата заявки */
export interface ApplicationArMeta {
	name: "Application";
	label: "Заявка";
	errors: never;
	state: Application;
}
