import * as v from 'valibot';
import type { QuestionnaireArMeta } from '../entity';
import type { QuestionnaireActionResponse } from '../types';
import type { InternalUcError, QuestionnaireNotFoundUcError } from './errors';

export const GetCurrentCmdSchema = v.object({
  questionnaireId: v.pipe(v.string(), v.uuid()),
});

export type GetCurrentCmd = v.InferOutput<typeof GetCurrentCmdSchema>;

export interface GetCurrentCmdMeta {
  ucName: 'get-current';
  arMeta: QuestionnaireArMeta;
  input: GetCurrentCmd;
  output: QuestionnaireActionResponse;
  errors: GetCurrentCmdError;
  requiresAuth: false;
  type: 'query';
}

export type GetCurrentCmdError = InternalUcError | QuestionnaireNotFoundUcError;
