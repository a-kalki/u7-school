import * as v from 'valibot';
import type {
  ModuleAccessDeniedUcError,
  ModuleNotFoundUcError,
} from '../../module/commands/errors';
import type { Lesson, LessonArMeta } from '../entity';
import { LessonSchema } from '../entity';
import type { LessonAccessDeniedUcError } from './errors';

/** Схема валидации команды создания урока */
export const CreateLessonCmdSchema = v.object({
  moduleId: LessonSchema.entries.moduleId,
  projectId: v.pipe(v.string(), v.uuid('Некорректный формат UUID проекта')),
  title: LessonSchema.entries.title,
  additional: LessonSchema.entries.additional,
  estimatedMinutes: LessonSchema.entries.estimatedMinutes,
});

/** Команда создания урока */
export type CreateLessonCmd = v.InferOutput<typeof CreateLessonCmdSchema>;

/** Мета команды создания урока */
export interface CreateLessonCmdMeta {
  ucName: 'create-lesson';
  arMeta: LessonArMeta;
  input: CreateLessonCmd;
  output: Lesson;
  errors: CreateLessonCmdError;
  requiresAuth: true;
  type: 'command';
}

/** Ошибки команды создания урока */
export type CreateLessonCmdError =
  | LessonAccessDeniedUcError
  | ModuleAccessDeniedUcError
  | ModuleNotFoundUcError;
