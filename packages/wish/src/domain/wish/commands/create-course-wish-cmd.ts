import { CourseSchema } from '@u7-scl/course/domain';
import * as v from 'valibot';
import type { WishArMeta } from '../entity';
import type {
  CourseNotFoundUcError,
  WishAlreadyExistsUcError,
} from '../errors';

/** Схема команды создания желания пройти курс. */
export const CreateCourseWishCmdSchema = v.object({
  courseId: CourseSchema.entries.uuid,
});

/** Команда создания желания пройти курс. */
export type CreateCourseWishCmd = v.InferOutput<
  typeof CreateCourseWishCmdSchema
>;

/** Схема результата создания желания пройти курс. */
export const CreateCourseWishOutputSchema = v.object({
  outcome: v.picklist(['instant', 'questionnaire']),
});

/** Результат создания желания пройти курс. */
export type CreateCourseWishOutput = v.InferOutput<
  typeof CreateCourseWishOutputSchema
>;

/** Мета команды создания желания пройти курс. */
export interface CreateCourseWishCmdMeta {
  ucName: 'create-course-wish';
  arMeta: WishArMeta;
  input: CreateCourseWishCmd;
  output: CreateCourseWishOutput;
  errors: CreateCourseWishCmdError;
  requiresAuth: true;
  type: 'command';
}

/** Ошибки команды создания желания пройти курс. */
export type CreateCourseWishCmdError =
  | CourseNotFoundUcError
  | WishAlreadyExistsUcError;
