import { describe, expect, mock, test } from 'bun:test';
import type { BaseJsonDb } from '@u7/core/infra';
import type { UserFacade } from '@u7/user/domain';
import type { Questionnaire } from '#domain/questionnaire/entity';
import { QuestionPoolService } from '#domain/questionnaire/question-pool-service';
import type { QuestionnaireRepo } from '#domain/questionnaire/repo';
import { AbandonQuestionnaireUc } from './abandon-questionnaire-uc';

function setupUc(questionnaire?: Questionnaire) {
  const getByUuid = mock(async () => questionnaire);
  const save = mock(async () => { });
  const repo: QuestionnaireRepo = {
    save,
    getByUuid,
    getByTelegramId: mock(async () => []),
  };

  const uc = new AbandonQuestionnaireUc();
  uc.init({
    questionnaireRepo: repo,
    questionPoolService: new QuestionPoolService([], []),
    userFacade: {} as unknown as UserFacade,
    db: {} as BaseJsonDb,
  });

  return { uc, save };
}

const questionnaire: Questionnaire = {
  uuid: '11111111-1111-1111-1111-111111111111',
  telegramId: 12345,
  status: 'in_progress',
  answers: [],
  currentQuestionCode: 'q1',
  createdAt: '2026-05-01T12:00',
};

describe('AbandonQuestionnaireUc', () => {
  test('прерывает анкету', async () => {
    const { uc, save } = setupUc(questionnaire);
    const result = await uc.handle({ uuid: questionnaire.uuid });
    expect(result.status).toBe('abandoned');
    expect(save).toHaveBeenCalledTimes(1);
  });

  test('отклоняет для несуществующей анкеты', async () => {
    const { uc } = setupUc(undefined);
    await expect(uc.handle({ uuid: questionnaire.uuid })).rejects.toThrow();
  });
});
