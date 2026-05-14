import * as v from "valibot";
import { ApplicationAnswersSchema } from "../answers";
import type { Application, ApplicationArMeta } from "../entity";
import { ApplicationSchema } from "../entity";
import type { AccessDeniedUcError, ApplicationNotFoundUcError } from "./errors";

/** Схема команды обновления заявки (частичное изменение ответов) */
export const UpdateApplicationCmdSchema = v.object({
	uuid: ApplicationSchema.entries.uuid,
	answers: ApplicationAnswersSchema,
});

/** Команда обновления заявки */
export type UpdateApplicationCmd = v.InferOutput<
	typeof UpdateApplicationCmdSchema
>;

/** Мета команды обновления заявки */
export interface UpdateApplicationCmdMeta {
	ucName: "update-application";
	arMeta: ApplicationArMeta;
	input: UpdateApplicationCmd;
	output: Application;
	errors: UpdateApplicationCmdError;
	requiresAuth: true;
	type: "command";
}

/** Ошибки команды обновления заявки */
export type UpdateApplicationCmdError =
	| ApplicationNotFoundUcError
	| AccessDeniedUcError;
