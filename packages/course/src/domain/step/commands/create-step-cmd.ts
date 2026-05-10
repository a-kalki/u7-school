import * as v from "valibot";
import type { Step, StepArMeta } from "../entity";
import { StepSchema } from "../entity";
import type { StepAccessDeniedUcError } from "./errors";

/** Схема валидации команды создания шага */
export const CreateStepCmdSchema = v.object({
  courseId: StepSchema.entries.courseId,
  kind: StepSchema.entries.kind,
  description: StepSchema.entries.description,
  content: StepSchema.entries.content,
  code: v.optional(v.string()),
  language: v.optional(v.string()),
  fileId: v.optional(v.string()),
  status: StepSchema.entries.status,
  order: StepSchema.entries.order,
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
