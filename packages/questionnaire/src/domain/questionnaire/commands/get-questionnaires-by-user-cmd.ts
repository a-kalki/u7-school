import * as v from 'valibot';
import type { Questionnaire, QuestionnaireArMeta } from '../entity';
import type { InternalUcError } from './errors';

export const GetQuestionnairesByUserCmdSchema = v.object({
  userId: v.pipe(v.number(), v.minValue(1)),
});

export type GetQuestionnairesByUserCmd = v.InferOutput<
  typeof GetQuestionnairesByUserCmdSchema
>;

export interface GetQuestionnairesByUserCmdMeta {
  ucName: 'get-questionnaires-by-user';
  arMeta: QuestionnaireArMeta;
  input: GetQuestionnairesByUserCmd;
  output: Questionnaire[];
  errors: GetQuestionnairesByUserCmdError;
  requiresAuth: false;
  type: 'query';
}

export type GetQuestionnairesByUserCmdError = InternalUcError;
