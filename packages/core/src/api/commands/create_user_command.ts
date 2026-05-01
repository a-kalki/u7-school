import * as v from "valibot";
import { UserSchema } from "../../domain/user/user";

/** Схема валидации команды создания пользователя */
export const CreateUserCommandSchema = v.object({
  name: UserSchema.entries.name,
  telegramId: UserSchema.entries.telegramId,
  role: UserSchema.entries.role,
});

/** Команда создания пользователя */
export type CreateUserCommand = v.InferOutput<typeof CreateUserCommandSchema>;
