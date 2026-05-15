import { describe, expect, mock, test } from "bun:test";
import type { User } from "@u7/user/domain";
import { Role } from "@u7/user/domain";
import type { Questionnaire } from "#domain/questionnaire/entity";
import type { QuestionnaireRepo } from "#domain/questionnaire/repo";
import { ListQuestionnairesByUserUc } from "./list-questionnaires-by-user-uc";
import type { QuestionPoolService } from "#domain/index";
import type { BaseJsonDb } from "packages/core/src/infra";

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

function makeQuestionnaires(userId: string, count = 2): Questionnaire[] {
  return Array.from({ length: count }, (_, i) => ({
    uuid: crypto.randomUUID(),
    userId,
    status: i === 0 ? "in_progress" : "completed",
    answers: [],
    currentQuestionCode: "q1",
    createdAt: "2026-05-01T12:00",
  }));
}

function setupUc(questionnaires: Questionnaire[] = []) {
  const save = mock(async () => { });
  const getByUuid = mock(async () => undefined);
  const getByUserId = mock(async (_userId: string) =>
    questionnaires.filter((q) => q.userId === _userId),
  );

  const repo: QuestionnaireRepo = {
    save,
    getByUuid,
    getByUserId,
  };

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

  const uc = new ListQuestionnairesByUserUc();
  uc.init({
    questionnaireRepo: repo,
    questionPoolService: {} as QuestionPoolService,
    includedQuestionCodes: [],
    userFacade,
    db: {
      begin: () => { },
      commit: async () => { },
      rollback: () => { },
    } as BaseJsonDb,
  });

  return { getUserByUuid, uc };
}

describe("ListQuestionnairesByUserUc", () => {
  describe("SUCCESS", () => {
    test("владелец видит свои анкеты", async () => {
      const user = makeUser();
      const questionnaires = makeQuestionnaires(user.uuid, 2);
      const { getUserByUuid, uc } = setupUc(questionnaires);

      getUserByUuid.mockResolvedValueOnce(user);

      const result = await uc.handle({ userId: user.uuid }, user.uuid);
      expect(result).toHaveLength(2);
    });

    test("ADMIN видит анкеты любого пользователя", async () => {
      const admin = makeUser({ roles: [Role.ADMIN] });
      const target = makeUser();
      const questionnaires = makeQuestionnaires(target.uuid, 3);
      const { getUserByUuid, uc } = setupUc(questionnaires);

      getUserByUuid.mockResolvedValueOnce(admin);

      const result = await uc.handle({ userId: target.uuid }, admin.uuid);
      expect(result).toHaveLength(3);
    });
  });

  describe("FAIL", () => {
    test("отклоняет при отсутствии авторизации", async () => {
      const user = makeUser();
      const { uc } = setupUc();

      await expect(uc.handle({ userId: user.uuid })).rejects.toThrow(
        "Требуется авторизация",
      );
    });

    test("отклоняет просмотр чужих анкет", async () => {
      const user = makeUser();
      const other = makeUser();
      const { getUserByUuid, uc } = setupUc();

      getUserByUuid.mockResolvedValueOnce(user);

      await expect(
        uc.handle({ userId: other.uuid }, user.uuid),
      ).rejects.toThrow("Недостаточно прав");
    });
  });
});
