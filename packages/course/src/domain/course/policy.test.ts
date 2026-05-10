import { describe, expect, test } from "bun:test";
import type { User } from "@u7/user/domain";
import { Role } from "@u7/user/domain";
import { Status } from "../status";
import { CoursePolicy } from "./policy";

function makeActor(roles: Role[], uuid = "actor-uuid"): User {
	return {
		uuid,
		name: "Тест",
		telegramId: 1,
		roles,
		createdAt: "2026-05-01T12:00",
	};
}

const course = {
	uuid: "course-uuid",
	kind: "modules" as const,
	title: "Курс",
	description: "Описание",
	authorId: "author-uuid",
	status: Status.DRAFT,
	createdAt: "2026-05-01T12:00",
	modules: [],
};

describe("CoursePolicy", () => {
	describe("canCreate", () => {
		test("ADMIN может создавать", () => {
			expect(CoursePolicy.canCreate(makeActor([Role.ADMIN]))).toBe(true);
		});

		test("MENTOR может создавать", () => {
			expect(CoursePolicy.canCreate(makeActor([Role.MENTOR]))).toBe(true);
		});

		test("STUDENT не может создавать", () => {
			expect(CoursePolicy.canCreate(makeActor([Role.STUDENT]))).toBe(false);
		});
	});

	describe("canRead", () => {
		test("любой может читать", () => {
			expect(CoursePolicy.canRead(makeActor([Role.STUDENT]), course)).toBe(
				true,
			);
		});
	});

	describe("canEdit", () => {
		test("ADMIN может редактировать чужой курс", () => {
			expect(
				CoursePolicy.canEdit(makeActor([Role.ADMIN], "not-author"), course),
			).toBe(true);
		});

		test("автор может редактировать", () => {
			expect(
				CoursePolicy.canEdit(makeActor([Role.MENTOR], "author-uuid"), course),
			).toBe(true);
		});

		test("не-автор MENTOR не может редактировать", () => {
			expect(
				CoursePolicy.canEdit(makeActor([Role.MENTOR], "other-uuid"), course),
			).toBe(false);
		});

		test("STUDENT может редактировать свой курс", () => {
			expect(
				CoursePolicy.canEdit(makeActor([Role.STUDENT], "author-uuid"), course),
			).toBe(true);
		});

		test("STUDENT не может редактировать чужой курс", () => {
			expect(
				CoursePolicy.canEdit(makeActor([Role.STUDENT], "other-uuid"), course),
			).toBe(false);
		});
	});
});
