import * as v from 'valibot';
import type { Questionnaire, QuestionnaireArMeta } from '../entity';
import { QuestionnaireSchema } from '../entity';
import type {
  AccessDeniedUcError,
  QuestionnaireNotFoundUcError,
} from '../errors';

/** Схема команды получения анкеты */
export const GetQuestionnaireCmdSchema = v.object({
  uuid: QuestionnaireSchema.entries.uuid,
});

/** Команда получения анкеты */
export type GetQuestionnaireCmd = v.InferOutput<
  typeof GetQuestionnaireCmdSchema
>;

/** Мета команды получения анкеты */
export interface GetQuestionnaireCmdMeta {
  ucName: 'get-questionnaire';
  arMeta: QuestionnaireArMeta;
  input: GetQuestionnaireCmd;
  output: Questionnaire;
  errors: GetQuestionnaireCmdError;
  requiresAuth: true;
  type: 'query';
}

/** Ошибки команды получения анкеты */
export type GetQuestionnaireCmdError =
  | QuestionnaireNotFoundUcError
  | AccessDeniedUcError;
