import { describe, expect, test } from 'bun:test';
import { InProcEventBus } from '@u7-scl/core/infra';
import type { User, UserFacade } from '@u7-scl/user/domain';
import { QuestionnaireApiModule } from '#api/module';
import type { LikertQuestionPool } from '#domain/questionnaire/likert/likert-question';
import type { QuestionnairePool } from '#domain/questionnaire/question';
import { QuestionnaireFactory } from '#domain/questionnaire/questionnaire-factory';
import type { QuestionnaireRepo } from '#domain/questionnaire/repo';

// Мок-репозиторий
function mockRepo(
  questions: Array<{
    uuid: string;
    respondentId: string;
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
    getByRespondentId: async (id: string) =>
      data.filter((q: any) => q.respondentId === id) as any,
  };
}

// Мок-userFacade
function mockUserFacade(user: User): UserFacade {
  return {
    getUserByUuid: async () => user,
    getUserByTelegramId: async () => user,
  } as unknown as UserFacade;
}

function mockUser(overrides: Partial<User> = {}): User {
  return {
    uuid: '00000000-0000-0000-0000-000000000001',
    name: 'Test',
    telegramId: 123,
    roles: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  } as User;
}

function simplePool(): QuestionnairePool {
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

/** Кладёт обычную анкету в статусе invited прямо в репозиторий. */
async function seedStandardInvite(
  repo: QuestionnaireRepo,
  respondentId: string,
): Promise<string> {
  const ar = QuestionnaireFactory.createStandard(respondentId, simplePool());
  await repo.save(ar.state);
  return ar.state.uuid;
}

const USER_ID = '00000000-0000-0000-0000-000000000001';

function makeResolve(overrides: any = {}) {
  return {
    questionnaireRepo: mockRepo(),
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
  test('start — создаёт, запускает анкету и публикует questionnaire:start', async () => {
    const user = mockUser();
    const userFacade = mockUserFacade(user);
    const eventBus = new InProcEventBus();
    const received: any[] = [];
    eventBus.subscribe('questionnaire:start', async (e) => {
      received.push(e);
    });

    const mod = new QuestionnaireApiModule(
      makeResolve({ userFacade, eventBus }),
    );

    await mod.execute('start', { pool: simplePool(), ownerInfo: {} }, USER_ID);

    expect(received.length).toBe(1);
    expect(received[0]!.eventName).toBe('questionnaire:start');
    expect(received[0]!.payload.telegramId).toBe(user.telegramId);
    expect(received[0]!.payload.response.type).toBe('new_question');
  });

  test('start-by-invite — запускает по ID и возвращает ответ', async () => {
    const user = mockUser();
    const repo = mockRepo();
    const userFacade = mockUserFacade(user);
    const mod = new QuestionnaireApiModule(
      makeResolve({ questionnaireRepo: repo, userFacade }),
    );

    const qId = await seedStandardInvite(repo, USER_ID);

    const result = await mod.execute(
      'start-by-invite',
      { questionnaireId: qId },
      USER_ID,
    );

    expect(result).toBeDefined();
  });

  test('decline-invite — отказывается от приглашения', async () => {
    const user = mockUser();
    const repo = mockRepo();
    const userFacade = mockUserFacade(user);
    const mod = new QuestionnaireApiModule(
      makeResolve({ questionnaireRepo: repo, userFacade }),
    );

    const qId = await seedStandardInvite(repo, USER_ID);

    await mod.execute('decline-invite', { questionnaireId: qId }, USER_ID);

    const q = (await mod.execute(
      'get-questionnaire',
      { uuid: qId },
      USER_ID,
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

    const qId = await seedStandardInvite(repo, USER_ID);

    await mod.execute('start-by-invite', { questionnaireId: qId }, USER_ID);

    const result = await mod.execute(
      'handle-action',
      { questionnaireId: qId, type: 'callback', value: 'a' },
      USER_ID,
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

    const qId = await seedStandardInvite(repo, USER_ID);

    await mod.execute('start-by-invite', { questionnaireId: qId }, USER_ID);
    await mod.execute('abandon', { questionnaireId: qId }, USER_ID);

    const q = (await mod.execute(
      'get-questionnaire',
      { uuid: qId },
      USER_ID,
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

    const qId = await seedStandardInvite(repo, USER_ID);

    // До запуска — invited
    const resp1 = (await mod.execute(
      'get-current',
      { questionnaireId: qId },
      USER_ID,
    )) as any;
    expect(resp1.type).toBe('invited');

    // После запуска — вопрос
    await mod.execute('start-by-invite', { questionnaireId: qId }, USER_ID);
    const resp2 = (await mod.execute(
      'get-current',
      { questionnaireId: qId },
      USER_ID,
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

    const qId = await seedStandardInvite(repo, USER_ID);

    const found = await mod.execute(
      'get-questionnaire',
      { uuid: qId },
      USER_ID,
    );
    expect(found).toBeDefined();
  });

  test('get-questionnaires-by-user — отказ в доступе к чужим анкетам', async () => {
    const user = mockUser();
    const userFacade = mockUserFacade(user);
    const mod = new QuestionnaireApiModule(makeResolve({ userFacade }));

    await expect(
      mod.execute(
        'get-questionnaires-by-user',
        { userId: '00000000-0000-0000-0000-000000000999' },
        USER_ID,
      ),
    ).rejects.toThrow('Нет доступа к списку анкет пользователя');
  });

  test('send-likert-invite + handle-action — публикует событие с likertScores', async () => {
    const user = mockUser();
    const repo = mockRepo();
    const userFacade = mockUserFacade(user);
    const eventBus = new InProcEventBus();
    const received: any[] = [];
    const inviteEvents: any[] = [];
    eventBus.subscribe('questionnaire:likert-complete', async (e) => {
      received.push(e);
    });
    eventBus.subscribe('questionnaire:invite', async (e) => {
      inviteEvents.push(e);
    });
    const mod = new QuestionnaireApiModule(
      makeResolve({ questionnaireRepo: repo, userFacade, eventBus }),
    );

    const likertPool: LikertQuestionPool = {
      questions: [
        {
          questionCode: 'm1',
          question: 'Пишет код чисто',
          likertMapping: {
            category: 'professional_skills',
            subcategory: 'work_quality',
            weight: 1,
          },
        },
        {
          questionCode: 'm2',
          question: 'Думает алгоритмами',
          likertMapping: {
            category: 'professional_skills',
            subcategory: 'algorithmic_thinking',
            weight: 1,
          },
        },
      ],
    };
    const ownerInfo = {
      context: 'module_completed',
      role: 'student_student',
      subjectId: '00000000-0000-0000-0000-000000000008',
    };

    await mod.execute(
      'send-likert-invite',
      { pool: likertPool, ownerInfo },
      USER_ID,
    );

    expect(inviteEvents.length).toBe(1);
    expect(inviteEvents[0]!.eventName).toBe('questionnaire:invite');
    expect(inviteEvents[0]!.payload.response.type).toBe('invited');

    const all = (await mod.execute(
      'get-questionnaires-by-user',
      { userId: USER_ID },
      USER_ID,
    )) as any[];
    expect(all.length).toBe(1);
    expect(all[0]!.kind).toBe('likert');

    const qId = all[0]!.uuid;
    await mod.execute('start-by-invite', { questionnaireId: qId }, USER_ID);
    await mod.execute(
      'handle-action',
      { questionnaireId: qId, type: 'callback', value: '4' },
      USER_ID,
    );
    await mod.execute(
      'handle-action',
      { questionnaireId: qId, type: 'callback', value: '2' },
      USER_ID,
    );

    expect(received.length).toBe(1);
    const event = received[0]!;
    expect(event.eventName).toBe('questionnaire:likert-complete');
    expect(event.payload.likertScores).toEqual([
      {
        category: 'professional_skills',
        subcategory: 'work_quality',
        score: 4,
      },
      {
        category: 'professional_skills',
        subcategory: 'algorithmic_thinking',
        score: 2,
      },
    ]);
    expect(event.ownerInfo).toEqual(ownerInfo);
  });

  test('decline-invite и abandon публикуют явные события', async () => {
    const user = mockUser();
    const repo = mockRepo();
    const userFacade = mockUserFacade(user);
    const eventBus = new InProcEventBus();
    const received: any[] = [];
    eventBus.subscribe('questionnaire:decline', async (e) => {
      received.push(e);
    });
    eventBus.subscribe('questionnaire:abandon', async (e) => {
      received.push(e);
    });
    const mod = new QuestionnaireApiModule(
      makeResolve({ questionnaireRepo: repo, userFacade, eventBus }),
    );

    const declinedId = await seedStandardInvite(repo, USER_ID);
    await mod.execute(
      'decline-invite',
      { questionnaireId: declinedId },
      USER_ID,
    );

    const abandonedId = await seedStandardInvite(repo, USER_ID);
    await mod.execute(
      'start-by-invite',
      { questionnaireId: abandonedId },
      USER_ID,
    );
    await mod.execute('abandon', { questionnaireId: abandonedId }, USER_ID);

    expect(received.map((e) => e.eventName)).toEqual([
      'questionnaire:decline',
      'questionnaire:abandon',
    ]);
  });
});
