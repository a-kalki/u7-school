import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7/user/domain';
import { Role } from '@u7/user/domain';
import type { BaseJsonDb } from 'packages/core/src/infra';
import type { Question } from '#domain/questionnaire/question';
import { QuestionPoolService } from '#domain/questionnaire/question-pool-service';
import type { QuestionnaireRepo } from '#domain/questionnaire/repo';
import { StartQuestionnaireUc } from './start-questionnaire-uc';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    uuid: crypto.randomUUID(),
    name: 'Тест',
    telegramId: 1,
    roles: [Role.GUEST],
    createdAt: '2026-05-01T12:00',
    ...overrides,
  };
}

const testPool: Question[] = [
  {
    question: 'Первый вопрос',
    questionCode: 'q1',
    type: 'choice',
    multiple: false,
    answers: [{ answer: 'Да', answerCode: 'yes' }],
  },
];

function setupUc() {
  const save = mock(async () => {});
  const getByUuid = mock(async () => undefined);
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

  const uc = new StartQuestionnaireUc();
  uc.init({
    questionnaireRepo: repo,
    questionPoolService: poolService,
    includedQuestionCodes: testPool.map((q) => q.questionCode),
    userFacade,
    db: {
      begin: () => {},
      commit: async () => {},
      rollback: () => {},
    } as BaseJsonDb,
  });

  return { save, getUserByUuid, uc, repo };
}

describe('StartQuestionnaireUc', () => {
  describe('SUCCESS', () => {
    test('пользователь начинает анкету для себя', async () => {
      const { getUserByUuid, save, uc } = setupUc();
      const user = makeUser();

      getUserByUuid.mockResolvedValueOnce(user);

      const result = await uc.handle({ userId: user.uuid }, user.uuid);

      expect(result.userId).toBe(user.uuid);
      expect(result.status).toBe('in_progress');
      expect(result.currentQuestionCode).toBe('q1');
      expect(save).toHaveBeenCalledTimes(1);
    });

    test('ADMIN может начать анкету для другого', async () => {
      const { getUserByUuid, save, uc } = setupUc();
      const admin = makeUser({ roles: [Role.ADMIN] });
      const target = makeUser();

      getUserByUuid.mockResolvedValueOnce(admin);

      const result = await uc.handle({ userId: target.uuid }, admin.uuid);

      expect(result.userId).toBe(target.uuid);
      expect(save).toHaveBeenCalledTimes(1);
    });
  });

  describe('FAIL', () => {
    test('отклоняет при отсутствии авторизации', async () => {
      const { uc } = setupUc();

      await expect(uc.handle({ userId: 'any' })).rejects.toThrow(
        'Требуется авторизация',
      );
    });

    test('отклоняет, если пользователь пытается создать анкету для другого', async () => {
      const { getUserByUuid, uc } = setupUc();
      const user = makeUser();

      getUserByUuid.mockResolvedValueOnce(user);

      await expect(
        uc.handle({ userId: crypto.randomUUID() }, user.uuid),
      ).rejects.toThrow('Недостаточно прав');
    });

    test('отклоняет невалидную команду', async () => {
      const { getUserByUuid, uc } = setupUc();
      const user = makeUser();

      getUserByUuid.mockResolvedValueOnce(user);

      await expect(uc.handle({ userId: '' }, user.uuid)).rejects.toThrow(
        'Переданы некорректные данные',
      );
    });

    test('отказывает, если у пользователя уже есть активная анкета', async () => {
      const { getUserByUuid, uc, repo } = setupUc();
      const user = makeUser();

      getUserByUuid.mockResolvedValueOnce(user);

      // Мокаем repo.getByUserId чтобы вернуть активную анкету
      const activeQuestionnaire = {
        uuid: crypto.randomUUID(),
        userId: user.uuid,
        status: 'in_progress' as const,
        answers: [],
        currentQuestionCode: 'q1',
        createdAt: '2026-05-01T12:00',
      };
      repo.getByUserId = mock(async () => [activeQuestionnaire]);

      await expect(uc.handle({ userId: user.uuid }, user.uuid)).rejects.toThrow(
        'У пользователя уже есть активная анкета',
      );
    });
  });
});
