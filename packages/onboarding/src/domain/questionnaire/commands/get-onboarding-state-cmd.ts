import * as v from 'valibot';
import type { QuestionnaireArMeta } from '../entity';
import { QuestionnaireSchema } from '../entity';
import type { Question } from '../question';
import { QuestionSchema } from '../question';

import type { QuestionnaireNotFoundUcError } from '../errors';

/** Схема команды получения состояния онбординга */
export const GetOnboardingStateCmdSchema = v.object({
  telegramId: QuestionnaireSchema.entries.telegramId,
});

/** Команда получения состояния онбординга */
export type GetOnboardingStateCmd = v.InferOutput<typeof GetOnboardingStateCmdSchema>;

export const OnboardingStateSchema = v.union([
  v.object({
    status: v.literal('none_active'),
    completedCount: v.number(),
  }),
  v.object({
    status: v.literal('in_progress'),
    questionnaireUuid: v.string(),
    question: QuestionSchema,
    draftAnswers: v.array(v.string()),
  }),
]);

export type OnboardingState = v.InferOutput<typeof OnboardingStateSchema>;

/** Мета команды получения состояния онбординга */
export interface GetOnboardingStateCmdMeta {
  ucName: 'get-onboarding-state';
  arMeta: QuestionnaireArMeta;
  input: GetOnboardingStateCmd;
  output: OnboardingState;
  errors: QuestionnaireNotFoundUcError;
  requiresAuth: false;
  type: 'query';
}
