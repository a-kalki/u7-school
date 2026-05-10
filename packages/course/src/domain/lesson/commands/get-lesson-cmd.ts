import * as v from "valibot";
import type { Lesson, LessonArMeta } from "../entity";
import { LessonSchema } from "../entity";
import type { LessonNotFoundUcError } from "./errors";

/** Схема валидации команды получения урока */
export const GetLessonCmdSchema = v.object({
  uuid: LessonSchema.entries.uuid,
});

/** Команда получения урока */
export type GetLessonCmd = v.InferOutput<typeof GetLessonCmdSchema>;

/** Мета команды получения урока */
export interface GetLessonCmdMeta {
  commandName: "get-lesson";
  description: "Получить урок по UUID";
  arMeta: LessonArMeta;
  input: GetLessonCmd;
  output: Lesson;
  errors: GetLessonCmdError;
  requiresAuth: false;
  type: "query";
}

/** Ошибки команды получения урока */
export type GetLessonCmdError = LessonNotFoundUcError;
