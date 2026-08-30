import { beforeEach, describe, expect, mock, test } from 'bun:test';
import { ConsoleLogger } from '@u7-scl/core/shared';
import type { StreamApiModuleResolver } from '#domain/module';
import { StreamStatus } from '#domain/status';
import type { Stream } from '#domain/stream/entity';
import type { Student } from '#domain/student/entity';
import {
  InactivitySweepJob,
  NOTICE_EVERY_DAYS,
  REMOVE_AFTER_DAYS,
  WARN_AFTER_DAYS,
} from './inactivity-sweep-job';

// ══ Помощники ══

const DAY = 24 * 60 * 60 * 1000;

const STREAM_ID = '77777777-7777-4777-8777-777777777777';
const STUDENT_USER_ID = '11111111-1111-4111-8111-111111111111';
const MENTOR_USER_ID = '66666666-6666-4666-8666-666666666666';
const STEP_ID = '33333333-3333-4333-8333-333333333333';

/** isoNow-подобная метка N дней назад */
function daysAgo(d: number, atHour = 0): string {
  const dt = new Date(Date.now() - d * DAY);
  dt.setUTCHours(atHour, 0, 0, 0);
  return dt.toISOString().slice(0, 16);
}

function makeStudent(overrides: Partial<Student> = {}): Student {
  return {
    uuid: crypto.randomUUID(),
    streamId: STREAM_ID,
    userId: STUDENT_USER_ID,
    enrolledAt: daysAgo(20),
    status: 'enrolled',
    currentStepId: STEP_ID,
    steps: [],
    createdAt: daysAgo(20),
    ...overrides,
  };
}

interface JobMocks {
  getByStatuses: ReturnType<typeof mock>;
  save: ReturnType<typeof mock>;
  publish: ReturnType<typeof mock>;
  getUserByUuid: ReturnType<typeof mock>;
  getStream: ReturnType<typeof mock>;
}

interface MakeOptions {
  students: Student[];
  studentTelegramId?: number | undefined;
  mentorTelegramId?: number | undefined;
}

function makeResolve(opts: MakeOptions): {
  resolve: StreamApiModuleResolver;
  mocks: JobMocks;
} {
  const stream: Stream = {
    uuid: STREAM_ID,
    title: 'JS Core — Поток 2',
    description: 'Второй поток',
    mentorId: MENTOR_USER_ID,
    moduleId: '44444444-4444-4444-8444-444444444444',
    startDate: daysAgo(30),
    status: StreamStatus.ACTIVE,
    contentSnapshot: [],
    createdAt: daysAgo(30),
  };

  const mocks: JobMocks = {
    getByStatuses: mock(async () => opts.students),
    save: mock(async (_s: Student) => {}),
    publish: mock((_e: unknown) => {}),
    getUserByUuid: mock(async (uuid: string) => {
      if (uuid === STUDENT_USER_ID) {
        return opts.studentTelegramId === undefined
          ? undefined
          : {
              uuid,
              name: 'Студент',
              telegramId: opts.studentTelegramId,
              roles: ['STUDENT'],
              createdAt: daysAgo(30),
            };
      }
      if (uuid === MENTOR_USER_ID) {
        return opts.mentorTelegramId === undefined
          ? undefined
          : {
              uuid,
              name: 'Ментор',
              telegramId: opts.mentorTelegramId,
              roles: ['MENTOR'],
              createdAt: daysAgo(30),
            };
      }
      return undefined;
    }),
    getStream: mock(async () => stream),
  };

  const resolve = {
    streamRepo: { getByUuid: mocks.getStream },
    streamStudentRepo: {
      getByStatuses: mocks.getByStatuses,
      save: mocks.save,
      getByUuid: mock(async () => undefined),
      getByStream: mock(async () => []),
      getByUser: mock(async () => []),
    },
    userFacade: { getUserByUuid: mocks.getUserByUuid },
    courseFacade: {},
    appResolver: { logger: new ConsoleLogger(), mode: 'development' as const },
    eventBus: { publish: mocks.publish },
  } as unknown as StreamApiModuleResolver;

  return { resolve, mocks };
}

function publishedEvents(mocks: JobMocks): Array<{
  eventName: string;
  payload: Record<string, unknown>;
}> {
  return (mocks.publish as ReturnType<typeof mock>).mock.calls.map((c) => c[0]);
}

