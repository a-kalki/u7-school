import { describe, expect, mock, test } from 'bun:test';
import type { BaseJsonDb } from 'packages/core/src/infra';
import type { QuestionPoolService } from '#domain/index';
import type { Questionnaire } from '#domain/questionnaire/entity';
import type { QuestionnaireRepo } from '#domain/questionnaire/repo';
import { ListQuestionnairesByTelegramIdUc } from './list-questionnaires-by-telegram-id-uc';
import type { UserFacade } from '@u7/user/domain';

function makeQuestionnaires(telegramId: number, count = 2): Questionnaire[] {
  return Array.from({ length: count }, (_, i) => ({
    uuid: crypto.randomUUID(),
    telegramId,
    status: i === 0 ? 'in_progress' : 'completed',
    answers: [],
    currentQuestionCode: 'q1',
    createdAt: '2026-05-01T12:00',
  }));
}

function setupUc(questionnaires: Questionnaire[] = []) {
  const save = mock(async () => {});
  const getByUuid = mock(async () => undefined);
  const getByTelegramId = mock(async (_telegramId: number) =>
    questionnaires.filter((q) => q.telegramId === _telegramId),
  );

  const repo: QuestionnaireRepo = {
    save,
    getByUuid,
    getByTelegramId,
  };

  const userFacade = {} as UserFacade;

  const uc = new ListQuestionnairesByTelegramIdUc();
  uc.init({
    questionnaireRepo: repo,
    questionPoolService: {} as QuestionPoolService,
    includedQuestionCodes: [],
    userFacade,
    db: {
      begin: () => {},
      commit: async () => {},
      rollback: () => {},
    } as BaseJsonDb,
  });

  return { uc };
}

describe('ListQuestionnairesByTelegramIdUc', () => {
  describe('SUCCESS', () => {
    test('видит свои анкеты', async () => {
      const questionnaires = makeQuestionnaires(12345, 2);
      const { uc } = setupUc(questionnaires);

      const result = await uc.handle({ telegramId: 12345 });
      expect(result).toHaveLength(2);
    });
  });
});
