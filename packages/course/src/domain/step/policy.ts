import type { User } from "@u7/user/domain";
import { Role } from "@u7/user/domain";
import type { Course } from "../course/entity";
import { CoursePolicy } from "../course/policy";
import { Status } from "../status";
import type { Step } from "./entity";

/**
 * Политика прав доступа для шагов.
 * Получает Course для самостоятельной проверки авторства через CoursePolicy.
 */
export const StepPolicy = {
	canCreate(actor: User): boolean {
		return (
			actor.roles.includes(Role.ADMIN) || actor.roles.includes(Role.MENTOR)
		);
	},

	/** Читать: ADMIN/автор курса → всё; иначе PUBLISHED. */
	canRead(actor: User, target: Step, course: Course): boolean {
		return (
			CoursePolicy.isAdminOrAuthor(actor, course) ||
			target.status === Status.PUBLISHED
		);
	},

	/** Редактировать: только ADMIN или автор курса. */
	canEdit(actor: User, _target: Step, course: Course): boolean {
		return CoursePolicy.isAdminOrAuthor(actor, course);
	},
};
