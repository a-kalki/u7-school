import { beforeEach, describe, expect, mock, test } from 'bun:test';
import type { QuestionnaireApiModuleResolver } from '../../domain/module';
import type { Questionnaire } from '../../domain/questionnaire/entity';
import type { GetIdleQuestionnairesParams } from '../../domain/questionnaire/repo';
import { SweepAbandonedJob } from './sweep-abandoned-job';

// ══ Помощники ══

const HOUR = 60 * 60 * 1000;

/** isoNow-подобная метка N часов назад */
function hoursAgo(h: number): string {
  return new Date(Date.now() - h * HOUR).toISOString().slice(0, 16);
}

function makeState(overrides: Partial<Questionnaire> = {}): Questionnaire {
  return {
    kind: 'standard',
    uuid: crypto.randomUUID(),
    respondentId: '00000000-0000-0000-0000-000000000007',
    status: 'in_progress',
    currentQuestionCode: 'q1',
    draftAnswers: {},
    answers: [],
    questionPool: {
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
      ],
    },
    ownerInfo: {},
    createdAt: hoursAgo(10),
    updatedAt: hoursAgo(10),
    completedAt: null,
    ...overrides,
  };
}

interface JobMocks {
  getIdle: ReturnType<typeof mock>;
  save: ReturnType<typeof mock>;
  publish: ReturnType<typeof mock>;
  getUserByUuid: ReturnType<typeof mock>;
}

function makeResolve(
  states: Questionnaire[],
  userByUuid: Map<string, number>,
): { resolve: QuestionnaireApiModuleResolver; mocks: JobMocks } {
  const mocks: JobMocks = {
    // Мок эмулирует контракт getIdle: фильтры применяются в запросе
    getIdle: mock(async (params: GetIdleQuestionnairesParams) =>
      states.filter((s) => {
        if (params.kinds && !params.kinds.includes(s.kind)) return false;
        if (params.statuses && !params.statuses.includes(s.status))
          return false;
        const idleFrom = Date.parse(s.updatedAt ?? s.createdAt);
        return Date.now() - idleFrom >= params.idleMs;
      }),
    ),
    save: mock(async (_q: Questionnaire) => {}),
    publish: mock((_e: unknown) => {}),
    getUserByUuid: mock(async (uuid: string) =>
      userByUuid.has(uuid)
        ? ({ uuid, telegramId: userByUuid.get(uuid) } as never)
        : undefined,
    ),
  };

  const resolve = {
    questionnaireRepo: {
      getIdle: mocks.getIdle,
      save: mocks.save,
      getByUuid: mock(async () => undefined),
      getByRespondentId: mock(async () => []),
    },
    userFacade: {
      getUserByUuid: mocks.getUserByUuid,
    },
    eventBus: {
      publish: mocks.publish,
      subscribe: mock(() => () => {}),
    },
    db: {} as never,
    appResolver: {
      eventBus: {} as never,
      logger: {
        debug: mock(() => {}),
        info: mock(() => {}),
        warn: mock(() => {}),
        error: mock(() => {}),
        setLogLevel: mock(() => {}),
        getLogLevel: mock(() => 0),
        setSourceLevel: mock(() => {}),
      },
      mode: 'test',
    },
  } as unknown as QuestionnaireApiModuleResolver;

  return { resolve, mocks };
}

// ══ Тесты ══

