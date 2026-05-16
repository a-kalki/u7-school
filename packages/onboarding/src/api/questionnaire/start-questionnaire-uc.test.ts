import { describe, expect, mock, test } from 'bun:test';
import type { BaseJsonDb } from 'packages/core/src/infra';
import { QuestionPoolService } from '#domain/questionnaire/question-pool-service';
import type { Questionnaire } from '#domain/questionnaire/entity';
import type { QuestionnaireRepo } from '#domain/questionnaire/repo';
import { StartQuestionnaireUc } from './start-questionnaire-uc';
import type { UserFacade } from '@u7/user/domain';

function setupUc(activeQuestionnaires: Questionnaire[] = []) {
  const save = mock(async () => {});
  const getByUuid = mock(async () => undefined);
  const getByTelegramId = mock(async () => activeQuestionnaires);

  const repo: QuestionnaireRepo = {
    save,
    getByUuid,
    getByTelegramId,
  };

  const poolService = new QuestionPoolService([
    {
      question: 'Q1',
      questionCode: 'q1',
      type: 'choice',
      multiple: false,
      answers: [{ answer: 'Yes', answerCode: 'yes' }],
    },
  ]);

  const userFacade = {} as UserFacade;

  const uc = new StartQuestionnaireUc();
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

  return { uc, save, repo };
}

describe('StartQuestionnaireUc', () => {
  describe('SUCCESS', () => {
    test('пользователь начинает анкету для себя', async () => {
      const { uc, save } = setupUc();

      const result = await uc.handle({ telegramId: 12345 });

      expect(result.telegramId).toBe(12345);
      expect(result.status).toBe('in_progress');
      expect(result.currentQuestionCode).toBe('q1');
      expect(save).toHaveBeenCalled();
    });
  });

  describe('FAIL', () => {
    test('отклоняет невалидную команду', async () => {
      const { uc } = setupUc();

      await expect(uc.handle({ telegramId: -1 })).rejects.toThrow();
    });

    test('отказывает, если у пользователя уже есть активная анкета', async () => {
      const activeQuestionnaire: Questionnaire = {
        uuid: crypto.randomUUID(),
        telegramId: 12345,
        status: 'in_progress',
        answers: [],
        currentQuestionCode: 'q1',
        createdAt: '2026-05-01T12:00',
      };
      
      const { uc } = setupUc([activeQuestionnaire]);

      await expect(uc.handle({ telegramId: 12345 })).rejects.toThrow(
        'У тебя уже есть активная анкета',
      );
    });
  });
});
