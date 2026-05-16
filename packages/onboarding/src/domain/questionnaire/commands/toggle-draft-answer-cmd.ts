import * as v from 'valibot';
import type { Questionnaire, QuestionnaireArMeta } from '../entity';
import { QuestionnaireSchema } from '../entity';
import type {
  QuestionnaireNotFoundUcError,
  QuestionnaireCompletedUcError,
} from '../errors';

/** Схема команды переключения чернового ответа */
export const ToggleDraftAnswerCmdSchema = v.object({
  questionnaireUuid: QuestionnaireSchema.entries.uuid,
  questionCode: v.pipe(
    v.string(),
    v.nonEmpty('Код вопроса не может быть пустым'),
  ),
  answerCode: v.pipe(
    v.string(),
    v.nonEmpty('Код ответа не может быть пустым'),
  ),
});

/** Команда переключения чернового ответа */
export type ToggleDraftAnswerCmd = v.InferOutput<typeof ToggleDraftAnswerCmdSchema>;

/** Мета команды переключения чернового ответа */
export interface ToggleDraftAnswerCmdMeta {
  ucName: 'toggle-draft-answer';
  arMeta: QuestionnaireArMeta;
  input: ToggleDraftAnswerCmd;
  output: Questionnaire;
  errors: ToggleDraftAnswerCmdError;
  requiresAuth: false;
  type: 'command';
}

/** Ошибки команды переключения чернового ответа */
export type ToggleDraftAnswerCmdError =
  | QuestionnaireNotFoundUcError
  | QuestionnaireCompletedUcError;
