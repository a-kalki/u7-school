import * as v from "valibot";
import type { Step, StepArMeta } from "../entity";
import { StepCommonSchema } from "../entity";
import type { StepAccessDeniedUcError } from "./errors";

/** Схема валидации команды создания шага */
export const CreateStepCmdSchema = v.object({
  courseId: StepCommonSchema.entries.courseId,
  kind: v.picklist(["text", "code", "file"]),
  description: StepCommonSchema.entries.description,
  content: StepCommonSchema.entries.content,
  code: v.optional(v.string()),
  language: v.optional(v.string()),
  fileId: v.optional(v.string()),
  status: StepCommonSchema.entries.status,
  order: StepCommonSchema.entries.order,
});

/** Команда создания шага */
export type CreateStepCmd = v.InferOutput<typeof CreateStepCmdSchema>;

/** Мета команды создания шага */
export interface CreateStepCmdMeta {
  commandName: "create-step";
  description: "Создать шаг";
  arMeta: StepArMeta;
  input: CreateStepCmd;
  output: Step;
  errors: CreateStepCmdError;
  requiresAuth: true;
  type: "command";
}

/** Ошибки команды создания шага */
export type CreateStepCmdError = StepAccessDeniedUcError;
