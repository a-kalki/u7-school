import * as v from "valibot";
import type { User, UserArMeta } from "../entity";
import { UserSchema } from "../entity";
import type { TelegramIdTakenUcError } from "./errors";

/** Схема валидации команды регистрации пользователя */
export const RegisterUserCmdSchema = v.object({
	name: UserSchema.entries.name,
	telegramId: UserSchema.entries.telegramId,
});

/** Команда регистрации пользователя при первом /start в боте */
export type RegisterUserCmd = v.InferOutput<typeof RegisterUserCmdSchema>;

/** Мета команды регистрации пользователя */
export interface RegisterUserCmdMeta {
	ucName: "register-user";
	arMeta: UserArMeta;
	input: RegisterUserCmd;
	output: User;
	errors: RegisterUserCmdError;
	requiresAuth: false;
	type: "command";
}

/** Ошибки команды регистрации пользователя */
export type RegisterUserCmdError = TelegramIdTakenUcError;
