import type { User } from '@u7-scl/user/domain';
import { UserPolicy } from '@u7-scl/user/domain';
import type { Course } from './entity';

/**
 * Политика прав доступа для курсов.
 * Stateless — проверяет права на основе роли и авторства пользователя.
 *
 * ВАЖНО: логика доменных прав НЕ должна утекать из своего модуля.
 * Гейтинг (допуск к модулям курса) — здесь, так как решение принимается
 * на основе структуры курса (фазы, порядок модулей) и списка завершённых модулей.
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
   * Может ли студент записаться на указанный модуль курса.
   *
   * @param course — курс с фазами и упорядоченными moduleIds
   * @param targetModuleId — модуль, на который планируется запись
   * @param completedModuleIds — ID модулей, завершённых студентом со статусом advanced
   */
  canEnrollNextModule(
    course: Course,
    targetModuleId: string,
    completedModuleIds: string[],
  ): boolean {
    // Собираем все moduleIds в линейный порядок по фазам
    const allModuleIds = course.phases.flatMap((phase) => phase.moduleIds);
    const targetIndex = allModuleIds.indexOf(targetModuleId);

    // Модуль не принадлежит курсу — отказ
    if (targetIndex === -1) return false;

    // Входной модуль (без пререквизитов) — разрешён всем
    if (targetIndex === 0) return true;

    // Для остальных — предыдущий модуль должен быть завершён
    const prevModuleId = allModuleIds[targetIndex - 1];
    if (!prevModuleId) return false;
    return completedModuleIds.includes(prevModuleId);
  },
};
