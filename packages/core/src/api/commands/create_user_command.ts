import * as v from "valibot";
import { Role } from "../../domain/user/roles";

/** Схема валидации команды создания пользователя */
export const CreateUserCommandSchema = v.object({
	name: v.pipe(v.string(), v.nonEmpty("Имя не может быть пустым")),
	telegramId: v.pipe(
		v.number(),
		v.integer("telegramId должен быть целым числом"),
		v.minValue(1, "telegramId должен быть положительным"),
	),
	role: v.pipe(
		v.string(),
		v.picklist(
			[Role.STUDENT, Role.MENTOR, Role.ADMIN],
			"Недопустимая роль",
		),
	),
});

/** Команда создания пользователя */
export type CreateUserCommand = v.InferOutput<typeof CreateUserCommandSchema>;
