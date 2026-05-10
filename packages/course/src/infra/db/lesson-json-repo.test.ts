import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { Lesson } from "#domain/lesson/entity";
import { Status } from "#domain/status";
import { LessonJsonRepo } from "./lesson-json-repo";

const tmpDir = mkdtempSync("/tmp/lesson-repo-test-");

function filePath(): string {
	return join(tmpDir, "lessons.json");
}

function makeLesson(overrides: Partial<Lesson> = {}): Lesson {
	return {
		uuid: crypto.randomUUID(),
		courseId: crypto.randomUUID(),
		title: "Тестовый урок",
		status: Status.DRAFT,
		order: 1,
		createdAt: "2026-05-01T12:00",
		stepIds: [],
		mentorStepIds: [],
		...overrides,
	};
}

describe("LessonJsonRepo", () => {
	afterAll(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	test("save и getByUuid", async () => {
		const repo = new LessonJsonRepo(filePath());
		const uuid = crypto.randomUUID();
		const lesson = makeLesson({ uuid });

		await repo.save(lesson);
		const found = await repo.getByUuid(uuid);

		expect(found).toBeDefined();
		expect(found?.title).toBe("Тестовый урок");
	});

	test("getByIds возвращает уроки по списку ID", async () => {
		const repo = new LessonJsonRepo(join(tmpDir, "lessons-ids.json"));
		const id1 = crypto.randomUUID();
		const id2 = crypto.randomUUID();
		const l1 = makeLesson({ uuid: id1 });
		const l2 = makeLesson({ uuid: id2 });

		await repo.save(l1);
		await repo.save(l2);

		const result = await repo.getByIds([id1]);
		expect(result).toHaveLength(1);
		expect(result[0]?.uuid).toBe(id1);
	});
});
