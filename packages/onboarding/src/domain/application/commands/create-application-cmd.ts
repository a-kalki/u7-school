import * as v from "valibot";
import { ApplicationAnswersSchema } from "../answers";
import type { Application, ApplicationArMeta } from "../entity";
import { ApplicationSchema } from "../entity";
import type {
	AccessDeniedUcError,
	ApplicationAlreadyExistsUcError,
} from "./errors";

/** Схема команды создания заявки */
export const CreateApplicationCmdSchema = v.object({
	userId: ApplicationSchema.entries.userId,
	answers: ApplicationAnswersSchema,
});

/** Команда создания заявки */
export type CreateApplicationCmd = v.InferOutput<
	typeof CreateApplicationCmdSchema
>;

/** Мета команды создания заявки */
export interface CreateApplicationCmdMeta {
	ucName: "create-application";
	arMeta: ApplicationArMeta;
	input: CreateApplicationCmd;
	output: Application;
	errors: CreateApplicationCmdError;
	requiresAuth: true;
	type: "command";
}

/** Ошибки команды создания заявки */
export type CreateApplicationCmdError =
	| ApplicationAlreadyExistsUcError
	| AccessDeniedUcError;
