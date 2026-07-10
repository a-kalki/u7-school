import type { User } from '@u7-scl/user/domain';
import { UserPolicy } from '@u7-scl/user/domain';
import type { Course } from './entity';

/**
 * Политика прав доступа для курсов.
 * Stateless — проверяет права на основе роли и авторства пользователя.
 *
 * ВАЖНО: логика доменных прав НЕ должна утекать из своего модуля.
 * Проверки, касающиеся структуры курса (фазы, moduleIds), — здесь.
 * Проверки, касающиеся студента (статусы), — в StreamPolicy пакета stream.
 */
export const CoursePolicy = {
  /** Только AUTHOR может создавать курсы. */
  canCreate(actor: User): boolean {
    return UserPolicy.isAuthor(actor);
  },

  /** Читать могут все авторизованные пользователи. */
  canRead(_actor: User): boolean {
    return true;
  },

  /** Редактировать может ADMIN или автор курса. */
  canEdit(actor: User, course: Course): boolean {
    return UserPolicy.isAdmin(actor) || this.isAuthor(actor, course);
  },

  isAuthor(actor: User, course: Course): boolean {
    return actor.uuid === course.authorId;
  },

  /**
   * Есть ли модуль с указанным ID в любой из фаз курса.
   */
  containsModule(course: Course, moduleId: string): boolean {
    return course.phases.some((phase) => phase.moduleIds.includes(moduleId));
  },

  /**
   * Является ли модуль первым в курсе (по порядку фаз).
   * Первый модуль первой фазы.
   */
  isFirstModule(course: Course, moduleId: string): boolean {
    const allModuleIds = course.phases.flatMap((phase) => phase.moduleIds);
    return allModuleIds.length > 0 && allModuleIds[0] === moduleId;
  },
};
