import * as v from 'valibot';
import type { QuestionnaireArMeta } from '../entity';
import { QuestionnaireSchema } from '../entity';
import type { BadRequestUcError } from '../errors';
import type { QuestionnaireActionResponse } from '../types';

/** Схема команды прерывания анкеты */
export const AbandonQuestionnaireCmdSchema = v.object({
  telegramId: QuestionnaireSchema.entries.telegramId,
});

/** Команда прерывания анкеты */
export type AbandonQuestionnaireCmd = v.InferOutput<
  typeof AbandonQuestionnaireCmdSchema
>;

/** Мета команды прерывания анкеты */
export interface AbandonQuestionnaireCmdMeta {
  ucName: 'abandon';
  arMeta: QuestionnaireArMeta;
  input: AbandonQuestionnaireCmd;
  output: QuestionnaireActionResponse;
  errors: AbandonQuestionnaireCmdError;
  /** Не требует авторизации — используется ботом */
  requiresAuth: false;
  type: 'command';
}

/** Ошибки команды прерывания анкеты */
export type AbandonQuestionnaireCmdError = BadRequestUcError;
