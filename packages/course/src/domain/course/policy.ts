import type { User } from '@u7-scl/user/domain';
import { UserPolicy } from '@u7-scl/user/domain';

/**
 * Политика прав доступа для курсов.
 * Stateless — проверяет права на основе роли и авторства пользователя.
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
  canEdit(actor: User, authorId: string): boolean {
    return UserPolicy.isAdmin(actor) || actor.uuid === authorId;
  },
};
