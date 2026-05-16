import * as v from 'valibot';
import type { QuestionnaireArMeta } from '../entity';
import { QuestionnaireSchema } from '../entity';
import type { BadRequestUcError, InternalUcError } from '../errors';
import type { QuestionnaireActionResponse } from '../types';

/** Схема команды */
export const HandleOnboardingActionCmdSchema = v.object({
  telegramId: QuestionnaireSchema.entries.telegramId,
  type: v.picklist(['callback', 'text']),
  value: v.pipe(v.string(), v.nonEmpty()),
});

export type HandleOnboardingActionCmd = v.InferOutput<
  typeof HandleOnboardingActionCmdSchema
>;

/** Мета команды */
export interface HandleOnboardingActionCmdMeta {
  ucName: 'handle-action';
  arMeta: QuestionnaireArMeta;
  input: HandleOnboardingActionCmd;
  output: QuestionnaireActionResponse;
  errors: HandleOnboardingActionCmdError;
  /** Не требует авторизации — используется ботом */
  requiresAuth: false;
  type: 'command';
}

/** Ошибки команды обработки действия */
export type HandleOnboardingActionCmdError =
  | BadRequestUcError
  | InternalUcError;