describe('InactivitySweepJob', () => {
  let job: InactivitySweepJob;

  beforeEach(() => {
    job = new InactivitySweepJob();
  });

  // ── Константы порогов (FR-2) ──

  test('константы порогов: WARN=5, REMOVE=7, NOTICE_EVERY=2', () => {
    expect(WARN_AFTER_DAYS).toBe(5);
    expect(REMOVE_AFTER_DAYS).toBe(7);
    expect(NOTICE_EVERY_DAYS).toBe(2);
  });

  test('расписание — ежедневно в 19:00 UTC', () => {
    expect(job.schedule).toEqual({ kind: 'dailyAt', hour: 19, minute: 0 });
  });

  // ── Порог предупреждения студенту ──

  test('enrolled без шагов, 4 дня бездействия — ничего не отправляется', async () => {
    const { resolve, mocks } = makeResolve({
      students: [makeStudent({ enrolledAt: daysAgo(4) })],
      studentTelegramId: 1003,
      mentorTelegramId: 1004,
    });
    job.init(resolve);

    await job.execute();

    expect(mocks.publish).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  test('enrolled без шагов, 5 дней от enrolledAt → предупреждение студенту', async () => {
    const { resolve, mocks } = makeResolve({
      students: [makeStudent({ enrolledAt: daysAgo(5) })],
      studentTelegramId: 1003,
      mentorTelegramId: 1004,
    });
    job.init(resolve);

    await job.execute();

    const events = publishedEvents(mocks);
    expect(events).toHaveLength(1);
    expect(events[0]?.eventName).toBe('student.inactivity-warning');
    expect(events[0]?.payload.telegramId).toBe(1003);
    expect(events[0]?.payload.daysInactive).toBe(5);

    // Маркер сохранён
    expect(mocks.save).toHaveBeenCalledTimes(1);
    const saved = (mocks.save as ReturnType<typeof mock>).mock.calls[0]![0];
    expect(saved.notices).toEqual([
      { kind: 'inactivity_warn_student', sentAt: expect.any(String) },
    ]);
  });

  test('активность от последнего шага важнее enrolledAt', async () => {
    // Зачислен 20 дней назад, но последний шаг 1 день назад → активен
    const student = makeStudent({
      enrolledAt: daysAgo(20),
      steps: [
        {
          stepId: STEP_ID,
          status: 'issued',
          issuedAt: daysAgo(1),
        },
      ],
    });
    const { resolve, mocks } = makeResolve({
      students: [student],
      studentTelegramId: 1003,
    });
    job.init(resolve);

    await job.execute();

    expect(mocks.publish).not.toHaveBeenCalled();
  });

  // ── Порог уведомления ментору ──

  test('active с шагами, 7 дней от последнего шага → уведомление ментору с wasWarned=false', async () => {
    const student = makeStudent({
      status: 'active',
      steps: [
        {
          stepId: STEP_ID,
          status: 'completed',
          issuedAt: daysAgo(8),
          completedAt: daysAgo(7),
        },
      ],
    });
    const { resolve, mocks } = makeResolve({
      students: [student],
      studentTelegramId: 1003,
      mentorTelegramId: 1004,
    });
    job.init(resolve);

    await job.execute();

    const events = publishedEvents(mocks);
    const names = events.map((e) => e.eventName);
    // День 7: и студенту (первое), и ментору (первое)
    expect(names).toContain('student.inactivity-warning');
    expect(names).toContain('student.inactivity-remove-candidate');

    const candidate = events.find(
      (e) => e.eventName === 'student.inactivity-remove-candidate',
    );
    expect(candidate?.payload.mentorTelegramId).toBe(1004);
    expect(candidate?.payload.daysInactive).toBe(7);
    expect(candidate?.payload.wasWarned).toBe(false);
  });

  test('wasWarned=true, если студенту ранее отправлялись предупреждения', async () => {
    const student = makeStudent({
      status: 'active',
      steps: [
        {
          stepId: STEP_ID,
          status: 'completed',
          issuedAt: daysAgo(9),
          completedAt: daysAgo(8),
        },
      ],
      notices: [{ kind: 'inactivity_warn_student', sentAt: daysAgo(2) }],
    });
    const { resolve, mocks } = makeResolve({
      students: [student],
      studentTelegramId: 1003,
      mentorTelegramId: 1004,
    });
    job.init(resolve);

    await job.execute();

    const candidate = publishedEvents(mocks).find(
      (e) => e.eventName === 'student.inactivity-remove-candidate',
    );
    expect(candidate?.payload.wasWarned).toBe(true);
  });

  // ── Периодичность «через день» ──

  test('студенту: маркер день назад (после warning в этот же день) → повтор не отправляется', async () => {
    // 6 дней бездействия, warning отправлен вчера (день 5)
    const student = makeStudent({
      enrolledAt: daysAgo(6),
      notices: [{ kind: 'inactivity_warn_student', sentAt: daysAgo(1) }],
    });
    const { resolve, mocks } = makeResolve({
      students: [student],
      studentTelegramId: 1003,
      mentorTelegramId: 1004,
    });
    job.init(resolve);

    await job.execute();

    const names = publishedEvents(mocks).map((e) => e.eventName);
    expect(names).not.toContain('student.inactivity-warning');
  });

  test('студенту: маркер 2 дня назад → повтор отправляется (5 → 7 → 9…)', async () => {
    const student = makeStudent({
      enrolledAt: daysAgo(7),
      notices: [{ kind: 'inactivity_warn_student', sentAt: daysAgo(2) }],
    });
    const { resolve, mocks } = makeResolve({
      students: [student],
      studentTelegramId: 1003,
      mentorTelegramId: 1004,
    });
    job.init(resolve);

    await job.execute();

    const events = publishedEvents(mocks);
    expect(
      events.some((e) => e.eventName === 'student.inactivity-warning'),
    ).toBe(true);
  });

  test('ментору: маркер день назад → повтор не отправляется', async () => {
    const student = makeStudent({
      status: 'active',
      steps: [
        {
          stepId: STEP_ID,
          status: 'completed',
          issuedAt: daysAgo(9),
          completedAt: daysAgo(8),
        },
      ],
      notices: [
        { kind: 'inactivity_warn_student', sentAt: daysAgo(3) },
        { kind: 'inactivity_warn_mentor', sentAt: daysAgo(1) },
      ],
    });
    const { resolve, mocks } = makeResolve({
      students: [student],
      studentTelegramId: 1003,
      mentorTelegramId: 1004,
    });
    job.init(resolve);

    await job.execute();

    const names = publishedEvents(mocks).map((e) => e.eventName);
    expect(names).not.toContain('student.inactivity-remove-candidate');
  });

  test('ментору: маркер 2 дня назад → повтор отправляется (7 → 9…)', async () => {
    const student = makeStudent({
      status: 'active',
      steps: [
        {
          stepId: STEP_ID,
          status: 'completed',
          issuedAt: daysAgo(11),
          completedAt: daysAgo(10),
        },
      ],
      notices: [{ kind: 'inactivity_warn_mentor', sentAt: daysAgo(2) }],
    });
    const { resolve, mocks } = makeResolve({
      students: [student],
      studentTelegramId: 1003,
      mentorTelegramId: 1004,
    });
    job.init(resolve);

    await job.execute();

    const events = publishedEvents(mocks);
    expect(
      events.some((e) => e.eventName === 'student.inactivity-remove-candidate'),
    ).toBe(true);
  });

  // ── Возобновление учёбы сбрасывает цепочку (интеграционно с агрегатом) ──

  test('студент завершил шаг сегодня — маркеры сброшены, уведомлений нет', async () => {
    // Warning был 3 дня назад, но шаг завершён сегодня → дни = 0
    const student = makeStudent({
      status: 'active',
      steps: [
        {
          stepId: STEP_ID,
          status: 'completed',
          issuedAt: daysAgo(3),
          completedAt: daysAgo(0),
        },
      ],
      notices: [{ kind: 'inactivity_warn_student', sentAt: daysAgo(3) }],
    });
    const { resolve, mocks } = makeResolve({
      students: [student],
      studentTelegramId: 1003,
      mentorTelegramId: 1004,
    });
    job.init(resolve);

    await job.execute();

    expect(mocks.publish).not.toHaveBeenCalled();
  });

  // ── Отказоустойчивость ──

  test('нет telegramId у студента — событие студенту не публикуется, маркер не ставится', async () => {
    const { resolve, mocks } = makeResolve({
      students: [makeStudent({ enrolledAt: daysAgo(5) })],
      studentTelegramId: undefined,
      mentorTelegramId: 1004,
    });
    job.init(resolve);

    await job.execute();

    expect(mocks.publish).not.toHaveBeenCalled();
    expect(mocks.save).not.toHaveBeenCalled();
  });

  test('поток не найден — уведомление ментору не отправляется', async () => {
    const student = makeStudent({
      status: 'active',
      steps: [
        {
          stepId: STEP_ID,
          status: 'completed',
          issuedAt: daysAgo(9),
          completedAt: daysAgo(8),
        },
      ],
    });
    const { resolve, mocks } = makeResolve({
      students: [student],
      studentTelegramId: 1003,
      mentorTelegramId: 1004,
    });
    (resolve.streamRepo.getByUuid as unknown as ReturnType<typeof mock>) = mock(
      async () => undefined,
    );
    job.init(resolve);

    await job.execute();

    const names = publishedEvents(mocks).map((e) => e.eventName);
    expect(names).not.toContain('student.inactivity-remove-candidate');
    // Студенту предупреждение остаётся
    expect(names).toContain('student.inactivity-warning');
  });

  test('ошибка обработки одного студента не прерывает обход', async () => {
    const broken = makeStudent({
      userId: '99999999-9999-4999-8999-999999999999',
      enrolledAt: daysAgo(5),
    });
    const healthy = makeStudent({ enrolledAt: daysAgo(5) });
    let first = true;
    const { resolve, mocks } = makeResolve({
      students: [broken, healthy],
      studentTelegramId: 1003,
      mentorTelegramId: 1004,
    });
    (resolve.userFacade.getUserByUuid as unknown as ReturnType<typeof mock>) =
      mock(async (uuid: string) => {
        if (first && uuid === '99999999-9999-4999-8999-999999999999') {
          first = false;
          throw new Error('db error');
        }
        return {
          uuid,
          name: 'User',
          telegramId: 1003,
          roles: [],
          createdAt: daysAgo(30),
        };
      });
    job.init(resolve);

    await job.execute();

    // Оба студента обработаны (save от здорового есть), исключение не всплыло
    expect(mocks.save).toHaveBeenCalled();
  });
});
