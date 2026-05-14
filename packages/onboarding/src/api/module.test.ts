import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { BaseJsonDb } from "@u7/core/infra";
import type { User } from "@u7/user/domain";
import { Role } from "@u7/user/domain";
import { UserJsonRepo } from "@u7/user/infra";
import { Experience } from "#domain/application/experience";
import { Format } from "#domain/application/format";
import { Goals } from "#domain/application/goals";
import { Intensity } from "#domain/application/intensity";
import { Source } from "#domain/application/source";
import { ApplicationStatus } from "#domain/application/status";
import { ApplicationJsonRepo } from "#infra/db/application-json-repo";
import { OnboardingApiModule } from "./module";

const tmpDir = mkdtempSync("/tmp/onboarding-api-test-");

function nextPath(prefix: string): string {
	return join(tmpDir, `${prefix}.json`);
}

function makeUser(overrides?: Partial<User>): User {
	return {
		uuid: crypto.randomUUID(),
		name: "Тест",
		telegramId: 1,
		roles: [Role.GUEST],
		createdAt: "2024-01-01T00:00",
		...overrides,
	};
}

describe("OnboardingApiModule", () => {
	let db: BaseJsonDb;
	let applicationRepo: ApplicationJsonRepo;
	let userRepo: UserJsonRepo;
	let mod: OnboardingApiModule;

	beforeEach(() => {
		db = new BaseJsonDb();
		applicationRepo = new ApplicationJsonRepo(nextPath("applications"), db);
		userRepo = new UserJsonRepo(nextPath("users"), undefined, db);
		mod = new OnboardingApiModule();
		mod.init({ applicationRepo, userRepo, db });
	});

	afterAll(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	const makeAnswers = () => ({
		source: Source.TELEGRAM,
		interestReason: "Хочу учиться",
		experience: Experience.BEGINNER,
		format: Format.ONLINE,
		goals: Goals.CAREER_CHANGE,
		intensity: Intensity.BASE,
	});

	test("create-application: создаёт заявку и добавляет роль CANDIDATE", async () => {
		const user = makeUser();
		await userRepo.save(user);

		const result = await mod.handle({
			name: "create-application",
			attrs: { userId: user.uuid, answers: makeAnswers() },
			actorId: user.uuid,
		});

		expect((result as { status: string }).status).toBe(
			ApplicationStatus.SUBMITTED,
		);

		const updatedUser = await userRepo.getByUuid(user.uuid);
		expect(updatedUser?.roles).toContain(Role.CANDIDATE);
	});

	test("create-application: отклоняет дубликат", async () => {
		const user = makeUser();
		await userRepo.save(user);

		await mod.handle({
			name: "create-application",
			attrs: { userId: user.uuid, answers: makeAnswers() },
			actorId: user.uuid,
		});

		await expect(
			mod.handle({
				name: "create-application",
				attrs: { userId: user.uuid, answers: makeAnswers() },
				actorId: user.uuid,
			}),
		).rejects.toThrow();
	});

	test("get-application: возвращает заявку владельцу", async () => {
		const user = makeUser();
		await userRepo.save(user);

		const created = (await mod.handle({
			name: "create-application",
			attrs: { userId: user.uuid, answers: makeAnswers() },
			actorId: user.uuid,
		})) as { uuid: string };

		const result = await mod.handle({
			name: "get-application",
			attrs: { uuid: created.uuid },
			actorId: user.uuid,
		});

		expect((result as { uuid: string }).uuid).toBe(created.uuid);
	});

	test("get-application: отклоняет чужаку", async () => {
		const user = makeUser();
		const stranger = makeUser();
		await userRepo.save(user);
		await userRepo.save(stranger);

		const created = (await mod.handle({
			name: "create-application",
			attrs: { userId: user.uuid, answers: makeAnswers() },
			actorId: user.uuid,
		})) as { uuid: string };

		await expect(
			mod.handle({
				name: "get-application",
				attrs: { uuid: created.uuid },
				actorId: stranger.uuid,
			}),
		).rejects.toThrow();
	});

	test("list-applications: ADMIN видит все заявки", async () => {
		const admin = makeUser({ roles: [Role.ADMIN] });
		const user = makeUser();
		await userRepo.save(admin);
		await userRepo.save(user);

		await mod.handle({
			name: "create-application",
			attrs: { userId: user.uuid, answers: makeAnswers() },
			actorId: user.uuid,
		});

		const result = await mod.handle({
			name: "list-applications",
			attrs: {},
			actorId: admin.uuid,
		});

		const apps = result as { userId: string }[];
		expect(apps.length).toBeGreaterThanOrEqual(1);
		expect(apps.some((a) => a.userId === user.uuid)).toBe(true);
	});

	test("list-applications: обычный пользователь не может листить", async () => {
		const user = makeUser();
		await userRepo.save(user);

		await expect(
			mod.handle({
				name: "list-applications",
				attrs: {},
				actorId: user.uuid,
			}),
		).rejects.toThrow();
	});

	test("get-application-by-user-id: находит заявку по userId", async () => {
		const user = makeUser();
		await userRepo.save(user);

		await mod.handle({
			name: "create-application",
			attrs: { userId: user.uuid, answers: makeAnswers() },
			actorId: user.uuid,
		});

		const result = await mod.handle({
			name: "get-application-by-user-id",
			attrs: { userId: user.uuid },
			actorId: user.uuid,
		});

		expect((result as { userId: string }).userId).toBe(user.uuid);
	});

	test("update-application: владелец обновляет ответы", async () => {
		const user = makeUser();
		await userRepo.save(user);

		const created = (await mod.handle({
			name: "create-application",
			attrs: { userId: user.uuid, answers: makeAnswers() },
			actorId: user.uuid,
		})) as { uuid: string };

		const result = await mod.handle({
			name: "update-application",
			attrs: {
				uuid: created.uuid,
				answers: { ...makeAnswers(), interestReason: "Обновлённая причина" },
			},
			actorId: user.uuid,
		});

		expect(
			(result as { answers: { interestReason: string } }).answers
				.interestReason,
		).toBe("Обновлённая причина");
	});

	test("update-application: чужак не может обновить", async () => {
		const user = makeUser();
		const stranger = makeUser();
		await userRepo.save(user);
		await userRepo.save(stranger);

		const created = (await mod.handle({
			name: "create-application",
			attrs: { userId: user.uuid, answers: makeAnswers() },
			actorId: user.uuid,
		})) as { uuid: string };

		await expect(
			mod.handle({
				name: "update-application",
				attrs: {
					uuid: created.uuid,
					answers: makeAnswers(),
				},
				actorId: stranger.uuid,
			}),
		).rejects.toThrow();
	});
});
