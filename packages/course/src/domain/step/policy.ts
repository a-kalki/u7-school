import type { User } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import type { Module } from '../module/entity';
import { ModulePolicy } from '../module/policy';
import { Status } from '../status';
import type { Step } from './entity';

/**
 * Политика прав доступа для шагов.
 * Получает Course для самостоятельной проверки авторства через ModulePolicy.
 */
export const StepPolicy = {
  canCreate(actor: User): boolean {
    return (
      actor.roles.includes(Role.ADMIN) || actor.roles.includes(Role.MENTOR)
    );
  },

  /** Читать: ADMIN/автор курса → всё; иначе PUBLISHED. */
  canRead(actor: User, target: Step, course: Module): boolean {
    return (
      ModulePolicy.isAdminOrAuthor(actor, course) ||
      target.status === Status.PUBLISHED
    );
  },

  /** Редактировать: только ADMIN или автор курса. */
  canEdit(actor: User, _target: Step, course: Module): boolean {
    return ModulePolicy.isAdminOrAuthor(actor, course);
  },
};
