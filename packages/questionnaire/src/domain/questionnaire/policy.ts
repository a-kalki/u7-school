import { type User, UserPolicy } from '@u7-scl/user/domain';
import type { QuestionnaireState } from './repo';

/**
 * Политика доступа к анкетам.
 */
export const QuestionnairePolicy = {
  /** Может ли пользователь начать анкету */
  canStart(actor: User, targetRespondentId: string): boolean {
    return actor.uuid === targetRespondentId;
  },

  /** Может ли пользователь читать анкету */
  canRead(actor: User, questionnaire: QuestionnaireState): boolean {
    if (UserPolicy.isAdmin(actor)) return true;
    return actor.uuid === questionnaire.respondentId;
  },

  /** Может ли пользователь изменять анкету (отвечать, прерывать) */
  canEdit(actor: User, questionnaire: QuestionnaireState): boolean {
    if (UserPolicy.isAdmin(actor)) return true;
    return actor.uuid === questionnaire.respondentId;
  },
  /** Может ли пользователь просматривать список анкет другого пользователя */
  canListForUser(actor: User, userId: string): boolean {
    if (UserPolicy.isAdmin(actor)) return true;
    return actor.uuid === userId;
  },
};
