import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { Application } from "#domain/application/entity";
import { Experience } from "#domain/application/experience";
import { Format } from "#domain/application/format";
import { Goals } from "#domain/application/goals";
import { Intensity } from "#domain/application/intensity";
import { Source } from "#domain/application/source";
import { ApplicationStatus } from "#domain/application/status";
import { ApplicationJsonRepo } from "./application-json-repo";

let tmpDir: string;

function nextPath(): string {
	return join(tmpDir, `${crypto.randomUUID()}.json`);
}

function makeApplication(overrides?: Partial<Application>): Application {
	return {
		uuid: crypto.randomUUID(),
		userId: crypto.randomUUID(),
		status: ApplicationStatus.SUBMITTED,
		answers: {
			source: Source.TELEGRAM,
			interestReason: "Тест",
			experience: Experience.BEGINNER,
			format: Format.ONLINE,
			goals: Goals.CAREER_CHANGE,
			intensity: Intensity.BASE,
		},
		createdAt: "2024-01-01T00:00",
		submittedAt: "2024-01-01T00:00",
		...overrides,
	};
}

describe("ApplicationJsonRepo", () => {
	let repo: ApplicationJsonRepo;

	beforeEach(() => {
		tmpDir = mkdtempSync("/tmp/onboarding-repo-test-");
		repo = new ApplicationJsonRepo(nextPath());
	});

	afterEach(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	describe("save", () => {
		test("сохраняет заявку", async () => {
			const app = makeApplication();
			await repo.save(app);
			const found = await repo.getByUuid(app.uuid);
			expect(found).toEqual(app);
		});

		test("перезаписывает существующую заявку", async () => {
			const app = makeApplication();
			await repo.save(app);

			const updated = { ...app, status: ApplicationStatus.APPROVED };
			await repo.save(updated);

			const found = await repo.getByUuid(app.uuid);
			expect(found?.status).toBe(ApplicationStatus.APPROVED);
		});
	});

	describe("getByUuid", () => {
		test("возвращает заявку по uuid", async () => {
			const app = makeApplication();
			await repo.save(app);
			const found = await repo.getByUuid(app.uuid);
			expect(found).toEqual(app);
		});

		test("возвращает undefined для несуществующего uuid", async () => {
			const found = await repo.getByUuid("non-existent");
			expect(found).toBeUndefined();
		});
	});

	describe("getByUserId", () => {
		test("возвращает заявку по userId", async () => {
			const app = makeApplication();
			await repo.save(app);
			const found = await repo.getByUserId(app.userId);
			expect(found).toEqual(app);
		});

		test("возвращает undefined для несуществующего userId", async () => {
			const found = await repo.getByUserId("non-existent");
			expect(found).toBeUndefined();
		});
	});

	describe("getAll", () => {
		test("возвращает пустой массив для пустого репозитория", async () => {
			const all = await repo.getAll();
			expect(all).toEqual([]);
		});

		test("возвращает все заявки", async () => {
			const app1 = makeApplication();
			const app2 = makeApplication();
			await repo.save(app1);
			await repo.save(app2);

			const all = await repo.getAll();
			expect(all).toHaveLength(2);
		});

		test("фильтрует по статусу", async () => {
			const app1 = makeApplication({ status: ApplicationStatus.SUBMITTED });
			const app2 = makeApplication({ status: ApplicationStatus.APPROVED });
			await repo.save(app1);
			await repo.save(app2);

			const filtered = await repo.getAll({
				status: ApplicationStatus.APPROVED,
			});
			expect(filtered).toHaveLength(1);
			expect(filtered[0]?.uuid).toBe(app2.uuid);
		});

		test("сортирует по createdAt по возрастанию", async () => {
			const app1 = makeApplication({ createdAt: "2024-01-01T00:00" });
			const app2 = makeApplication({ createdAt: "2024-01-02T00:00" });
			await repo.save(app1);
			await repo.save(app2);

			const sorted = await repo.getAll({ sort: "createdAt:asc" });
			expect(sorted[0]?.uuid).toBe(app1.uuid);
			expect(sorted[1]?.uuid).toBe(app2.uuid);
		});

		test("сортирует по createdAt по убыванию", async () => {
			const app1 = makeApplication({ createdAt: "2024-01-01T00:00" });
			const app2 = makeApplication({ createdAt: "2024-01-02T00:00" });
			await repo.save(app1);
			await repo.save(app2);

			const sorted = await repo.getAll({ sort: "createdAt:desc" });
			expect(sorted[0]?.uuid).toBe(app2.uuid);
			expect(sorted[1]?.uuid).toBe(app1.uuid);
		});

		test("ограничивает количество результатов", async () => {
			const app1 = makeApplication();
			const app2 = makeApplication();
			await repo.save(app1);
			await repo.save(app2);

			const limited = await repo.getAll({ limit: 1 });
			expect(limited).toHaveLength(1);
		});
	});

	describe("hasApplicationForUser", () => {
		test("возвращает true для существующего userId", async () => {
			const app = makeApplication();
			await repo.save(app);
			const has = await repo.hasApplicationForUser(app.userId);
			expect(has).toBe(true);
		});

		test("возвращает false для несуществующего userId", async () => {
			const has = await repo.hasApplicationForUser("non-existent");
			expect(has).toBe(false);
		});
	});
});
