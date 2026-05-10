import { Role } from "@u7/user/domain";
import type { User } from "@u7/user/domain";
import type { Lesson } from "./entity";

/**
 * Политика прав доступа для уроков.
 * Stateless — проверяет права на основе роли пользователя.
 * Проверку авторства курса делегирует CoursePolicy на уровне UC.
 */
export const LessonPolicy = {
  canCreate(actor: User): boolean {
    return actor.roles.includes(Role.ADMIN) || actor.roles.includes(Role.MENTOR);
  },

  canRead(_actor: User, _target: Lesson): boolean {
    return true;
  },

  canEdit(actor: User, _target: Lesson): boolean {
    return actor.roles.includes(Role.ADMIN);
  },
};
