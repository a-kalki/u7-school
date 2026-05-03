import type { User } from "../user/user";

/**
 * Политика прав доступа для пользователей.
 * Stateless — проверяет права на основе роли действующего пользователя.
 */
export const UserPolicy = {
	canCreate(actor: User): boolean {
		return actor.roles.includes("ADMIN");
	},

	canRead(_actor: User): boolean {
		return true;
	},

	canEdit(actor: User, target: User): boolean {
		return actor.roles.includes("ADMIN") || actor.uuid === target.uuid;
	},
};
