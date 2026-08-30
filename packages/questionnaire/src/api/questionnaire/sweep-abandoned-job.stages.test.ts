import { beforeEach, describe, expect, mock, test } from 'bun:test';
import type { QuestionnaireApiModuleResolver } from '../../domain/module';
import type { Questionnaire } from '../../domain/questionnaire/entity';
import type { GetIdleQuestionnairesParams } from '../../domain/questionnaire/repo';
import {
  ABANDON_AFTER_HOURS,
  INTERVAL_MS,
  INVITE_AFTER_HOURS,
  SweepAbandonedJob,
  WARN_AFTER_HOURS,
} from './sweep-abandoned-job';

/**
 * Ступени планировщика брошенных анкет (spec FR-4):
 * 3ч → приглашение продолжить (takeover-кнопка), 6ч → предупреждение,
 * 9ч → закрытие. Каждая ступень — один раз; интервал запуска — 3 часа.
 */

// ══ Помощники (конвенция sweep-abandoned-job.test.ts) ══

const HOUR = 60 * 60 * 1000;

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
    ownerInfo: { courseId: 'course-1' },
    createdAt: hoursAgo(10),
    updatedAt: hoursAgo(10),
    completedAt: null,
    ...overrides,
  };
}

function makeResolve(
  states: Questionnaire[],
  userByUuid: Map<string, number>,
): { resolve: QuestionnaireApiModuleResolver; mocks: JobMocks } {
  const mocks: JobMocks = {
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

interface JobMocks {
  getIdle: ReturnType<typeof mock>;
  save: ReturnType<typeof mock>;
  publish: ReturnType<typeof mock>;
  getUserByUuid: ReturnType<typeof mock>;
}

// ══ Константы и расписание ══

describe('SweepAbandonedJob — константы ступеней (3/6/9)', () => {
  test('именованные константы: 3ч приглашение, 6ч предупреждение, 9ч закрытие', () => {
    expect(INVITE_AFTER_HOURS).toBe(3);
    expect(WARN_AFTER_HOURS).toBe(6);
    expect(ABANDON_AFTER_HOURS).toBe(9);
  });

  test('интервал запуска job — 3 часа', () => {
    const job = new SweepAbandonedJob();
    expect(INTERVAL_MS).toBe(3 * HOUR);
    expect(job.schedule).toEqual({ kind: 'interval', intervalMs: 3 * HOUR });
  });
});

// ══ Ступень приглашения (3ч) ══

describe('SweepAbandonedJob — ступень приглашения (3ч)', () => {
  let userByUuid: Map<string, number>;

  beforeEach(() => {
    userByUuid = new Map([['00000000-0000-0000-0000-000000000007', 42]]);
  });

  test('3.5ч простоя → приглашение: continueInvitedAt + save + событие questionnaire:continue-invite', async () => {
    const state = makeState({ updatedAt: hoursAgo(3.5) });
    const { resolve, mocks } = makeResolve([state], userByUuid);
    const job = new SweepAbandonedJob();
    job.init(resolve);

    await job.execute();

    expect(mocks.save).toHaveBeenCalledTimes(1);
    const saved = mocks.save.mock.calls[0]![0] as Questionnaire;
    expect(saved.continueInvitedAt).toBeDefined();
    // Приглашение не сдвигает таймер простоя
    expect(saved.updatedAt).toBe(state.updatedAt);

    expect(mocks.publish).toHaveBeenCalledTimes(1);
    const event = mocks.publish.mock.calls[0]![0] as {
      eventName: string;
      payload: { questionnaireId: string; telegramId: number };
    };
    expect(event.eventName).toBe('questionnaire:continue-invite');
    expect(event.payload.questionnaireId).toBe(state.uuid);
    expect(event.payload.telegramId).toBe(42);
  });

  test('повторный прогон после приглашения — дубля нет (идемпотентность)', async () => {
    const state = makeState({
      updatedAt: hoursAgo(4),
      continueInvitedAt: hoursAgo(0.5),
    });
    const { resolve, mocks } = makeResolve([state], userByUuid);
    const job = new SweepAbandonedJob();
    job.init(resolve);

    await job.execute();

    expect(mocks.save).not.toHaveBeenCalled();
    expect(mocks.publish).not.toHaveBeenCalled();
  });

  test('возобновление сбрасывает цепочку: без continueInvitedAt приглашение приходит снова', async () => {
    // Пользователь вернулся (handleAction сбросил флаги и обновил updatedAt),
    // затем снова пропал: простоя 4ч, флагов нет → приглашение отправляется
    const state = makeState({
      updatedAt: hoursAgo(4),
      warnedAt: undefined,
      continueInvitedAt: undefined,
    });
    const { resolve, mocks } = makeResolve([state], userByUuid);
    const job = new SweepAbandonedJob();
    job.init(resolve);

    await job.execute();

    expect(mocks.publish).toHaveBeenCalledTimes(1);
    const event = mocks.publish.mock.calls[0]![0] as { eventName: string };
    expect(event.eventName).toBe('questionnaire:continue-invite');
  });
});

// ══ Границы ступеней ══

describe('SweepAbandonedJob — границы ступеней 3/6/9', () => {
  let userByUuid: Map<string, number>;

  beforeEach(() => {
    userByUuid = new Map([['00000000-0000-0000-0000-000000000007', 42]]);
  });

  test('6ч простоя → предупреждение (не приглашение)', async () => {
    const state = makeState({ updatedAt: hoursAgo(6) });
    const { resolve, mocks } = makeResolve([state], userByUuid);
    const job = new SweepAbandonedJob();
    job.init(resolve);

    await job.execute();

    expect(mocks.publish).toHaveBeenCalledTimes(1);
    const event = mocks.publish.mock.calls[0]![0] as { eventName: string };
    expect(event.eventName).toBe('questionnaire:abandon-warning');
  });

  test('8.5ч простоя без warnedAt → предупреждение, НЕ закрытие (порог сдвинут с 8ч на 9ч)', async () => {
    const state = makeState({ updatedAt: hoursAgo(8.5) });
    const { resolve, mocks } = makeResolve([state], userByUuid);
    const job = new SweepAbandonedJob();
    job.init(resolve);

    await job.execute();

    const saved = mocks.save.mock.calls[0]?.[0] as Questionnaire | undefined;
    expect(saved?.status).not.toBe('abandoned');
    const event = mocks.publish.mock.calls[0]![0] as { eventName: string };
    expect(event.eventName).toBe('questionnaire:abandon-warning');
  });

  test('9ч простоя → закрытие (abandon, reason=timeout)', async () => {
    const state = makeState({ updatedAt: hoursAgo(9) });
    const { resolve, mocks } = makeResolve([state], userByUuid);
    const job = new SweepAbandonedJob();
    job.init(resolve);

    await job.execute();

    const saved = mocks.save.mock.calls[0]![0] as Questionnaire;
    expect(saved.status).toBe('abandoned');
    const event = mocks.publish.mock.calls[0]![0] as { eventName: string };
    expect(event.eventName).toBe('questionnaire:abandon');
  });

  test('7ч простоя с continueInvitedAt, но без warnedAt → предупреждение (приглашение задним числом не шлётся)', async () => {
    const state = makeState({
      updatedAt: hoursAgo(7),
      continueInvitedAt: hoursAgo(3),
    });
    const { resolve, mocks } = makeResolve([state], userByUuid);
    const job = new SweepAbandonedJob();
    job.init(resolve);

    await job.execute();

    const event = mocks.publish.mock.calls[0]![0] as { eventName: string };
    expect(event.eventName).toBe('questionnaire:abandon-warning');
    expect(mocks.publish).toHaveBeenCalledTimes(1);
  });
});
