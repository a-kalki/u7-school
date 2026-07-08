import type { User } from '@u7-scl/user/domain';
import { UserPolicy } from '@u7-scl/user/domain';
import type { Module } from '../module/entity';
import { ModulePolicy } from '../module/policy';
import { Status } from '../status';
import type { Lesson } from './entity';

/**
 * Политика прав доступа для уроков.
 * Получает Course для самостоятельной проверки авторства через ModulePolicy.
 */
export const LessonPolicy = {
  canCreate(actor: User): boolean {
    return UserPolicy.isAuthor(actor);
  },

  /** Читать: ADMIN/автор курса → всё; иначе PUBLISHED. */
  canRead(actor: User, target: Lesson, module: Module): boolean {
    return (
      ModulePolicy.isAdminOrAuthor(actor, module) ||
      target.status === Status.PUBLISHED
    );
  },

  /** Редактировать: только ADMIN или автор курса. */
  canEdit(actor: User, _target: Lesson, module: Module): boolean {
    return ModulePolicy.isAdminOrAuthor(actor, module);
  },
};
