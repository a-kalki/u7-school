import * as v from 'valibot';
import type { WishArMeta } from '../entity';
import { WishSchema } from '../entity';
import type { WishNotFoundUcError } from '../errors';

/** Схема команды отмены желания. */
export const CancelWishCmdSchema = v.object({
  courseId: WishSchema.entries.courseId,
});

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
