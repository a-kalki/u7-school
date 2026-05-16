import * as v from 'valibot';
import type { QuestionnaireArMeta } from '../entity';
import { QuestionnaireSchema } from '../entity';
import type { QuestionnaireActionResponse } from '../types';

/** Схема команды */
export const HandleOnboardingActionCmdSchema = v.object({
  telegramId: QuestionnaireSchema.entries.telegramId,
  questionCode: v.pipe(v.string(), v.nonEmpty()),
  value: v.union([v.string(), v.array(v.string()), v.literal('NEXT')]),
});

export type HandleOnboardingActionCmd = v.InferOutput<
  typeof HandleOnboardingActionCmdSchema
>;

/** Мета команды */
export interface HandleOnboardingActionCmdMeta {
  ucName: 'handle-onboarding-action';
  arMeta: QuestionnaireArMeta;
  input: HandleOnboardingActionCmd;
  output: QuestionnaireActionResponse;
  errors: never;
  /** Не требует авторизации — используется ботом */
  requiresAuth: false;
  type: 'command';
}
