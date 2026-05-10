import { describe, expect, test } from "bun:test";
import type { User } from "@u7/user/domain";
import { Role } from "@u7/user/domain";
import { Status } from "../status";
import { LessonPolicy } from "./policy";

function makeActor(roles: Role[]): User {
	return {
		uuid: crypto.randomUUID(),
		name: "Тест",
		telegramId: 1,
		roles,
		createdAt: "2026-05-01T12:00",
	};
}

const lesson = {
	uuid: "550e8400-e29b-41d4-a716-446655440000",
	courseId: "660e8400-e29b-41d4-a716-446655440001",
	title: "Урок",
	status: Status.DRAFT,
	order: 1,
	createdAt: "2026-05-01T12:00",
	stepIds: [],
	mentorStepIds: [],
};

describe("LessonPolicy", () => {
	describe("canCreate", () => {
		test("ADMIN может создавать", () => {
			expect(LessonPolicy.canCreate(makeActor([Role.ADMIN]))).toBe(true);
		});

		test("MENTOR может создавать", () => {
			expect(LessonPolicy.canCreate(makeActor([Role.MENTOR]))).toBe(true);
		});

		test("STUDENT не может создавать", () => {
			expect(LessonPolicy.canCreate(makeActor([Role.STUDENT]))).toBe(false);
		});
	});

	describe("canRead", () => {
		test("любой пользователь может читать", () => {
			expect(LessonPolicy.canRead(makeActor([Role.STUDENT]), lesson)).toBe(
				true,
			);
		});
	});

	describe("canEdit", () => {
		test("ADMIN может редактировать", () => {
			expect(LessonPolicy.canEdit(makeActor([Role.ADMIN]), lesson)).toBe(true);
		});

		test("MENTOR не может редактировать напрямую", () => {
			expect(LessonPolicy.canEdit(makeActor([Role.MENTOR]), lesson)).toBe(
				false,
			);
		});

		test("STUDENT не может редактировать", () => {
			expect(LessonPolicy.canEdit(makeActor([Role.STUDENT]), lesson)).toBe(
				false,
			);
		});
	});
});
