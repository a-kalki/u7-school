import type { User } from "../user/user";

export const CoursePolicy = {
	canCreate(actor: User): boolean {
		return actor.role === "ADMIN" || actor.role === "MENTOR";
	},

	canRead(_actor: User): boolean {
		return true;
	},

	canEdit(actor: User, authorId: string): boolean {
		return actor.role === "ADMIN" || actor.uuid === authorId;
	},
};
