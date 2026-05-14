import { describe, expect, mock, test } from "bun:test";
import type { User } from "@u7/user/domain";
import { Role } from "@u7/user/domain";
import type { Questionnaire } from "#domain/questionnaire/entity";
import type { Question } from "#domain/questionnaire/question";
import { QuestionPoolService } from "#domain/questionnaire/question-pool-service";
import type { QuestionnaireRepo } from "#domain/questionnaire/repo";
import { AbandonQuestionnaireUc } from "./abandon-questionnaire-uc";

function makeUser(overrides: Partial<User> = {}): User {
	return {
		uuid: crypto.randomUUID(),
		name: "Тест",
		telegramId: 1,
		roles: [Role.GUEST],
		createdAt: "2026-05-01T12:00",
		...overrides,
	};
}

const testPool: Question[] = [
	{
		question: "Первый вопрос",
		questionCode: "q1",
		type: "choice",
		multiple: false,
		answers: [{ answer: "Да", answerCode: "yes" }],
	},
];

function makeQuestionnaire(
	overrides: Partial<Questionnaire> = {},
): Questionnaire {
	return {
		uuid: crypto.randomUUID(),
		userId: "owner-uuid",
		status: "in_progress",
		answers: [],
		currentQuestionCode: "q1",
		createdAt: "2026-05-01T12:00",
		...overrides,
	};
}

function setupUc(initialQuestionnaire?: Questionnaire) {
	const save = mock(async () => {});
	const getByUuid = mock(async (uuid: string) =>
		initialQuestionnaire?.uuid === uuid ? initialQuestionnaire : undefined,
	);
	const getByUserId = mock(async () => []);

	const repo: QuestionnaireRepo = {
		save,
		getByUuid,
		getByUserId,
	};

	const poolService = new QuestionPoolService(testPool);

	const getUserByUuid = mock(
		async (_uuid: string): Promise<User | undefined> => undefined,
	);
	const userExists = mock(async () => false);
	const addRoleToUser = mock(async () => undefined);

	const userFacade = {
		getUserByUuid,
		userExists,
		addRoleToUser,
	};

	const uc = new AbandonQuestionnaireUc();
	uc.init({
		questionnaireRepo: repo,
		questionPoolService: poolService,
		includedQuestionCodes: testPool.map((q) => q.questionCode),
		userFacade,
		db: { begin: () => {}, commit: async () => {}, rollback: () => {} } as any,
	});

	return { save, getUserByUuid, uc };
}

describe("AbandonQuestionnaireUc", () => {
	describe("SUCCESS", () => {
		test("владелец прерывает анкету", async () => {
			const q = makeQuestionnaire();
			const { getUserByUuid, save, uc } = setupUc(q);
			const user = makeUser({ uuid: q.userId });

			getUserByUuid.mockResolvedValueOnce(user);

			const result = await uc.handle({ uuid: q.uuid }, user.uuid);
			expect(result.status).toBe("abandoned");
			expect(save).toHaveBeenCalledTimes(1);
		});

		test("ADMIN прерывает чужую анкету", async () => {
			const q = makeQuestionnaire();
			const { getUserByUuid, save, uc } = setupUc(q);
			const admin = makeUser({ roles: [Role.ADMIN] });

			getUserByUuid.mockResolvedValueOnce(admin);

			const result = await uc.handle({ uuid: q.uuid }, admin.uuid);
			expect(result.status).toBe("abandoned");
			expect(save).toHaveBeenCalledTimes(1);
		});
	});

	describe("FAIL", () => {
		test("отклоняет при отсутствии авторизации", async () => {
			const q = makeQuestionnaire();
			const { uc } = setupUc(q);

			await expect(uc.handle({ uuid: q.uuid })).rejects.toThrow(
				"Требуется авторизация",
			);
		});

		test("отклоняет для несуществующей анкеты", async () => {
			const { getUserByUuid, uc } = setupUc();
			const user = makeUser();

			getUserByUuid.mockResolvedValueOnce(user);

			await expect(
				uc.handle({ uuid: crypto.randomUUID() }, user.uuid),
			).rejects.toThrow("Анкета не найдена");
		});

		test("отклоняет чужую анкету для обычного пользователя", async () => {
			const q = makeQuestionnaire();
			const { getUserByUuid, uc } = setupUc(q);
			const other = makeUser({ uuid: "other-uuid" });

			getUserByUuid.mockResolvedValueOnce(other);

			await expect(uc.handle({ uuid: q.uuid }, other.uuid)).rejects.toThrow(
				"Недостаточно прав",
			);
		});
	});
});
