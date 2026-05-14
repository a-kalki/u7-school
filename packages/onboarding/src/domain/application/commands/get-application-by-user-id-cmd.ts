import * as v from "valibot";
import type { Application, ApplicationArMeta } from "../entity";
import { ApplicationSchema } from "../entity";
import type { AccessDeniedUcError, ApplicationNotFoundUcError } from "./errors";

/** Схема команды получения заявки по userId */
export const GetApplicationByUserIdCmdSchema = v.object({
	userId: ApplicationSchema.entries.userId,
});

/** Команда получения заявки по userId */
export type GetApplicationByUserIdCmd = v.InferOutput<
	typeof GetApplicationByUserIdCmdSchema
>;

/** Мета команды получения заявки по userId */
export interface GetApplicationByUserIdCmdMeta {
	ucName: "get-application-by-user-id";
	arMeta: ApplicationArMeta;
	input: GetApplicationByUserIdCmd;
	output: Application;
	errors: GetApplicationByUserIdCmdError;
	requiresAuth: false;
	type: "query";
}

/** Ошибки команды получения заявки по userId */
export type GetApplicationByUserIdCmdError =
	| ApplicationNotFoundUcError
	| AccessDeniedUcError;
