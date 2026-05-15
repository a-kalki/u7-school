import * as v from 'valibot';
import type { Step, StepArMeta } from '../entity';
import { StepCommonSchema } from '../entity';
import type { StepNotFoundUcError } from './errors';

/** Схема валидации команды получения шага */
export const GetStepCmdSchema = v.object({
  uuid: StepCommonSchema.entries.uuid,
});

/** Команда получения шага */
export type GetStepCmd = v.InferOutput<typeof GetStepCmdSchema>;

/** Мета команды получения шага */
export interface GetStepCmdMeta {
  ucName: 'get-step';
  arMeta: StepArMeta;
  input: GetStepCmd;
  output: Step;
  errors: GetStepCmdError;
  requiresAuth: false;
  type: 'query';
}

/** Ошибки команды получения шага */
export type GetStepCmdError = StepNotFoundUcError;
