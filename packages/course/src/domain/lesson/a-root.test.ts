import { describe, expect, test } from "bun:test";
import { Status } from "../status";
import { LessonAr } from "./a-root";

const validCmd = {
	courseId: "660e8400-e29b-41d4-a716-446655440001",
	title: "Введение",
	additional: "Дополнительно",
	status: Status.DRAFT,
	order: 1,
	estimatedMinutes: 45,
	stepIds: ["770e8400-e29b-41d4-a716-446655440002"],
	mentorStepIds: ["770e8400-e29b-41d4-a716-446655440003"],
};

describe("LessonAr", () => {
	describe("create", () => {
		test("создаёт урок", () => {
			const ar = LessonAr.create(validCmd);
			expect(ar.state.uuid).toMatch(
				/^[0-9a-f]{8}-([0-9a-f]{4}-){3}[0-9a-f]{12}$/i,
			);
			expect(ar.state.title).toBe("Введение");
			expect(ar.state.courseId).toBe(validCmd.courseId);
			expect(ar.state.stepIds).toEqual(validCmd.stepIds);
			expect(ar.state.mentorStepIds).toEqual(validCmd.mentorStepIds);
			expect(ar.state.estimatedMinutes).toBe(45);
		});

		test("не создаёт updatedAt при создании", () => {
			const ar = LessonAr.create(validCmd);
			expect(ar.state.updatedAt).toBeUndefined();
		});

		test("принимает команду без опциональных полей", () => {
			const ar = LessonAr.create({
				courseId: validCmd.courseId,
				title: "Минимум",
				status: Status.PUBLISHED,
				order: 2,
			});
			expect(ar.state.additional).toBeUndefined();
			expect(ar.state.estimatedMinutes).toBeUndefined();
			expect(ar.state.stepIds).toEqual([]);
			expect(ar.state.mentorStepIds).toEqual([]);
		});
	});
});
