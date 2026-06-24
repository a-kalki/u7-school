import type { User } from './entity';
import { Role } from './roles';

/**
 * Политика прав доступа для пользователей.
 * Stateless — проверяет права на основе роли действующего пользователя.
 */
export const UserPolicy = {
  isAdmin(actor: User): boolean {
    return actor.roles.includes(Role.ADMIN);
  },

  isMentor(actor: User): boolean {
    return actor.roles.includes(Role.MENTOR);
  },

  isSubscriber(actor: User): boolean {
    return actor.roles.includes(Role.SUBSCRIBER);
  },

  isCandidate(actor: User): boolean {
    return actor.roles.includes(Role.CANDIDATE);
  },

  isGuest(actor: User): boolean {
    return actor.roles.includes(Role.GUEST);
  },

  isStudent(actor: User): boolean {
    return actor.roles.includes(Role.STUDENT);
  },

  canCreate(actor: User): boolean {
    return this.isAdmin(actor);
  },

  canRead(_actor: User, _target: User): boolean {
    return true;
  },

  canEdit(actor: User, target: User): boolean {
    return this.isAdmin(actor) || actor.uuid === target.uuid;
  },

  /**
   * ADMIN может добавлять любую роль любому пользователю.
   * Обычный пользователь — только роль STUDENT самому себе.
   */
  canAddRole(actor: User, target: User, role: Role): boolean {
    if (this.isAdmin(actor)) return true;
    return role === Role.STUDENT && actor.uuid === target.uuid;
  },
};
