import type { User } from '@u7-scl/user/domain';
import { UserPolicy } from '@u7-scl/user/domain';
import { Status } from '../status';
import type { Course, Module, Project } from './entity';

/**
 * Политика прав доступа для курсов.
 * Stateless — проверяет права на основе роли и авторства пользователя.
 */
export const CoursePolicy = {
  /** Только MENTOR может создавать курсы. */
  canCreate(actor: User): boolean {
    return UserPolicy.isMentor(actor);
  },

  /** Читать может ADMIN, автор, или любой если курс PUBLISHED. */
  canRead(actor: User, course: Course): boolean {
    return (
      this.isAdminOrAuthor(actor, course) || course.status === Status.PUBLISHED
    );
  },

  /** Читать модуль — ADMIN/автор курса или модуль PUBLISHED. */
  canReadModule(actor: User, course: Course, module: Module): boolean {
    return (
      this.isAdminOrAuthor(actor, course) || module.status === Status.PUBLISHED
    );
  },

  /** Читать проект — ADMIN/автор курса или проект PUBLISHED. */
  canReadProject(actor: User, course: Course, project: Project): boolean {
    return (
      this.isAdminOrAuthor(actor, course) || project.status === Status.PUBLISHED
    );
  },

  /** Редактировать может ADMIN, или автор курса. */
  canEdit(actor: User, course: Course): boolean {
    return this.isAdminOrAuthor(actor, course);
  },

  /** Добавить модуль может автор курса. */
  canAddModule(actor: User, course: Course): boolean {
    return this.isAuthor(actor, course);
  },

  /** Добавить проект может автор курса. */
  canAddProject(actor: User, course: Course): boolean {
    return this.isAuthor(actor, course);
  },

  /** ADMIN или автор. */
  isAdminOrAuthor(actor: User, course: Course): boolean {
    return UserPolicy.isAdmin(actor) || this.isAuthor(actor, course);
  },

  /** Является ли актор автором курса. */
  isAuthor(actor: User, course: Course): boolean {
    return actor.uuid === course.authorId;
  },
};
