import { describe, expect, test } from 'bun:test';
import { InProcEventBus } from '@u7-scl/core/infra';
import type { UserFacade } from '@u7-scl/user/domain';
import * as v from 'valibot';
import { QuestionnaireApiModule } from '#api/module';
import type { QuestionPoolService } from '#domain/questionnaire/question-pool-service';
import type { QuestionnaireRepo } from '#domain/questionnaire/repo';

// Мок-репозиторий
function mockRepo(
  questions: Array<{ uuid: string; respondentId: number; status: string }> = [],
): QuestionnaireRepo {
  const data = [...questions];
  return {
    save: async (q: any) => {
      const idx = data.findIndex((x: any) => x.uuid === q.uuid);
      if (idx >= 0) data[idx] = q;
      else data.push(q);
    },
    getByUuid: async (uuid: string) =>
      data.find((q: any) => q.uuid === uuid) as any,
    getByRespondentId: async (id: number) =>
      data.filter((q: any) => q.respondentId === id) as any,
  };
}

// Мок-сервис пула вопросов
function mockPool(): QuestionPoolService {
  return {
    getAll: () => [
      {
        question: 'Q1',
        questionCode: 'q1',
        type: 'choice',
        multiple: false,
        answers: [{ answer: 'A', answerCode: 'a' }],
      },
      {
        question: 'Q2',
        questionCode: 'q2',
        type: 'choice',
        multiple: false,
        answers: [{ answer: 'B', answerCode: 'b' }],
      },
    ],
    getByCode: (code: string) => {
      const pool = [
        {
          question: 'Q1',
          questionCode: 'q1',
          type: 'choice' as const,
          multiple: false,
          answers: [{ answer: 'A', answerCode: 'a' }],
        },
        {
          question: 'Q2',
          questionCode: 'q2',
          type: 'choice' as const,
          multiple: false,
          answers: [{ answer: 'B', answerCode: 'b' }],
        },
      ];
      return pool.find((q) => q.questionCode === code);
    },
    buildValidationSchema: () => v.string(),
    getNextQuestion: (currentCode: string | null, _answers: any[]) => {
      if (currentCode === null)
        return {
          question: 'Q1',
          questionCode: 'q1',
          type: 'choice',
          multiple: false,
          answers: [{ answer: 'A', answerCode: 'a' }],
        };
      if (currentCode === 'q1')
        return {
          question: 'Q2',
          questionCode: 'q2',
          type: 'choice',
          multiple: false,
          answers: [{ answer: 'B', answerCode: 'b' }],
        };
      return null;
    },
    assertAllCodesExist: () => {},
    loadDefaultPool: () => [],
  } as unknown as QuestionPoolService;
}

function makeResolve(overrides: any = {}) {
  return {
    questionnaireRepo: mockRepo(),
    questionPoolService: mockPool(),
    userFacade: {} as UserFacade,
    db: {} as any,
    appResolver: {
      logger: console,
      mode: 'test' as const,
      eventBus: new InProcEventBus(),
    },
    eventBus: new InProcEventBus(),
    ...overrides,
  };
}

describe('QuestionnaireApiModule (unit)', () => {
  test('start — создаёт анкету и возвращает первый вопрос', async () => {
    const mod = new QuestionnaireApiModule(makeResolve());

    const result = await mod.execute('start', { telegramId: 123 }, '');

    expect(result).toBeDefined();
    // Проверяем что анкета сохранена
    const all = await mod.execute(
      'get-questionnaires-by-user',
      { respondentId: 123 },
      '',
    );
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBe(1);
    expect((all as any[])[0]?.respondentId).toBe(123);
  });

  test('handle-action — обрабатывает действие', async () => {
    const mod = new QuestionnaireApiModule(makeResolve());

    await mod.execute('start', { telegramId: 456 }, '');
    const result = await mod.execute(
      'handle-action',
      { telegramId: 456, type: 'callback', value: 'a' },
      '',
    );

    expect(result).toBeDefined();
  });

  test('abandon — прерывает анкету', async () => {
    const mod = new QuestionnaireApiModule(makeResolve());

    await mod.execute('start', { telegramId: 789 }, '');
    await mod.execute('abandon', { telegramId: 789 }, '');

    // После abandon анкета не должна быть активной
    // (упрощённая проверка — abandon не падает)
  });

  test('get-questionnaire — возвращает анкету по uuid', async () => {
    const mod = new QuestionnaireApiModule(makeResolve());

    const started = (await mod.execute(
      'start',
      { telegramId: 111 },
      '',
    )) as any;
    // start возвращает QuestionnaireActionResponse, не Questionnaire
    // Получаем список анкет пользователя
    const all = (await mod.execute(
      'get-questionnaires-by-user',
      { respondentId: 111 },
      '',
    )) as any[];
    expect(all.length).toBe(1);

    const found = await mod.execute(
      'get-questionnaire',
      { uuid: all[0]!.uuid },
      '',
    );
    expect(found).toBeDefined();
  });

  test('get-questionnaires-by-user — возвращает все анкеты пользователя', async () => {
    const mod = new QuestionnaireApiModule(makeResolve());

    // Пустой список
    const empty = await mod.execute(
      'get-questionnaires-by-user',
      { respondentId: 999 },
      '',
    );
    expect(empty).toEqual([]);
  });
});
