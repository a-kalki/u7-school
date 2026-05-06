import { Role } from "@u7/user";
import type { User } from "@u7/user";
import type { Course } from "./course";

export const CoursePolicy = {
	canCreate(actor: User): boolean {
		return (
			actor.roles.includes(Role.ADMIN) || actor.roles.includes(Role.MENTOR)
		);
	},

	canRead(_actor: User, _course: Course): boolean {
		return true;
	},

	canEdit(actor: User, course: Course): boolean {
		return actor.roles.includes(Role.ADMIN) || actor.uuid === course.authorId;
	},
};
