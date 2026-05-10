import type { User } from "@u7/user/domain";
import { Role } from "@u7/user/domain";
import type { Course } from "./entity";

/**
 * Политика прав доступа для курсов.
 * Stateless — проверяет права на основе роли и авторства пользователя.
 */
export const CoursePolicy = {
	canCreate(actor: User): boolean {
		return (
			actor.roles.includes(Role.ADMIN) || actor.roles.includes(Role.MENTOR)
		);
	},

	canRead(_actor: User, _target: Course): boolean {
		return true;
	},

	canEdit(actor: User, target: Course): boolean {
		return actor.roles.includes(Role.ADMIN) || actor.uuid === target.authorId;
	},
};
