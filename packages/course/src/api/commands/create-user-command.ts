import * as v from "valibot";
import { UserSchema } from "@u7/user/domain";

/** Схема валидации команды создания пользователя */
export const CreateUserCommandSchema = v.object({
	name: UserSchema.entries.name,
	telegramId: UserSchema.entries.telegramId,
	roles: UserSchema.entries.roles,
});

/** Команда создания пользователя */
export type CreateUserCommand = v.InferOutput<typeof CreateUserCommandSchema>;
