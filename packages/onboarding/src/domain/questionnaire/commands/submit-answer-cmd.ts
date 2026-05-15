import * as v from 'valibot';
import type { Questionnaire, QuestionnaireArMeta } from '../entity';
import { QuestionnaireSchema } from '../entity';
import type {
  AccessDeniedUcError,
  QuestionnaireCompletedUcError,
  QuestionnaireNotFoundUcError,
  QuestionnaireValidationUcError,
} from '../errors';

/** Схема команды отправки ответа */
export const SubmitAnswerCmdSchema = v.object({
  questionnaireUuid: QuestionnaireSchema.entries.uuid,
  questionCode: v.pipe(
    v.string(),
    v.nonEmpty('Код вопроса не может быть пустым'),
  ),
  value: v.union([
    v.pipe(v.string(), v.nonEmpty('Ответ не может быть пустым')),
    v.array(v.pipe(v.string(), v.nonEmpty('Ответ не может быть пустым'))),
  ]),
});

/** Команда отправки ответа */
export type SubmitAnswerCmd = v.InferOutput<typeof SubmitAnswerCmdSchema>;

/** Мета команды отправки ответа */
export interface SubmitAnswerCmdMeta {
  ucName: 'submit-answer';
  arMeta: QuestionnaireArMeta;
  input: SubmitAnswerCmd;
  output: Questionnaire;
  errors: SubmitAnswerCmdError;
  requiresAuth: true;
  type: 'command';
}

/** Ошибки команды отправки ответа */
export type SubmitAnswerCmdError =
  | QuestionnaireNotFoundUcError
  | QuestionnaireValidationUcError
  | QuestionnaireCompletedUcError
  | AccessDeniedUcError;
