import { describe, expect, test } from "bun:test";
import { Status } from "../shared/status";
import { Role } from "@u7/user/domain";
import type { User } from "@u7/user/domain";
import type { Course, CourseWithModules } from "./course";
import { CoursePolicy } from "./course-policy";

const admin: User = {
	uuid: "a",
	name: "A",
	telegramId: 1,
	roles: [Role.ADMIN],
	createdAt: "2026-05-01T12:00",
};
const mentor: User = {
	uuid: "m",
	name: "M",
	telegramId: 2,
	roles: [Role.MENTOR],
	createdAt: "2026-05-01T12:00",
};
const student: User = {
	uuid: "s",
	name: "S",
	telegramId: 3,
	roles: [Role.STUDENT],
	createdAt: "2026-05-01T12:00",
};

function makeCourse(authorId: string): Course {
	return {
		uuid: "c",
		title: "T",
		description: "D",
		authorId,
		kind: "modules",
		modules: [],
		status: Status.DRAFT,
		createdAt: "2026-05-01T12:00",
	} as CourseWithModules;
}

describe("CoursePolicy", () => {
	describe("canCreate", () => {
		test("ADMIN и MENTOR могут создавать", () => {
			expect(CoursePolicy.canCreate(admin)).toBe(true);
			expect(CoursePolicy.canCreate(mentor)).toBe(true);
		});
		test("STUDENT не может создавать", () => {
			expect(CoursePolicy.canCreate(student)).toBe(false);
		});
	});
	describe("canRead", () => {
		test("все могут читать", () => {
			const course = makeCourse(mentor.uuid);
			expect(CoursePolicy.canRead(admin, course)).toBe(true);
			expect(CoursePolicy.canRead(student, course)).toBe(true);
		});
	});
	describe("canEdit", () => {
		test("ADMIN может редактировать любой курс", () => {
			expect(CoursePolicy.canEdit(admin, makeCourse("other"))).toBe(true);
		});
		test("автор может редактировать свой курс", () => {
			expect(CoursePolicy.canEdit(mentor, makeCourse(mentor.uuid))).toBe(true);
		});
		test("не-автор не может редактировать чужой курс", () => {
			expect(CoursePolicy.canEdit(mentor, makeCourse("other"))).toBe(false);
		});
	});
});
