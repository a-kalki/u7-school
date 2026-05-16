import { describe, expect, mock, test } from 'bun:test';
import type { BaseJsonDb } from '@u7/core/infra';
import type { UserFacade } from '@u7/user/domain';
import { QuestionPoolService } from '#domain/questionnaire/question-pool-service';
import type { QuestionnaireRepo } from '#domain/questionnaire/repo';
import { ListQuestionnairesByTelegramIdUc } from './list-questionnaires-by-telegram-id-uc';

function setupUc() {
  const getByTelegramId = mock(async () => []);

  const repo: QuestionnaireRepo = {
    save: mock(async () => { }),
    getByUuid: mock(async () => undefined),
    getByTelegramId,
  };

  const uc = new ListQuestionnairesByTelegramIdUc();
  uc.init({
    questionnaireRepo: repo,
    questionPoolService: new QuestionPoolService([], []),
    userFacade: {} as unknown as UserFacade,
    db: {} as BaseJsonDb,
  });

  return { uc, getByTelegramId };
}

describe('ListQuestionnairesByTelegramIdUc', () => {
  test('вызывает repo.getByTelegramId', async () => {
    const { uc, getByTelegramId } = setupUc();
    await uc.handle({ telegramId: 12345 });
    expect(getByTelegramId).toHaveBeenCalledWith(12345);
  });
});
