import type { QuestionnaireArMeta } from '../entity';
import { QuestionnaireSchema } from '../entity';
import type { QuestionnaireNotFoundUcError } from '../errors';
import type { QuestionnaireActionResponse } from '../types';
import * as v from 'valibot';

/** Схема команды получения текущего вопроса */
export const GetCurrentQuestionCmdSchema = v.object({
  telegramId: QuestionnaireSchema.entries.telegramId,
});

/** Команда получения текущего вопроса */
export type GetCurrentQuestionCmd = v.InferOutput<
  typeof GetCurrentQuestionCmdSchema
>;

/** Мета команды получения текущего вопроса */
export interface GetCurrentQuestionCmdMeta {
  ucName: 'get-current-question';
  arMeta: QuestionnaireArMeta;
  input: GetCurrentQuestionCmd;
  output: QuestionnaireActionResponse;
  errors: GetCurrentQuestionCmdError;
  /** Не требует авторизации — используется ботом */
  requiresAuth: false;
  type: 'query';
}

/** Ошибки команды получения текущего вопроса */
export type GetCurrentQuestionCmdError = QuestionnaireNotFoundUcError;
