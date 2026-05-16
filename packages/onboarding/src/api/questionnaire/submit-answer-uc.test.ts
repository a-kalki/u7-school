import { describe, expect, mock, test } from 'bun:test';
import type { BaseJsonDb } from 'packages/core/src/infra';
import { QuestionPoolService } from '#domain/questionnaire/question-pool-service';
import type { Questionnaire } from '#domain/questionnaire/entity';
import type { QuestionnaireRepo } from '#domain/questionnaire/repo';
import { SubmitAnswerUc } from './submit-answer-uc';
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

  const ensureUserWithRole = mock(async () => undefined);
  const userFacade = { ensureUserWithRole } as unknown as UserFacade;

  const poolService = new QuestionPoolService([
    {
      question: 'Q1',
      questionCode: 'q1',
      type: 'choice',
      multiple: false,
      answers: [{ answer: 'Yes', answerCode: 'yes' }],
    },
  ]);

  const uc = new SubmitAnswerUc();
  uc.init({
    questionnaireRepo: repo,
    questionPoolService: poolService,
    includedQuestionCodes: ['q1'],
    userFacade,
    db: {
      begin: () => {},
      commit: async () => {},
      rollback: () => {},
    } as BaseJsonDb,
  });

  return { uc, save, ensureUserWithRole };
}

describe('SubmitAnswerUc', () => {
  describe('SUCCESS', () => {
    test('отправляет ответ и завершает анкету', async () => {
      const q = makeQuestionnaire();
      const { uc, save, ensureUserWithRole } = setupUc(q);

      const result = await uc.handle({
        questionnaireUuid: q.uuid,
        questionCode: 'q1',
        value: 'yes',
      });

      expect(result.status).toBe('completed');
      expect(save).toHaveBeenCalled();
      expect(ensureUserWithRole).toHaveBeenCalledWith(12345, 'CANDIDATE');
    });
  });

  describe('FAIL', () => {
    test('отклоняет для несуществующей анкеты', async () => {
      const { uc } = setupUc();

      await expect(
        uc.handle({ questionnaireUuid: crypto.randomUUID(), questionCode: 'q1', value: 'yes' }),
      ).rejects.toThrow('Анкета не найдена');
    });

    test('отклоняет ответ на завершённую анкету', async () => {
      const q = makeQuestionnaire({ status: 'completed' });
      const { uc } = setupUc(q);

      await expect(
        uc.handle({ questionnaireUuid: q.uuid, questionCode: 'q1', value: 'yes' }),
      ).rejects.toThrow('Анкета уже завершена');
    });
  });
});
