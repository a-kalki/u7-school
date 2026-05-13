import * as v from "valibot";
import type { Course, CourseArMeta } from "../entity";
import { CourseCommonSchema, ModuleSchema } from "../entity";
import type {
	CourseAccessDeniedUcError,
	CourseNotFoundUcError,
} from "./errors";

/** Схема валидации команды добавления модуля в курс */
export const AddModuleCmdSchema = v.object({
	courseId: CourseCommonSchema.entries.uuid,
	title: ModuleSchema.entries.title,
	goal: ModuleSchema.entries.goal,
	result: ModuleSchema.entries.result,
	additional: ModuleSchema.entries.additional,
});

/** Команда добавления модуля в курс */
export type AddModuleCmd = v.InferOutput<typeof AddModuleCmdSchema>;

/** Мета команды добавления модуля */
export interface AddModuleCmdMeta {
	ucName: "add-module";
	arMeta: CourseArMeta;
	input: AddModuleCmd;
	output: Course;
	errors: AddModuleCmdError;
	requiresAuth: true;
	type: "command";
}

/** Ошибки команды добавления модуля */
export type AddModuleCmdError =
	| CourseAccessDeniedUcError
	| CourseNotFoundUcError;
