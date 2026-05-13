import type { User } from "./entity";
import { Role } from "./roles";

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

	canAddRole(actor: User): boolean {
		return this.isAdmin(actor);
	},
};
