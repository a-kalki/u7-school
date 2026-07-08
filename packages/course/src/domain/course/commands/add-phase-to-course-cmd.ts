import * as v from 'valibot';
import type { Course, CourseArMeta } from '../entity';
import { CourseSchema, PhaseSchema } from '../entity';
import type {
  CourseAccessDeniedUcError,
  CourseNotFoundUcError,
} from './errors';

/** Схема команды добавления фазы в курс */
export const AddPhaseToCourseCmdSchema = v.object({
  courseId: CourseSchema.entries.uuid,
  title: PhaseSchema.entries.title,
  track: v.optional(v.string()),
});

/** Команда добавления фазы в курс */
export type AddPhaseToCourseCmd = v.InferOutput<
  typeof AddPhaseToCourseCmdSchema
>;

/** Мета команды добавления фазы в курс */
export interface AddPhaseToCourseCmdMeta {
  ucName: 'add-phase-to-course';
  arMeta: CourseArMeta;
  input: AddPhaseToCourseCmd;
  output: Course;
  errors: AddPhaseToCourseCmdError;
  requiresAuth: true;
  type: 'command';
}

/** Ошибки команды добавления фазы */
export type AddPhaseToCourseCmdError =
  | CourseAccessDeniedUcError
  | CourseNotFoundUcError;
