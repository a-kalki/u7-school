import { describe, expect, mock, test } from 'bun:test';
import type { BaseJsonDb } from '@u7-scl/core/infra';
import type { UserFacade } from '@u7-scl/user/domain';
import { QuestionPoolService } from '#domain/questionnaire/question-pool-service';
import type { QuestionnaireRepo } from '#domain/questionnaire/repo';
import type { QuestionnaireActionResponse } from '#domain/questionnaire/types';
import { StartUc } from './start-uc';

const actorId = 'bot-admin-uuid';

function setupUc(activeQuestionnaires: any[] = []) {
  const save = mock(async () => {});
  const getByTelegramId = mock(async () => activeQuestionnaires);

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

  const uc = new StartUc();
  uc.init({
    questionnaireRepo: repo,
    questionPoolService: poolService,
    userFacade: {} as UserFacade,
    db: {} as BaseJsonDb,
  });

  return { uc, save };
}

describe('StartUc', () => {
  test('создаёт анкету и сохраняет', async () => {
    const { uc, save } = setupUc();
    const result = await uc.handle({ telegramId: 12345 }, actorId);
    expect(result.type === 'completed' || result.type === 'new_question').toBe(
      true,
    );
    if (result.type === 'new_question') {
      expect(result.question.questionCode).toBe('q1');
    }
    expect(save).toHaveBeenCalledTimes(1);
  });

  test('отклоняет невалидную команду', async () => {
    const { uc } = setupUc();
    await expect(uc.handle({ telegramId: -1 })).rejects.toThrow();
  });

  test('отказывает, если у пользователя уже есть активная анкета', async () => {
    const active = {
      uuid: crypto.randomUUID(),
      telegramId: 12345,
      status: 'in_progress',
      answers: [],
      currentQuestionCode: 'q1',
      createdAt: '2026-05-01T12:00',
    };
    const { uc } = setupUc([active]);
    await expect(uc.handle({ telegramId: 12345 }, actorId)).rejects.toThrow(
      'У тебя уже есть активная анкета',
    );
  });
});
