import type { User } from '@u7-scl/user/domain';
import { UserPolicy } from '@u7-scl/user/domain';
import { Status } from '../status';
import type { Module, Project } from './entity';

/**
 * Политика прав доступа для модулей.
 * Stateless — проверяет права на основе роли и авторства пользователя.
 */
export const ModulePolicy = {
  /** Только MENTOR может создавать модули. */
  canCreate(actor: User): boolean {
    return UserPolicy.isMentor(actor);
  },

  /** Читать может ADMIN, автор, или любой если модуль PUBLISHED. */
  canRead(actor: User, module: Module): boolean {
    return (
      this.isAdminOrAuthor(actor, module) || module.status === Status.PUBLISHED
    );
  },

  /** Читать проект — ADMIN/автор модуля или проект PUBLISHED. */
  canReadProject(actor: User, module: Module, project: Project): boolean {
    return (
      this.isAdminOrAuthor(actor, module) || project.status === Status.PUBLISHED
    );
  },

  /** Редактировать может ADMIN, или автор модуля. */
  canEdit(actor: User, module: Module): boolean {
    return this.isAdminOrAuthor(actor, module);
  },

  /** Добавить проект может автор модуля. */
  canAddProject(actor: User, module: Module): boolean {
    return this.isAuthor(actor, module);
  },

  /** ADMIN или автор. */
  isAdminOrAuthor(actor: User, module: Module): boolean {
    return UserPolicy.isAdmin(actor) || this.isAuthor(actor, module);
  },

  /** Является ли актор автором модуля. */
  isAuthor(actor: User, module: Module): boolean {
    return actor.uuid === module.authorId;
  },
};
