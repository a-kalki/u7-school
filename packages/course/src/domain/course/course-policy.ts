import type { User } from "../user/user";
import type { Course } from "./course";

export const CoursePolicy = {
	canCreate(actor: User): boolean {
		return actor.roles.includes("ADMIN") || actor.roles.includes("MENTOR");
	},

	canRead(_actor: User, _course: Course): boolean {
		return true;
	},

	canEdit(actor: User, course: Course): boolean {
		return actor.roles.includes("ADMIN") || actor.uuid === course.authorId;
	},
};
