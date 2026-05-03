import * as v from "valibot";

// TODO: нужно чтобы поддерживало несколько ролей
export const UserSchema = v.object({
	uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
	name: v.pipe(v.string(), v.nonEmpty("Имя не может быть пустым")),
	telegramId: v.pipe(
		v.number(),
		v.integer("telegramId должен быть целым числом"),
		v.minValue(1, "telegramId должен быть положительным"),
	),
	role: v.pipe(
		v.string(),
		v.picklist(
			["STUDENT", "MENTOR", "ADMIN"],
			"Недопустимая роль. Ожидается: STUDENT, MENTOR или ADMIN",
		),
	),
	createdAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
	updatedAt: v.optional(
		v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
	),
});

export type User = v.InferOutput<typeof UserSchema>;
