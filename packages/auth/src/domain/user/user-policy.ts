import { Role } from "./roles";
import type { User } from "./user";

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
