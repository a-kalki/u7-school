import type { User } from "@u7/user/domain";
import { UserPolicy } from "@u7/user/domain";
import type { Course } from "../course/entity";
import { CoursePolicy } from "../course/policy";
import { Status } from "../status";
import type { Lesson } from "./entity";

/**
 * Политика прав доступа для уроков.
 * Получает Course для самостоятельной проверки авторства через CoursePolicy.
 */
export const LessonPolicy = {
	canCreate(actor: User): boolean {
		return UserPolicy.isMentor(actor);
	},

	/** Читать: ADMIN/автор курса → всё; иначе PUBLISHED. */
	canRead(actor: User, target: Lesson, course: Course): boolean {
		return (
			CoursePolicy.isAdminOrAuthor(actor, course) ||
			target.status === Status.PUBLISHED
		);
	},

	/** Редактировать: только ADMIN или автор курса. */
	canEdit(actor: User, _target: Lesson, course: Course): boolean {
		return CoursePolicy.isAdminOrAuthor(actor, course);
	},
};
