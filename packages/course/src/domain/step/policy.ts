import { Role } from "@u7/user/domain";
import type { User } from "@u7/user/domain";
import type { Step } from "./entity";

/**
 * Политика прав доступа для шагов.
 * Stateless — проверяет права на основе роли пользователя.
 * Проверку авторства курса делегирует CoursePolicy на уровне UC.
 */
export const StepPolicy = {
  canCreate(actor: User): boolean {
    return actor.roles.includes(Role.ADMIN) || actor.roles.includes(Role.MENTOR);
  },

  canRead(_actor: User, _target: Step): boolean {
    return true;
  },

  canEdit(actor: User, _target: Step): boolean {
    return actor.roles.includes(Role.ADMIN);
  },
};
