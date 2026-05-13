import { describe, expect, test } from "bun:test";
import type { User } from "@u7/user/domain";
import { Role } from "@u7/user/domain";
import type { Course } from "../course/entity";
import { Status } from "../status";
import { LessonAr } from "./a-root";

const cmd = {
	courseId: crypto.randomUUID(),
	projectId: crypto.randomUUID(),
	title: "Урок 1",
	additional: undefined,
	estimatedMinutes: undefined,
};

describe("LessonAr", () => {
	describe("create", () => {
		test("создаёт урок", () => {
			const ar = LessonAr.create(cmd);
			expect(ar.state.title).toBe("Урок 1");
			expect(ar.state.status).toBe(Status.DRAFT);
			expect(ar.state.stepIds).toEqual([]);
			expect(ar.state.mentorStepIds).toEqual([]);
		});

		test("не создаёт updatedAt при создании", () => {
			const ar = LessonAr.create(cmd);
			expect(ar.state.updatedAt).toBeUndefined();
		});

		test("принимает команду с опциональными полями", () => {
			const ar = LessonAr.create({
				...cmd,
				additional: "Доп",
				estimatedMinutes: 30,
			});
			expect(ar.state.additional).toBe("Доп");
			expect(ar.state.estimatedMinutes).toBe(30);
		});
	});

	describe("getVisibleFor", () => {
		const authorId = crypto.randomUUID();
		const course: Course = {
			uuid: crypto.randomUUID(),
			kind: "modules" as const,
			title: "Курс",
			description: "Описание",
			authorId,
			status: Status.DRAFT,
			createdAt: "2026-05-01T12:00",
			modules: [],
		};

		function makeActor(roles: Role[], uuid = "other"): User {
			return {
				uuid,
				name: "Т",
				telegramId: 1,
				roles,
				createdAt: "2026-05-01T12:00",
			};
		}

		test("без актора — DRAFT → null", () => {
			const ar = LessonAr.create(cmd);
			expect(ar.getVisibleFor(undefined, course)).toBeNull();
		});

		test("без актора — PUBLISHED → урок", () => {
			const ar = LessonAr.create(cmd);
			const published = new LessonAr({ ...ar.state, status: Status.PUBLISHED });
			expect(published.getVisibleFor(undefined, course)).not.toBeNull();
		});

		test("автор видит DRAFT", () => {
			const ar = LessonAr.create(cmd);
			expect(
				ar.getVisibleFor(makeActor([Role.MENTOR], authorId), course),
			).not.toBeNull();
		});

		test("ADMIN видит DRAFT", () => {
			const ar = LessonAr.create(cmd);
			expect(ar.getVisibleFor(makeActor([Role.ADMIN]), course)).not.toBeNull();
		});

		test("студент не видит DRAFT", () => {
			const ar = LessonAr.create(cmd);
			expect(ar.getVisibleFor(makeActor([Role.STUDENT]), course)).toBeNull();
		});

		test("студент видит PUBLISHED", () => {
			const ar = LessonAr.create(cmd);
			const published = new LessonAr({ ...ar.state, status: Status.PUBLISHED });
			expect(
				published.getVisibleFor(makeActor([Role.STUDENT]), course),
			).not.toBeNull();
		});
	});
});
