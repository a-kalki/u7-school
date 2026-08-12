import { describe, expect, test } from 'bun:test';
import { InProcEventBus } from '@u7-scl/core/infra';
import type { UserFacade } from '@u7-scl/user/domain';
import { QuestionnaireApiModule } from '#api/module';
import type { QuestionnaireBotFacade } from '#domain/bot-facade';
import type { QuestionnaireRepo } from '#domain/questionnaire/repo';

// Мок-репозиторий
function mockRepo(
  questions: Array<{
    uuid: string;
    respondentId: number;
    status: string;
  }> = [],
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

// Мок-botFacade
function mockBotFacade(): QuestionnaireBotFacade {
  return {
    sendQuestionnaireInvite: async () => {},
    startQuestionnaire: async () => {},
  };
}

function simplePool() {
  return {
    inviteText: 'Приглашение',
    whyText: 'Зачем',
    questions: [
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
    ],
  };
}

function makeResolve(overrides: any = {}) {
  return {
    questionnaireRepo: mockRepo(),
    botFacade: mockBotFacade(),
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

describe('QuestionnaireApiModule (v2)', () => {
  test('send-invite — создаёт анкету и вызывает botFacade', async () => {
    let inviteCalled = false;
    const botFacade: QuestionnaireBotFacade = {
      sendQuestionnaireInvite: async () => {
        inviteCalled = true;
      },
      startQuestionnaire: async () => {},
    };
    const mod = new QuestionnaireApiModule(makeResolve({ botFacade }));

    await mod.execute(
      'send-invite',
      { user: { telegramId: 123, roles: [] } as any, pool: simplePool() },
      '',
    );

    expect(inviteCalled).toBe(true);

    // Проверяем, что анкета сохранена
    const all = await mod.execute(
      'get-questionnaires-by-user',
      { userId: 123 },
      '',
    );
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBe(1);
  });

  test('start — создаёт, запускает анкету и вызывает botFacade', async () => {
    let startCalled = false;
    const botFacade: QuestionnaireBotFacade = {
      sendQuestionnaireInvite: async () => {},
      startQuestionnaire: async () => {
        startCalled = true;
      },
    };
    const mod = new QuestionnaireApiModule(makeResolve({ botFacade }));

    await mod.execute(
      'start',
      { user: { telegramId: 456, roles: [] } as any, pool: simplePool() },
      '',
    );

    expect(startCalled).toBe(true);
  });

  test('start-by-invite — запускает по ID и возвращает ответ (botFacade НЕ вызван)', async () => {
    let botCalled = false;
    const repo = mockRepo();
    const botFacade: QuestionnaireBotFacade = {
      sendQuestionnaireInvite: async () => {
        botCalled = true;
      },
      startQuestionnaire: async () => {
        botCalled = true;
      },
    };
    const mod = new QuestionnaireApiModule(
      makeResolve({ questionnaireRepo: repo, botFacade }),
    );

    // Сначала создаём анкету через send-invite
    await mod.execute(
      'send-invite',
      { user: { telegramId: 789, roles: [] } as any, pool: simplePool() },
      '',
    );
    const all = (await mod.execute(
      'get-questionnaires-by-user',
      { userId: 789 },
      '',
    )) as any[];
    const qId = all[0]!.uuid;

    // Сбрасываем флаг
    botCalled = false;

    const result = await mod.execute(
      'start-by-invite',
      { questionnaireId: qId },
      '',
    );

    expect(botCalled).toBe(false);
    expect(result).toBeDefined();
  });

  test('decline-invite — отказывается от приглашения', async () => {
    const repo = mockRepo();
    const mod = new QuestionnaireApiModule(
      makeResolve({ questionnaireRepo: repo }),
    );

    // Создаём анкету
    await mod.execute(
      'send-invite',
      { user: { telegramId: 111, roles: [] } as any, pool: simplePool() },
      '',
    );
    const all = (await mod.execute(
      'get-questionnaires-by-user',
      { userId: 111 },
      '',
    )) as any[];
    const qId = all[0]!.uuid;

    const result = await mod.execute(
      'decline-invite',
      { questionnaireId: qId },
      '',
    );
    expect(result).toBeDefined();

    // Проверяем статус
    const q = (await mod.execute(
      'get-questionnaire',
      { uuid: qId },
      '',
    )) as any;
    expect(q.status).toBe('abandoned');
  });

  test('handle-action — обрабатывает действие и возвращает ответ', async () => {
    const repo = mockRepo();
    const mod = new QuestionnaireApiModule(
      makeResolve({ questionnaireRepo: repo }),
    );

    // Создаём и запускаем анкету
    await mod.execute(
      'send-invite',
      { user: { telegramId: 222, roles: [] } as any, pool: simplePool() },
      '',
    );
    const all = (await mod.execute(
      'get-questionnaires-by-user',
      { userId: 222 },
      '',
    )) as any[];
    const qId = all[0]!.uuid;

    // Запускаем по приглашению
    await mod.execute('start-by-invite', { questionnaireId: qId }, '');

    const result = await mod.execute(
      'handle-action',
      { questionnaireId: qId, type: 'callback', value: 'a' },
      '',
    );

    expect(result).toBeDefined();
  });

  test('abandon — прерывает анкету', async () => {
    const repo = mockRepo();
    const mod = new QuestionnaireApiModule(
      makeResolve({ questionnaireRepo: repo }),
    );

    await mod.execute(
      'send-invite',
      { user: { telegramId: 333, roles: [] } as any, pool: simplePool() },
      '',
    );
    const all = (await mod.execute(
      'get-questionnaires-by-user',
      { userId: 333 },
      '',
    )) as any[];
    const qId = all[0]!.uuid;

    await mod.execute('start-by-invite', { questionnaireId: qId }, '');
    await mod.execute('abandon', { questionnaireId: qId }, '');

    const q = (await mod.execute(
      'get-questionnaire',
      { uuid: qId },
      '',
    )) as any;
    expect(q.status).toBe('abandoned');
  });

  test('get-current — возвращает текущее состояние', async () => {
    const repo = mockRepo();
    const mod = new QuestionnaireApiModule(
      makeResolve({ questionnaireRepo: repo }),
    );

    await mod.execute(
      'send-invite',
      { user: { telegramId: 444, roles: [] } as any, pool: simplePool() },
      '',
    );
    const all = (await mod.execute(
      'get-questionnaires-by-user',
      { userId: 444 },
      '',
    )) as any[];
    const qId = all[0]!.uuid;

    // До запуска — invited
    const resp1 = (await mod.execute(
      'get-current',
      { questionnaireId: qId },
      '',
    )) as any;
    expect(resp1.type).toBe('invited');

    // После запуска — вопрос
    await mod.execute('start-by-invite', { questionnaireId: qId }, '');
    const resp2 = (await mod.execute(
      'get-current',
      { questionnaireId: qId },
      '',
    )) as any;
    expect(resp2.type).toBe('new_question');
  });

  test('get-questionnaire — возвращает анкету по uuid', async () => {
    const repo = mockRepo();
    const mod = new QuestionnaireApiModule(
      makeResolve({ questionnaireRepo: repo }),
    );

    await mod.execute(
      'send-invite',
      { user: { telegramId: 555, roles: [] } as any, pool: simplePool() },
      '',
    );
    const all = (await mod.execute(
      'get-questionnaires-by-user',
      { userId: 555 },
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

    const empty = await mod.execute(
      'get-questionnaires-by-user',
      { userId: 999 },
      '',
    );
    expect(empty).toEqual([]);
  });
});
