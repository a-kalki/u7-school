import * as v from 'valibot';
import type { QuestionnaireArMeta } from '../entity';
import { QuestionnairePoolSchema } from '../question';
import type { BadRequestUcError, InternalUcError } from './errors';

export const StartCmdSchema = v.object({
  pool: QuestionnairePoolSchema,
});

export type StartCmd = v.InferOutput<typeof StartCmdSchema>;

export interface StartCmdMeta {
  ucName: 'start';
  arMeta: QuestionnaireArMeta;
  input: StartCmd;
  output: undefined;
  errors: StartCmdError;
  requiresAuth: true;
  type: 'command';
}

export type StartCmdError = BadRequestUcError | InternalUcError;
