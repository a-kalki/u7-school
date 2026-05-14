import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { BaseJsonDb } from "@u7/core/infra";
import type { User } from "@u7/user/domain";
import { Role } from "@u7/user/domain";
import { UserJsonRepo } from "@u7/user/infra";
import type { Question } from "#domain/questionnaire/question";
import { QuestionPoolService } from "#domain/questionnaire/question-pool-service";
import { QuestionnaireJsonRepo } from "#infra/db/questionnaire-json-repo";
import { OnboardingApiModule } from "./module";

let tmpDir: string;

function nextPath(prefix: string): string {
	return join(tmpDir, `${prefix}-${crypto.randomUUID()}.json`);
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

const testPool: Question[] = [
	{
		question: "Первый вопрос",
		questionCode: "q1",
		type: "choice",
		multiple: false,
		answers: [
			{ answer: "Да", answerCode: "yes" },
			{ answer: "Нет", answerCode: "no" },
		],
	},
	{
		question: "Второй вопрос",
		questionCode: "q2",
		type: "text",
	},
];

describe("OnboardingApiModule", () => {
	let db: BaseJsonDb;
	let questionnaireRepo: QuestionnaireJsonRepo;
	let userRepo: UserJsonRepo;
	let mod: OnboardingApiModule;

	beforeEach(() => {
		tmpDir = mkdtempSync("/tmp/onboarding-api-test-");
		db = new BaseJsonDb();
		questionnaireRepo = new QuestionnaireJsonRepo(
			nextPath("questionnaires"),
			db,
		);
		userRepo = new UserJsonRepo(nextPath("users"), undefined, db);
		mod = new OnboardingApiModule();
		mod.init({
			questionnaireRepo,
			questionPoolService: new QuestionPoolService(testPool),
			userFacade: {
				getUserByUuid: async (uuid: string) => userRepo.getByUuid(uuid),
				userExists: async (uuid: string) => {
					const u = await userRepo.getByUuid(uuid);
					return u !== undefined;
				},
				addRoleToUser: async (userId: string, role: Role) => {
					const user = await userRepo.getByUuid(userId);
					if (!user) return undefined;
					const updated = {
						...user,
						roles: user.roles.includes(role)
							? user.roles
							: [...user.roles, role],
					};
					await userRepo.save(updated);
					return updated;
				},
			},
			db,
		});
	});

	afterEach(() => {
		rmSync(tmpDir, { recursive: true, force: true });
	});

	test("start-questionnaire: создаёт анкету", async () => {
		const user = makeUser();
		await userRepo.save(user);

		const result = await mod.handle({
			name: "start-questionnaire",
			attrs: { userId: user.uuid },
			actorId: user.uuid,
		});

		expect((result as { status: string }).status).toBe("in_progress");
		expect(
			(result as { currentQuestionCode: string | null }).currentQuestionCode,
		).toBe("q1");
	});

	test("submit-answer: обрабатывает ответ и завершает анкету", async () => {
		const user = makeUser();
		await userRepo.save(user);

		const created = (await mod.handle({
			name: "start-questionnaire",
			attrs: { userId: user.uuid },
			actorId: user.uuid,
		})) as { uuid: string };

		const result = await mod.handle({
			name: "submit-answer",
			attrs: {
				questionnaireUuid: created.uuid,
				questionCode: "q1",
				value: "yes",
			},
			actorId: user.uuid,
		});

		expect((result as { status: string }).status).toBe("in_progress");

		const finalResult = await mod.handle({
			name: "submit-answer",
			attrs: {
				questionnaireUuid: created.uuid,
				questionCode: "q2",
				value: "hello",
			},
			actorId: user.uuid,
		});

		expect((finalResult as { status: string }).status).toBe("completed");

		const updatedUser = await userRepo.getByUuid(user.uuid);
		expect(updatedUser?.roles).toContain(Role.CANDIDATE);
	});

	test("get-questionnaire: возвращает анкету владельцу", async () => {
		const user = makeUser();
		await userRepo.save(user);

		const created = (await mod.handle({
			name: "start-questionnaire",
			attrs: { userId: user.uuid },
			actorId: user.uuid,
		})) as { uuid: string };

		const result = await mod.handle({
			name: "get-questionnaire",
			attrs: { uuid: created.uuid },
			actorId: user.uuid,
		});

		expect((result as { uuid: string }).uuid).toBe(created.uuid);
	});

	test("get-questionnaire: отклоняет чужаку", async () => {
		const user = makeUser();
		const stranger = makeUser();
		await userRepo.save(user);
		await userRepo.save(stranger);

		const created = (await mod.handle({
			name: "start-questionnaire",
			attrs: { userId: user.uuid },
			actorId: user.uuid,
		})) as { uuid: string };

		await expect(
			mod.handle({
				name: "get-questionnaire",
				attrs: { uuid: created.uuid },
				actorId: stranger.uuid,
			}),
		).rejects.toThrow("Нет доступа к анкете");
	});

	test("abandon-questionnaire: прерывает анкету", async () => {
		const user = makeUser();
		await userRepo.save(user);

		const created = (await mod.handle({
			name: "start-questionnaire",
			attrs: { userId: user.uuid },
			actorId: user.uuid,
		})) as { uuid: string };

		const result = await mod.handle({
			name: "abandon-questionnaire",
			attrs: { uuid: created.uuid },
			actorId: user.uuid,
		});

		expect((result as { status: string }).status).toBe("abandoned");
	});

	test("list-questionnaires-by-user: ADMIN видит все анкеты", async () => {
		const admin = makeUser({ roles: [Role.ADMIN] });
		const user = makeUser();
		await userRepo.save(admin);
		await userRepo.save(user);

		await mod.handle({
			name: "start-questionnaire",
			attrs: { userId: user.uuid },
			actorId: user.uuid,
		});

		const result = await mod.handle({
			name: "list-questionnaires-by-user",
			attrs: { userId: user.uuid },
			actorId: admin.uuid,
		});

		const list = result as { userId: string }[];
		expect(list.length).toBeGreaterThanOrEqual(1);
		expect(list.some((q) => q.userId === user.uuid)).toBe(true);
	});
});
