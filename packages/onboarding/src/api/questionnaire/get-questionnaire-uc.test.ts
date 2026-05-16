import { describe, expect, mock, test } from 'bun:test';
import type { BaseJsonDb } from 'packages/core/src/infra';
import type { QuestionPoolService } from '#domain/index';
import type { Questionnaire } from '#domain/questionnaire/entity';
import type { QuestionnaireRepo } from '#domain/questionnaire/repo';
import { GetQuestionnaireUc } from './get-questionnaire-uc';
import type { UserFacade } from '@u7/user/domain';

function makeQuestionnaire(overrides: Partial<Questionnaire> = {}): Questionnaire {
  return {
    uuid: crypto.randomUUID(),
    telegramId: 12345,
    status: 'in_progress',
    answers: [],
    currentQuestionCode: 'q1',
    createdAt: '2026-05-01T12:00',
    ...overrides,
  };
}

function setupUc(questionnaire?: Questionnaire) {
  const save = mock(async () => {});
  const getByUuid = mock(async (_uuid: string) =>
    questionnaire?.uuid === _uuid ? questionnaire : undefined,
  );
  const getByTelegramId = mock(async () => []);

  const repo: QuestionnaireRepo = {
    save,
    getByUuid,
    getByTelegramId,
  };

  const userFacade = {} as UserFacade;

  const uc = new GetQuestionnaireUc();
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

describe('GetQuestionnaireUc', () => {
  describe('SUCCESS', () => {
    test('возвращает анкету', async () => {
      const q = makeQuestionnaire();
      const { uc } = setupUc(q);

      const result = await uc.handle({ uuid: q.uuid });
      expect(result.uuid).toBe(q.uuid);
    });
  });

  describe('FAIL', () => {
    test('отклоняет для несуществующей анкеты', async () => {
      const { uc } = setupUc();

      await expect(uc.handle({ uuid: crypto.randomUUID() })).rejects.toThrow(
        'Анкета не найдена',
      );
    });
  });
});
