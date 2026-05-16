import * as v from 'valibot';
import type { Questionnaire, QuestionnaireArMeta } from '../entity';
import { QuestionnaireSchema } from '../entity';
import type { QuestionnaireActiveUcError } from '../errors';

/** Схема команды начала анкеты */
export const StartQuestionnaireCmdSchema = v.object({
  telegramId: QuestionnaireSchema.entries.telegramId,
});

/** Команда начала анкеты */
export type StartQuestionnaireCmd = v.InferOutput<
  typeof StartQuestionnaireCmdSchema
>;

/** Мета команды начала анкеты */
export interface StartQuestionnaireCmdMeta {
  ucName: 'start';
  arMeta: QuestionnaireArMeta;
  input: StartQuestionnaireCmd;
  output: Questionnaire;
  errors: StartQuestionnaireCmdError;
  /** Не требует авторизации — используется ботом */
  requiresAuth: false;
  type: 'command';
}

/** Ошибки команды начала анкеты */
export type StartQuestionnaireCmdError = QuestionnaireActiveUcError;
