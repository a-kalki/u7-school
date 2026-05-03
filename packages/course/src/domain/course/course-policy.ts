import type { User } from "../user/user";
import type { Course } from "./course";

export const CoursePolicy = {
	canCreate(actor: User): boolean {
		return actor.role === "ADMIN" || actor.role === "MENTOR";
	},

	canRead(_actor: User, _course: Course): boolean {
		return true;
	},

	canEdit(actor: User, course: Course): boolean {
		return actor.role === "ADMIN" || actor.uuid === course.authorId;
	},
};
