import * as v from 'valibot';
import type { Questionnaire, QuestionnaireArMeta } from '../entity';
import { QuestionnaireSchema } from '../entity';
import type { AccessDeniedUcError } from '../errors';

/** Схема команды списка анкет пользователя */
export const ListQuestionnairesByTelegramIdCmdSchema = v.object({
  telegramId: QuestionnaireSchema.entries.telegramId,
});

/** Команда списка анкет пользователя */
export type ListQuestionnairesByTelegramIdCmd = v.InferOutput<
  typeof ListQuestionnairesByTelegramIdCmdSchema
>;

/** Мета команды списка анкет пользователя */
export interface ListQuestionnairesByTelegramIdCmdMeta {
  ucName: 'list-questionnaires-by-telegram-id';
  arMeta: QuestionnaireArMeta;
  input: ListQuestionnairesByTelegramIdCmd;
  output: Questionnaire[];
  errors: ListQuestionnairesByTelegramIdCmdError;
  requiresAuth: false;
  type: 'query';
}

/** Ошибки команды списка анкет пользователя */
export type ListQuestionnairesByTelegramIdCmdError = never;
