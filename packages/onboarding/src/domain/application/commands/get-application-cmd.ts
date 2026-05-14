import * as v from "valibot";
import type { Application, ApplicationArMeta } from "../entity";
import { ApplicationSchema } from "../entity";
import type { AccessDeniedUcError, ApplicationNotFoundUcError } from "./errors";

/** Схема команды получения заявки */
export const GetApplicationCmdSchema = v.object({
  uuid: ApplicationSchema.entries.uuid,
});

/** Команда получения заявки */
export type GetApplicationCmd = v.InferOutput<typeof GetApplicationCmdSchema>;

/** Мета команды получения заявки */
export interface GetApplicationCmdMeta {
  ucName: "get-application";
  arMeta: ApplicationArMeta;
  input: GetApplicationCmd;
  output: Application;
  errors: GetApplicationCmdError;
  requiresAuth: false;
  type: "query";
}

/** Ошибки команды получения заявки */
export type GetApplicationCmdError =
  | ApplicationNotFoundUcError
  | AccessDeniedUcError;
