import { Role, type User } from '@u7-scl/user/domain';
import type { Questionnaire } from './entity';

/**
 * Политика доступа к анкетам.
 */
export const QuestionnairePolicy = {
  /** Может ли пользователь начать анкету */
  canStart(actor: User, targetTelegramId: number): boolean {
    if (actor.roles.includes(Role.ADMIN)) return true;
    return actor.telegramId === targetTelegramId;
  },

  /** Может ли пользователь читать анкету */
  canRead(actor: User, questionnaire: Questionnaire): boolean {
    if (actor.roles.includes(Role.ADMIN)) return true;
    return actor.telegramId === questionnaire.telegramId;
  },

  /** Может ли пользователь изменять анкету (отвечать, прерывать) */
  canEdit(actor: User, questionnaire: Questionnaire): boolean {
    if (actor.roles.includes(Role.ADMIN)) return true;
    return actor.telegramId === questionnaire.telegramId;
  },
};
