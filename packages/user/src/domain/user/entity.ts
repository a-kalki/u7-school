import * as v from "valibot";
import { RoleSchema } from "./roles";

/** Схема пользователя с поддержкой нескольких ролей */
export const UserSchema = v.object({
	uuid: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
	name: v.pipe(v.string(), v.trim(), v.nonEmpty("Имя не может быть пустым")),
	telegramId: v.pipe(
		v.number(),
		v.integer("telegramId должен быть целым числом"),
		v.minValue(1, "telegramId должен быть положительным"),
	),
	roles: v.pipe(
		v.array(RoleSchema),
		v.minLength(1, "Пользователь должен иметь хотя бы одну роль"),
	),
	createdAt: v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
	updatedAt: v.optional(
		v.pipe(v.string(), v.isoDateTime("Некорректный формат даты")),
	),
});

export type User = v.InferOutput<typeof UserSchema>;

/** Метаданные агрегата пользователя */
export interface UserArMeta {
	name: "User";
	label: "Пользователь";
	errors: never;
	state: User;
}
