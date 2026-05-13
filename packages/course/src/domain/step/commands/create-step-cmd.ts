import * as v from "valibot";
import type {
	CourseAccessDeniedUcError,
	CourseNotFoundUcError,
} from "../../course/commands/errors";
import type { LessonNotFoundUcError } from "../../lesson/commands/errors";
import type { Step, StepArMeta } from "../entity";
import { StepCommonSchema } from "../entity";
import type { StepAccessDeniedUcError } from "./errors";

/** Схема валидации команды создания шага */
export const CreateStepCmdSchema = v.object({
	courseId: StepCommonSchema.entries.courseId,
	lessonId: v.pipe(v.string(), v.uuid("Некорректный формат UUID")),
	description: StepCommonSchema.entries.description,
	kind: v.picklist(["text", "code", "file"]),
	content: StepCommonSchema.entries.content,
	code: v.optional(v.string()),
	language: v.optional(v.string()),
	fileName: v.optional(v.string()),
	fileMimeType: v.optional(v.string()),
	fileSize: v.optional(v.number()),
	fileDescription: v.optional(v.string()),
});

/** Команда создания шага */
export type CreateStepCmd = v.InferOutput<typeof CreateStepCmdSchema>;

/** Мета команды создания шага */
export interface CreateStepCmdMeta {
	ucName: "create-step";
	arMeta: StepArMeta;
	input: CreateStepCmd;
	output: Step;
	errors: CreateStepCmdError;
	requiresAuth: true;
	type: "command";
}

/** Ошибки команды создания шага */
export type CreateStepCmdError =
	| StepAccessDeniedUcError
	| CourseAccessDeniedUcError
	| CourseNotFoundUcError
	| LessonNotFoundUcError;
