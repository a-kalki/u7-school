import { describe, expect, mock, test } from 'bun:test';
import type { BaseJsonDb } from '@u7/core/infra';
import type { UserFacade } from '@u7/user/domain';
import type { Questionnaire } from '#domain/questionnaire/entity';
import { QuestionPoolService } from '#domain/questionnaire/question-pool-service';
import type { QuestionnaireRepo } from '#domain/questionnaire/repo';
import { GetCurrentQuestionUc } from './get-current-question-uc';

const actorId = 'bot-admin-uuid';

function makeQuestionnaire(
  overrides: Partial<Questionnaire> = {},
): Questionnaire {
  return {
    uuid: crypto.randomUUID(),
    telegramId: 12345,
    status: 'in_progress',
    answers: [],
    currentQuestionCode: 'q1',
    draftAnswers: [],
    createdAt: '2026-05-01T12:00',
    ...overrides,
  };
}

function setupUc(activeQuestionnaires: Questionnaire[] = []) {
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
        question: 'Первый вопрос',
        questionCode: 'q1',
        type: 'choice',
        multiple: false,
        answers: [{ answer: 'Да', answerCode: 'yes' }],
      },
    ],
    ['q1'],
  );

  const uc = new GetCurrentQuestionUc();
  uc.init({
    questionnaireRepo: repo,
    questionPoolService: poolService,
    userFacade: {} as UserFacade,
    db: {} as BaseJsonDb,
  });

  return { uc, getByTelegramId };
}

describe('GetCurrentQuestionUc', () => {
  test('возвращает new_question для активной анкеты без черновиков', async () => {
    const active = makeQuestionnaire({ currentQuestionCode: 'q1' });
    const { uc, getByTelegramId } = setupUc([active]);

    const result = await uc.handle({ telegramId: 12345 }, actorId);

    expect(result.type).toBe('new_question');
    if (result.type !== 'completed') {
      expect(result.question.questionCode).toBe('q1');
    }
    expect(getByTelegramId).toHaveBeenCalledWith(12345);
  });

  test('возвращает new_question для активной анкеты с черновиками', async () => {
    const active = makeQuestionnaire({
      currentQuestionCode: 'q1',
      draftAnswers: ['yes'],
    });
    const { uc } = setupUc([active]);

    const result = await uc.handle({ telegramId: 12345 }, actorId);

    // Для одиночного выбора черновики возвращаются в поле selectedAnswers,
    // а тип ответа — new_question (wait_next только для множественного выбора)
    expect(result.type).toBe('new_question');
    if (result.type !== 'completed') {
      expect(result.question.questionCode).toBe('q1');
    }
    expect(result.selectedAnswers).toEqual(['yes']);
  });

  test('выбрасывает QUESTIONNAIRE_NOT_FOUND без активной анкеты', async () => {
    const { uc } = setupUc([]);

    await expect(uc.handle({ telegramId: 12345 }, actorId)).rejects.toThrow(
      'У тебя нет активной анкеты',
    );
  });

  test('отклоняет невалидную команду', async () => {
    const { uc } = setupUc();

    await expect(uc.handle({ telegramId: -1 })).rejects.toThrow();
  });
});
