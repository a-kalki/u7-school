import type { User } from "@u7/user/domain";
import { UserPolicy } from "@u7/user/domain";
import type { Application } from "./entity";

/**
 * Политика прав доступа для заявок.
 * Stateless — проверяет права на основе роли и владения.
 */
export const ApplicationPolicy = {
  /** Любой существующий пользователь может создать заявку. */
  canCreate(_actor: User): boolean {
    return true;
  },

  /** Читать может владелец, ADMIN, MENTOR. */
  canRead(actor: User, target: Application): boolean {
    return (
      this.isOwner(actor, target) ||
      UserPolicy.isAdmin(actor) ||
      UserPolicy.isMentor(actor)
    );
  },

  /** Листить может ADMIN, MENTOR. */
  canList(actor: User): boolean {
    return UserPolicy.isAdmin(actor) || UserPolicy.isMentor(actor);
  },

  /** Обновлять может владелец или ADMIN. */
  canUpdate(actor: User, target: Application): boolean {
    return this.isOwner(actor, target) || UserPolicy.isAdmin(actor);
  },

  /** Является ли актор владельцем заявки. */
  isOwner(actor: User, target: Application): boolean {
    return actor.uuid === target.userId;
  },
};
