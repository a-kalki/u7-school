import { CourseSchema } from '@u7-scl/course/domain';
import * as v from 'valibot';
import type { WishArMeta } from '../entity';
import type {
  CourseNotFoundUcError,
  WishAlreadyExistsUcError,
} from '../errors';

/** Схема команды выражения желания. */
export const ExpressWishCmdSchema = v.object({
  courseId: CourseSchema.entries.uuid,
});

/** Команда выражения желания. */
export type ExpressWishCmd = v.InferOutput<typeof ExpressWishCmdSchema>;

/** Схема результата выражения желания. */
export const ExpressWishOutputSchema = v.object({
  outcome: v.picklist(['instant', 'questionnaire']),
});

/** Результат выражения желания. */
export type ExpressWishOutput = v.InferOutput<typeof ExpressWishOutputSchema>;

/** Мета команды выражения желания. */
export interface ExpressWishCmdMeta {
  ucName: 'express-wish';
  arMeta: WishArMeta;
  input: ExpressWishCmd;
  output: ExpressWishOutput;
  errors: ExpressWishCmdError;
  requiresAuth: true;
  type: 'command';
}

/** Ошибки команды выражения желания. */
export type ExpressWishCmdError =
  | CourseNotFoundUcError
  | WishAlreadyExistsUcError;
