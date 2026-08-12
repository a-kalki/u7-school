import { describe, expect, test } from 'bun:test';
import { InProcEventBus } from '@u7-scl/core/infra';
import type { User, UserFacade } from '@u7-scl/user/domain';
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

// Мок-userFacade
function mockUserFacade(user: User): UserFacade {
  return {
    getUserByUuid: async () => user,
    getUserByTelegramId: async () => user,
  } as unknown as UserFacade;
}

function mockUser(): User {
  return {
    uuid: 'actor-1',
    name: 'Test',
    telegramId: 123,
    roles: [],
    createdAt: '2024-01-01T00:00:00.000Z',
  } as User;
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
    userFacade: mockUserFacade(mockUser()),
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

describe('QuestionnaireApiModule (v3 — commands)', () => {
  test('send-invite — создаёт анкету и вызывает botFacade', async () => {
    let inviteCalled = false;
    const user = mockUser();
    const botFacade: QuestionnaireBotFacade = {
      sendQuestionnaireInvite: async () => {
        inviteCalled = true;
      },
      startQuestionnaire: async () => {},
    };
    const userFacade = mockUserFacade(user);
    const mod = new QuestionnaireApiModule(
      makeResolve({ botFacade, userFacade }),
    );

    await mod.execute('send-invite', { pool: simplePool() }, user.uuid);

    expect(inviteCalled).toBe(true);

    const all = await mod.execute(
      'get-questionnaires-by-user',
      { userId: user.telegramId },
      '',
    );
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBe(1);
  });

  test('start — создаёт, запускает анкету и вызывает botFacade', async () => {
    let startCalled = false;
    const user = mockUser();
    const botFacade: QuestionnaireBotFacade = {
      sendQuestionnaireInvite: async () => {},
      startQuestionnaire: async () => {
        startCalled = true;
      },
    };
    const userFacade = mockUserFacade(user);
    const mod = new QuestionnaireApiModule(
      makeResolve({ botFacade, userFacade }),
    );

    await mod.execute('start', { pool: simplePool() }, user.uuid);

    expect(startCalled).toBe(true);
  });

  test('start-by-invite — запускает по ID и возвращает ответ (botFacade НЕ вызван)', async () => {
    let botCalled = false;
    const user = mockUser();
    const repo = mockRepo();
    const botFacade: QuestionnaireBotFacade = {
      sendQuestionnaireInvite: async () => {
        botCalled = true;
      },
      startQuestionnaire: async () => {
        botCalled = true;
      },
    };
    const userFacade = mockUserFacade(user);
    const mod = new QuestionnaireApiModule(
      makeResolve({ questionnaireRepo: repo, botFacade, userFacade }),
    );

    // Создаём анкету через send-invite
    await mod.execute('send-invite', { pool: simplePool() }, user.uuid);
    const all = (await mod.execute(
      'get-questionnaires-by-user',
      { userId: user.telegramId },
      '',
    )) as any[];
    const qId = all[0]!.uuid;

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
    const user = mockUser();
    const repo = mockRepo();
    const userFacade = mockUserFacade(user);
    const mod = new QuestionnaireApiModule(
      makeResolve({ questionnaireRepo: repo, userFacade }),
    );

    await mod.execute('send-invite', { pool: simplePool() }, user.uuid);
    const all = (await mod.execute(
      'get-questionnaires-by-user',
      { userId: user.telegramId },
      '',
    )) as any[];
    const qId = all[0]!.uuid;

    const result = await mod.execute(
      'decline-invite',
      { questionnaireId: qId },
      '',
    );
    expect(result).toBeDefined();

    const q = (await mod.execute(
      'get-questionnaire',
      { uuid: qId },
      '',
    )) as any;
    expect(q.status).toBe('abandoned');
  });

  test('handle-action — обрабатывает действие и возвращает ответ', async () => {
    const user = mockUser();
    const repo = mockRepo();
    const userFacade = mockUserFacade(user);
    const mod = new QuestionnaireApiModule(
      makeResolve({ questionnaireRepo: repo, userFacade }),
    );

    await mod.execute('send-invite', { pool: simplePool() }, user.uuid);
    const all = (await mod.execute(
      'get-questionnaires-by-user',
      { userId: user.telegramId },
      '',
    )) as any[];
    const qId = all[0]!.uuid;

    await mod.execute('start-by-invite', { questionnaireId: qId }, '');

    const result = await mod.execute(
      'handle-action',
      { questionnaireId: qId, type: 'callback', value: 'a' },
      '',
    );

    expect(result).toBeDefined();
  });

  test('abandon — прерывает анкету', async () => {
    const user = mockUser();
    const repo = mockRepo();
    const userFacade = mockUserFacade(user);
    const mod = new QuestionnaireApiModule(
      makeResolve({ questionnaireRepo: repo, userFacade }),
    );

    await mod.execute('send-invite', { pool: simplePool() }, user.uuid);
    const all = (await mod.execute(
      'get-questionnaires-by-user',
      { userId: user.telegramId },
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
    const user = mockUser();
    const repo = mockRepo();
    const userFacade = mockUserFacade(user);
    const mod = new QuestionnaireApiModule(
      makeResolve({ questionnaireRepo: repo, userFacade }),
    );

    await mod.execute('send-invite', { pool: simplePool() }, user.uuid);
    const all = (await mod.execute(
      'get-questionnaires-by-user',
      { userId: user.telegramId },
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
    const user = mockUser();
    const repo = mockRepo();
    const userFacade = mockUserFacade(user);
    const mod = new QuestionnaireApiModule(
      makeResolve({ questionnaireRepo: repo, userFacade }),
    );

    await mod.execute('send-invite', { pool: simplePool() }, user.uuid);
    const all = (await mod.execute(
      'get-questionnaires-by-user',
      { userId: user.telegramId },
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
