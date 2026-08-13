import * as v from 'valibot';
import type { BaseQuestionnaireArMeta } from '../entity';
import type { QuestionnaireActionResponse } from '../types';
import type {
  AccessDeniedUcError,
  InternalUcError,
  QuestionnaireNotFoundUcError,
} from './errors';

export const GetCurrentCmdSchema = v.object({
  questionnaireId: v.pipe(v.string(), v.uuid()),
});

export type GetCurrentCmd = v.InferOutput<typeof GetCurrentCmdSchema>;

export interface GetCurrentCmdMeta {
  ucName: 'get-current';
  arMeta: BaseQuestionnaireArMeta;
  input: GetCurrentCmd;
  output: QuestionnaireActionResponse;
  errors: GetCurrentCmdError;
  requiresAuth: true;
  type: 'query';
}

export type GetCurrentCmdError =
  | InternalUcError
  | QuestionnaireNotFoundUcError
  | AccessDeniedUcError;
