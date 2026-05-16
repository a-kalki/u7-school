import { describe, expect, mock, spyOn, test } from 'bun:test';
import type { BaseJsonDb } from '@u7/core/infra';
import { Role, type UserFacade } from '@u7/user/domain';
import type { Questionnaire } from '#domain/questionnaire/entity';
import { QuestionPoolService } from '#domain/questionnaire/question-pool-service';
import type { QuestionnaireRepo } from '#domain/questionnaire/repo';
import { HandleOnboardingActionUc } from './handle-onboarding-action-uc';

function setupUc(active?: Questionnaire) {
  const save = mock(async () => {});
  const getByTelegramId = mock(async () => (active ? [active] : []));

  const repo: QuestionnaireRepo = {
    save,
    getByUuid: mock(async () => undefined),
    getByTelegramId,
  };

  const poolService = new QuestionPoolService(
    [
      {
        question: 'Q1',
        questionCode: 'q1',
        type: 'choice',
        multiple: false,
        answers: [{ answer: 'Yes', answerCode: 'yes' }],
      },
    ],
    ['q1'],
  );

  const addRoleToUser = mock(async () => ({
    uuid: 'user-uuid',
    roles: [Role.GUEST, Role.CANDIDATE],
  }));

  const userFacade = {
    getUserByTelegramId: mock(async () => ({
      uuid: 'user-uuid',
      telegramId: 12345,
      roles: [Role.GUEST],
    })),
    addRoleToUser,
    getUserByUuid: mock(async () => undefined),
    userExists: mock(async () => false),
    registerGuest: mock(async () => ({})),
    ensureUserWithRole: mock(async () => {}),
  } as unknown as UserFacade;

  const uc = new HandleOnboardingActionUc();
  uc.init({
    questionnaireRepo: repo,
    questionPoolService: poolService,
    userFacade: userFacade,
    db: {} as BaseJsonDb,
  });

  return { uc, save, userFacade };
}

const actorId = 'bot-admin-uuid';

describe('HandleOnboardingActionUc', () => {
  test('обрабатывает ответ и выдаёт роль CANDIDATE при завершении', async () => {
    const active: Questionnaire = {
      uuid: crypto.randomUUID(),
      telegramId: 12345,
      status: 'in_progress',
      answers: [],
      currentQuestionCode: 'q1',
      createdAt: '2026-05-01T12:00',
    };
    const { uc, save, userFacade } = setupUc(active);

    const result = await uc.handle(
      {
        telegramId: 12345,
        questionCode: 'q1',
        value: 'yes',
      },
      actorId,
    );

    expect(result.type).toBe('completed');
    expect(save).toHaveBeenCalledTimes(1);
    expect(userFacade.getUserByTelegramId).toHaveBeenCalledWith(12345, actorId);
    expect(userFacade.addRoleToUser).toHaveBeenCalledWith(
      'user-uuid',
      Role.CANDIDATE,
      actorId,
    );
  });

  test('бросает ошибку если анкеты нет', async () => {
    const { uc } = setupUc();
    await expect(
      uc.handle({ telegramId: 999, questionCode: 'q1', value: 'yes' }, actorId),
    ).rejects.toThrow('У тебя нет активной анкеты');
  });

  test('бросает ошибку при неверном коде вопроса', async () => {
    const active: Questionnaire = {
      uuid: crypto.randomUUID(),
      telegramId: 12345,
      status: 'in_progress',
      answers: [],
      currentQuestionCode: 'q1',
      createdAt: '2026-05-01T12:00',
    };
    const { uc } = setupUc(active);
    await expect(
      uc.handle(
        { telegramId: 12345, questionCode: 'wrong', value: 'yes' },
        actorId,
      ),
    ).rejects.toThrow('Ожидался вопрос');
  });

  test('не падает если фасад упал (анкета завершается)', async () => {
    const active: Questionnaire = {
      uuid: crypto.randomUUID(),
      telegramId: 12345,
      status: 'in_progress',
      answers: [],
      currentQuestionCode: 'q1',
      createdAt: '2026-05-01T12:00',
    };
    const { uc, userFacade } = setupUc(active);
    spyOn(userFacade, 'getUserByTelegramId').mockRejectedValue(
      new Error('DB Down'),
    );

    const result = await uc.handle(
      {
        telegramId: 12345,
        questionCode: 'q1',
        value: 'yes',
      },
      actorId,
    );

    expect(result.type).toBe('completed');
  });
});
