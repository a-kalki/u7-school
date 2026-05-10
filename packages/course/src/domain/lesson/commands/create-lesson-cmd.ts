import * as v from "valibot";
import type { Lesson, LessonArMeta } from "../entity";
import { LessonSchema } from "../entity";
import type { LessonAccessDeniedUcError } from "./errors";

/** Схема валидации команды создания урока */
export const CreateLessonCmdSchema = v.object({
  courseId: LessonSchema.entries.courseId,
  title: LessonSchema.entries.title,
  additional: LessonSchema.entries.additional,
  status: LessonSchema.entries.status,
  order: LessonSchema.entries.order,
  estimatedMinutes: LessonSchema.entries.estimatedMinutes,
  stepIds: LessonSchema.entries.stepIds,
  mentorStepIds: LessonSchema.entries.mentorStepIds,
});

/** Команда создания урока */
export type CreateLessonCmd = v.InferOutput<typeof CreateLessonCmdSchema>;

/** Мета команды создания урока */
export interface CreateLessonCmdMeta {
  commandName: "create-lesson";
  description: "Создать урок";
  arMeta: LessonArMeta;
  input: CreateLessonCmd;
  output: Lesson;
  errors: CreateLessonCmdError;
  requiresAuth: true;
  type: "command";
}

/** Ошибки команды создания урока */
export type CreateLessonCmdError = LessonAccessDeniedUcError;
