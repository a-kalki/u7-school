import * as v from "valibot";
import type { Application, ApplicationArMeta } from "../entity";
import type { AccessDeniedUcError } from "./errors";

/** Схема команды списка заявок */
export const ListApplicationsCmdSchema = v.object({
	status: v.optional(v.string()),
	limit: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1))),
	sort: v.optional(v.string()),
});

/** Команда списка заявок */
export type ListApplicationsCmd = v.InferOutput<
	typeof ListApplicationsCmdSchema
>;

/** Мета команды списка заявок */
export interface ListApplicationsCmdMeta {
	ucName: "list-applications";
	arMeta: ApplicationArMeta;
	input: ListApplicationsCmd;
	output: Application[];
	errors: ListApplicationsCmdError;
	requiresAuth: true;
	type: "query";
}

/** Ошибки команды списка заявок */
export type ListApplicationsCmdError = AccessDeniedUcError;
