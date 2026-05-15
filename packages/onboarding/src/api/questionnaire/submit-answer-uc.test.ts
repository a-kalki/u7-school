import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7/user/domain';
import { Role } from '@u7/user/domain';
import type { BaseJsonDb } from 'packages/core/src/infra';
import type { Questionnaire } from '#domain/questionnaire/entity';
import type { Question } from '#domain/questionnaire/question';
import { QuestionPoolService } from '#domain/questionnaire/question-pool-service';
import type { QuestionnaireRepo } from '#domain/questionnaire/repo';
import { SubmitAnswerUc } from './submit-answer-uc';

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
    answers: [
      { answer: 'Да', answerCode: 'yes' },
      { answer: 'Нет', answerCode: 'no' },
    ],
  },
  {
    question: 'Второй вопрос',
    questionCode: 'q2',
    type: 'text',
  },
];

function makeQuestionnaire(
  overrides: Partial<Questionnaire> = {},
): Questionnaire {
  return {
    uuid: crypto.randomUUID(),
    userId: 'owner-uuid',
    status: 'in_progress',
    answers: [],
    currentQuestionCode: 'q1',
    createdAt: '2026-05-01T12:00',
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

  const uc = new SubmitAnswerUc();
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

  return { save, getByUuid, getUserByUuid, addRoleToUser, uc };
}

describe('SubmitAnswerUc', () => {
  describe('SUCCESS', () => {
    test('владелец отправляет ответ, анкета продолжается', async () => {
      const q = makeQuestionnaire();
      const { getUserByUuid, save, uc } = setupUc(q);
      const user = makeUser({ uuid: q.userId });

      getUserByUuid.mockResolvedValueOnce(user);

      const result = await uc.handle(
        { questionnaireUuid: q.uuid, questionCode: 'q1', value: 'yes' },
        user.uuid,
      );

      expect(result.status).toBe('in_progress');
      expect(result.currentQuestionCode).toBe('q2');
      expect(save).toHaveBeenCalledTimes(1);
    });

    test('владелец завершает анкету, добавляется роль CANDIDATE', async () => {
      const q = makeQuestionnaire();
      const { getUserByUuid, save, addRoleToUser, uc } = setupUc(q);
      const user = makeUser({ uuid: q.userId });

      getUserByUuid.mockResolvedValueOnce(user);

      const result = await uc.handle(
        { questionnaireUuid: q.uuid, questionCode: 'q1', value: 'yes' },
        user.uuid,
      );

      // Отвечаем на последний вопрос
      q.status = result.status;
      q.answers = result.answers;
      q.currentQuestionCode = result.currentQuestionCode;

      getUserByUuid.mockResolvedValueOnce(user);

      const finalResult = await uc.handle(
        { questionnaireUuid: q.uuid, questionCode: 'q2', value: 'hello' },
        user.uuid,
      );

      expect(finalResult.status).toBe('completed');
      expect(addRoleToUser).toHaveBeenCalledWith(
        q.userId,
        Role.CANDIDATE,
        user.uuid,
      );
      expect(save).toHaveBeenCalledTimes(2);
    });

    test('ADMIN отправляет ответ за другого', async () => {
      const q = makeQuestionnaire();
      const { getUserByUuid, save, uc } = setupUc(q);
      const admin = makeUser({ roles: [Role.ADMIN] });

      getUserByUuid.mockResolvedValueOnce(admin);

      const result = await uc.handle(
        { questionnaireUuid: q.uuid, questionCode: 'q1', value: 'yes' },
        admin.uuid,
      );

      expect(result.status).toBe('in_progress');
      expect(save).toHaveBeenCalledTimes(1);
    });
  });

  describe('FAIL', () => {
    test('отклоняет при отсутствии авторизации', async () => {
      const q = makeQuestionnaire();
      const { uc } = setupUc(q);

      await expect(
        uc.handle({
          questionnaireUuid: q.uuid,
          questionCode: 'q1',
          value: 'yes',
        }),
      ).rejects.toThrow('Требуется авторизация');
    });

    test('отклоняет для несуществующей анкеты', async () => {
      const { getUserByUuid, uc } = setupUc();
      const user = makeUser();

      getUserByUuid.mockResolvedValueOnce(user);

      await expect(
        uc.handle(
          {
            questionnaireUuid: crypto.randomUUID(),
            questionCode: 'q1',
            value: 'yes',
          },
          user.uuid,
        ),
      ).rejects.toThrow('Анкета не найдена');
    });

    test('отклоняет, если не владелец', async () => {
      const q = makeQuestionnaire();
      const { getUserByUuid, uc } = setupUc(q);
      const other = makeUser({ uuid: 'other-uuid' });

      getUserByUuid.mockResolvedValueOnce(other);

      await expect(
        uc.handle(
          { questionnaireUuid: q.uuid, questionCode: 'q1', value: 'yes' },
          other.uuid,
        ),
      ).rejects.toThrow('Недостаточно прав');
    });

    test('отклоняет ответ на завершённую анкету', async () => {
      const q = makeQuestionnaire({ status: 'completed' });
      const { getUserByUuid, uc } = setupUc(q);
      const user = makeUser({ uuid: q.userId });

      getUserByUuid.mockResolvedValueOnce(user);

      await expect(
        uc.handle(
          { questionnaireUuid: q.uuid, questionCode: 'q1', value: 'yes' },
          user.uuid,
        ),
      ).rejects.toThrow('Недостаточно прав');
    });
  });
});
