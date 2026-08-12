import * as v from 'valibot';
import type { Questionnaire, QuestionnaireArMeta } from '../entity';
import type {
  AccessDeniedUcError,
  InternalUcError,
  QuestionnaireNotFoundUcError,
} from './errors';

export const GetQuestionnaireCmdSchema = v.object({
  uuid: v.pipe(v.string(), v.uuid()),
});

export type GetQuestionnaireCmd = v.InferOutput<
  typeof GetQuestionnaireCmdSchema
>;

export interface GetQuestionnaireCmdMeta {
  ucName: 'get-questionnaire';
  arMeta: QuestionnaireArMeta;
  input: GetQuestionnaireCmd;
  output: Questionnaire;
  errors: GetQuestionnaireCmdError;
  requiresAuth: true;
  type: 'query';
}

export type GetQuestionnaireCmdError =
  | InternalUcError
  | QuestionnaireNotFoundUcError
  | AccessDeniedUcError;