describe('SweepAbandonedJob', () => {
  let userByUuid: Map<string, number>;

  beforeEach(() => {
    userByUuid = new Map([['00000000-0000-0000-0000-000000000007', 42]]);
  });

  test('контракт job: имя, метка, расписание — интервал раз в час', () => {
    const job = new SweepAbandonedJob();
    expect(job.jobName).toBe('sweep-abandoned-questionnaires');
    expect(job.jobLabel).toBe('Предупреждение и закрытие брошенных анкет');
    expect(job.schedule).toEqual({ kind: 'interval', intervalMs: HOUR });
  });

  test('свежая анкета (простоя нет) — никаких действий', async () => {
    const state = makeState({ updatedAt: hoursAgo(1) });
    const { resolve, mocks } = makeResolve([state], userByUuid);
    const job = new SweepAbandonedJob();
    job.init(resolve);

    await job.execute();

    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.publish).not.toHaveBeenCalled();
  });

  test('5ч простоя — ниже порога предупреждения, действий нет', async () => {
    const state = makeState({ updatedAt: hoursAgo(5) });
    const { resolve, mocks } = makeResolve([state], userByUuid);
    const job = new SweepAbandonedJob();
    job.init(resolve);

    await job.execute();

    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.publish).not.toHaveBeenCalled();
  });

  test('7ч простоя → предупреждение: warnedAt + save + событие questionnaire:abandon-warning', async () => {
    const state = makeState({ updatedAt: hoursAgo(7) });
    const { resolve, mocks } = makeResolve([state], userByUuid);
    const job = new SweepAbandonedJob();
    job.init(resolve);

    await job.execute();

    // Сохранение с выставленным warnedAt
    expect(mocks.save).toHaveBeenCalledTimes(1);
    const saved = mocks.save.mock.calls[0]![0] as Questionnaire;
    expect(saved.warnedAt).toBeDefined();

    // Событие предупреждения с telegramId
    expect(mocks.publish).toHaveBeenCalledTimes(1);
    const event = mocks.publish.mock.calls[0]![0] as {
      eventName: string;
      payload: { questionnaireId: string; telegramId: number };
    };
    expect(event.eventName).toBe('questionnaire:abandon-warning');
    expect(event.payload.questionnaireId).toBe(state.uuid);
    expect(event.payload.telegramId).toBe(42);
  });

  test('повторный прогон после предупреждения — дубля нет (идемпотентность)', async () => {
    const state = makeState({
      updatedAt: hoursAgo(7),
      warnedAt: hoursAgo(1),
    });
    const { resolve, mocks } = makeResolve([state], userByUuid);
    const job = new SweepAbandonedJob();
    job.init(resolve);

    await job.execute();

    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.publish).not.toHaveBeenCalled();
  });

  test('9ч простоя → abandon: save со статусом abandoned + событие с reason=timeout', async () => {
    const state = makeState({ updatedAt: hoursAgo(9) });
    const { resolve, mocks } = makeResolve([state], userByUuid);
    const job = new SweepAbandonedJob();
    job.init(resolve);

    await job.execute();

    expect(mocks.save).toHaveBeenCalledTimes(1);
    const saved = mocks.save.mock.calls[0]![0] as Questionnaire;
    expect(saved.status).toBe('abandoned');
    expect(saved.abandonReason).toBe('timeout');

    expect(mocks.publish).toHaveBeenCalledTimes(1);
    const event = mocks.publish.mock.calls[0]![0] as {
      eventName: string;
      payload: { reason?: string; telegramId?: number };
    };
    expect(event.eventName).toBe('questionnaire:abandon');
    expect(event.payload.reason).toBe('timeout');
    expect(event.payload.telegramId).toBe(42);
  });

  test('9ч простоя с уже выставленным warnedAt — всё равно закрывается', async () => {
    const state = makeState({
      updatedAt: hoursAgo(9),
      warnedAt: hoursAgo(2),
    });
    const { resolve, mocks } = makeResolve([state], userByUuid);
    const job = new SweepAbandonedJob();
    job.init(resolve);

    await job.execute();

    const saved = mocks.save.mock.calls[0]![0] as Questionnaire;
    expect(saved.status).toBe('abandoned');
  });

  test('likert-анкета пропускается (только kind=standard)', async () => {
    const likertOverrides = {
      kind: 'likert',
      updatedAt: hoursAgo(9),
    } as unknown as Partial<Questionnaire>;
    const state = makeState(likertOverrides);
    const { resolve, mocks } = makeResolve([state], userByUuid);
    const job = new SweepAbandonedJob();
    job.init(resolve);

    await job.execute();

    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.publish).not.toHaveBeenCalled();
  });

  test('неизвестный пользователь — предупреждение не публикуется, job не падает', async () => {
    const state = makeState({ updatedAt: hoursAgo(7) });
    const { resolve, mocks } = makeResolve([state], new Map());
    const job = new SweepAbandonedJob();
    job.init(resolve);

    await expect(job.execute()).resolves.toBeUndefined();

    expect(mocks.publish).not.toHaveBeenCalled();
  });
});
