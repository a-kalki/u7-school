import * as v from 'valibot';
import type { Questionnaire, QuestionnaireArMeta } from '../entity';
import { QuestionnaireSchema } from '../entity';
import type { QuestionnaireNotFoundUcError } from '../errors';

/** Схема команды прерывания анкеты */
export const AbandonQuestionnaireCmdSchema = v.object({
  uuid: QuestionnaireSchema.entries.uuid,
});

/** Команда прерывания анкеты */
export type AbandonQuestionnaireCmd = v.InferOutput<
  typeof AbandonQuestionnaireCmdSchema
>;

/** Мета команды прерывания анкеты */
export interface AbandonQuestionnaireCmdMeta {
  ucName: 'abandon-questionnaire';
  arMeta: QuestionnaireArMeta;
  input: AbandonQuestionnaireCmd;
  output: Questionnaire;
  errors: AbandonQuestionnaireCmdError;
  /** Не требует авторизации — используется ботом */
  requiresAuth: false;
  type: 'command';
}

/** Ошибки команды прерывания анкеты */
export type AbandonQuestionnaireCmdError = QuestionnaireNotFoundUcError;
