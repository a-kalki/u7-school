import { describe, expect, mock, test } from 'bun:test';
import type { BaseJsonDb } from '@u7-scl/core/infra';
import type { UserFacade } from '@u7-scl/user/domain';
import type { Questionnaire } from '#domain/questionnaire/entity';
import { QuestionPoolService } from '#domain/questionnaire/question-pool-service';
import type { QuestionnaireRepo } from '#domain/questionnaire/repo';
import { AbandonUc } from './abandon-uc';

function setupUc(questionnaires: Questionnaire[] = []) {
  const getByTelegramId = mock(async () => questionnaires);
  const save = mock(async () => {});
  const repo: QuestionnaireRepo = {
    save,
    getByUuid: mock(async () => undefined),
    getByTelegramId,
  };

  const uc = new AbandonUc();
  uc.init({
    questionnaireRepo: repo,
    questionPoolService: new QuestionPoolService([], []),
    userFacade: {} as unknown as UserFacade,
    db: {} as BaseJsonDb,
  });

  return { uc, save };
}

const activeQuestionnaire: Questionnaire = {
  uuid: '11111111-1111-1111-1111-111111111111',
  telegramId: 12345,
  status: 'in_progress',
  answers: [],
  currentQuestionCode: 'q1',
  createdAt: '2026-05-01T12:00',
};

describe('AbandonUc', () => {
  test('прерывает активную анкету по telegramId', async () => {
    const { uc, save } = setupUc([activeQuestionnaire]);
    const result = await uc.handle({ telegramId: 12345 }, 'bot-uuid');
    expect(result.type).toBe('completed');
    expect(save).toHaveBeenCalledTimes(1);
  });

  test('отклоняет если нет активной анкеты', async () => {
    const { uc } = setupUc([]);
    await expect(uc.handle({ telegramId: 99999 }, 'bot-uuid')).rejects.toThrow(
      'У тебя нет активной анкеты',
    );
  });

  test('игнорирует завершённые анкеты', async () => {
    const completed: Questionnaire = {
      ...activeQuestionnaire,
      uuid: '22222222-2222-2222-2222-222222222222',
      status: 'completed',
    };
    const { uc } = setupUc([completed]);
    await expect(uc.handle({ telegramId: 12345 }, 'bot-uuid')).rejects.toThrow(
      'У тебя нет активной анкеты',
    );
  });
});
