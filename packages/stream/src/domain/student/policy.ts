import { type User, UserPolicy } from '@u7-scl/user/domain';
import type { Student } from './entity';

/**
 * Политика прав для сущности Student (студент потока).
 */
export const StudentPolicy = {
  /**
   * Может ли актор просматривать прогресс студента.
   * Сам студент, ментор потока (проверяется в UC) или админ.
   */
  canViewProgress(actor: User, student: Student): boolean {
    return actor.uuid === student.userId || UserPolicy.isAdmin(actor);
  },

  /**
   * Может ли актор отмечать шаг выполненным.
   * Только сам студент.
   */
  canCompleteStep(actor: User, student: Student): boolean {
    return actor.uuid === student.userId;
  },
};
