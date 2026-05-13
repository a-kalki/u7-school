import * as v from "valibot";
import type { User, UserArMeta } from "#domain/user/entity";
import { UserSchema } from "#domain/user/entity";
import type { UserNotFoundUcError } from "./errors";

/** Схема валидации команды получения пользователя */
export const GetUserCmdSchema = v.object({
	uuid: UserSchema.entries.uuid,
});

/** Команда получения пользователя по UUID */
export type GetUserCmd = v.InferOutput<typeof GetUserCmdSchema>;

/** Мета команды получения пользователя */
export interface GetUserCmdMeta {
	ucName: "get-user";
	arMeta: UserArMeta;
	input: GetUserCmd;
	output: User;
	errors: GetUserCmdError;
	requiresAuth: false;
	type: "query";
}

/** Ошибки команды получения пользователя */
export type GetUserCmdError = UserNotFoundUcError;
