import { describe, expect, test } from "bun:test";
import type { User } from "../user/user";
import { CoursePolicy } from "./course_policy";

const admin: User = { uuid: "a", name: "A", telegramId: 1, role: "ADMIN", createdAt: "2026-05-01T12:00" };
const mentor: User = { uuid: "m", name: "M", telegramId: 2, role: "MENTOR", createdAt: "2026-05-01T12:00" };
const student: User = { uuid: "s", name: "S", telegramId: 3, role: "STUDENT", createdAt: "2026-05-01T12:00" };

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
			expect(CoursePolicy.canRead(admin)).toBe(true);
			expect(CoursePolicy.canRead(student)).toBe(true);
		});
	});
	describe("canEdit", () => {
		test("ADMIN может редактировать любой курс", () => {
			expect(CoursePolicy.canEdit(admin, "other-author")).toBe(true);
		});
		test("автор может редактировать свой курс", () => {
			expect(CoursePolicy.canEdit(mentor, mentor.uuid)).toBe(true);
		});
		test("не-автор не может редактировать чужой курс", () => {
			expect(CoursePolicy.canEdit(mentor, "other-author")).toBe(false);
		});
	});
});
