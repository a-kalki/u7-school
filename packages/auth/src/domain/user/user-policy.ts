import type { User } from "./user";
import { Role } from "./roles";

/**
 * Политика прав доступа для пользователей.
 * Stateless — проверяет права на основе роли действующего пользователя.
 */
export const UserPolicy = {
	canCreate(actor: User): boolean {
		return actor.roles.includes(Role.ADMIN);
	},

	canRead(_actor: User): boolean {
		return true;
	},

	canEdit(actor: User, target: User): boolean {
		return actor.roles.includes(Role.ADMIN) || actor.uuid === target.uuid;
	},
};
