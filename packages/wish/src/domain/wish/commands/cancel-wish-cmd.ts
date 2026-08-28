import { CourseSchema, ModuleSchema } from '@u7-scl/course/domain';
import * as v from 'valibot';
import type { WishArMeta } from '../entity';
import type { WishNotFoundUcError } from '../errors';

/**
 * Схема команды отмены желания.
 * Дискриминированный вариант по `kind` (зеркально WishTargetSchema):
 * цель отмены явна в команде.
 */
export const CancelWishCmdSchema = v.variant('kind', [
  v.object({ kind: v.literal('course'), courseId: CourseSchema.entries.uuid }),
  v.object({ kind: v.literal('module'), moduleId: ModuleSchema.entries.uuid }),
]);

/** Команда отмены желания. */
export type CancelWishCmd = v.InferOutput<typeof CancelWishCmdSchema>;

/** Мета команды отмены желания. */
export interface CancelWishCmdMeta {
  ucName: 'cancel-wish';
  arMeta: WishArMeta;
  input: CancelWishCmd;
  output: undefined;
  errors: CancelWishCmdError;
  requiresAuth: true;
  type: 'command';
}

/** Ошибки команды отмены желания. */
export type CancelWishCmdError = WishNotFoundUcError;
