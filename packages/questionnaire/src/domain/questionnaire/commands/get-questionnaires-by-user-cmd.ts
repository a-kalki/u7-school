import * as v from 'valibot';
import type { BaseQuestionnaireArMeta, Questionnaire } from '../entity';
import type { AccessDeniedUcError, InternalUcError } from './errors';

export const GetQuestionnairesByUserCmdSchema = v.object({
  userId: v.pipe(v.string(), v.uuid()),
});

export type GetQuestionnairesByUserCmd = v.InferOutput<
  typeof GetQuestionnairesByUserCmdSchema
>;

export interface GetQuestionnairesByUserCmdMeta {
  ucName: 'get-questionnaires-by-user';
  arMeta: BaseQuestionnaireArMeta;
  input: GetQuestionnairesByUserCmd;
  output: Questionnaire[];
  errors: GetQuestionnairesByUserCmdError;
  requiresAuth: true;
  type: 'query';
}

export type GetQuestionnairesByUserCmdError =
  | InternalUcError
  | AccessDeniedUcError;
