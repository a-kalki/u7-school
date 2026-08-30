import { beforeEach, describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import type {
  Stream,
  StudentAbandonedEvent,
  StudentInactivityRemoveCandidateEvent,
  StudentInactivityWarningEvent,
} from '@u7-scl/stream/domain';
import { StreamStatus } from '@u7-scl/stream/domain';
import { Role } from '@u7-scl/user/domain';
import { InactivityStory } from './inactivity.story';

// ══ Фикстуры ══

const STREAM_ID = '77777777-7777-4777-8777-777777777777';
const STUDENT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const STUDENT_USER_ID = '11111111-1111-4111-8111-111111111111';
const MENTOR_USER_ID = '66666666-6666-4666-8666-666666666666';

const student: User = {
  uuid: STUDENT_USER_ID,
  name: 'Иван Студент',
  telegramId: 1003,
  roles: [Role.STUDENT],
  createdAt: '2026-01-01T00:00',
};

const mentor: User = {
  uuid: MENTOR_USER_ID,
  name: 'Мария Ментор',
  telegramId: 1004,
  roles: [Role.MENTOR],
  createdAt: '2026-01-01T00:00',
};

const stream: Stream = {
  uuid: STREAM_ID,
  title: 'JS Core — Поток 2',
  description: 'Второй поток',
  mentorId: MENTOR_USER_ID,
  moduleId: '44444444-4444-4444-8444-444444444444',
  startDate: '2026-06-01T00:00',
  status: StreamStatus.ACTIVE,
  contentSnapshot: [],
  createdAt: '2026-06-01T00:00',
};

function makeWarningEvent(
  overrides: Partial<StudentInactivityWarningEvent['payload']> = {},
): StudentInactivityWarningEvent {
  return {
    eventId: crypto.randomUUID(),
    eventName: 'student.inactivity-warning',
    occurredAt: '2026-08-30T19:00',
    aggregateName: 'Student',
    aggregateId: STUDENT_ID,
    payload: {
      studentId: STUDENT_ID,
      userId: STUDENT_USER_ID,
      streamId: STREAM_ID,
      telegramId: 1003,
      daysInactive: 5,
      ...overrides,
    },
  };
}

function makeCandidateEvent(
  overrides: Partial<StudentInactivityRemoveCandidateEvent['payload']> = {},
): StudentInactivityRemoveCandidateEvent {
  return {
    eventId: crypto.randomUUID(),
    eventName: 'student.inactivity-remove-candidate',
    occurredAt: '2026-08-30T19:00',
    aggregateName: 'Student',
    aggregateId: STUDENT_ID,
    payload: {
      studentId: STUDENT_ID,
      userId: STUDENT_USER_ID,
      streamId: STREAM_ID,
      mentorTelegramId: 1004,
      daysInactive: 7,
      wasWarned: false,
      ...overrides,
    },
  };
}

function makeAbandonedEvent(
  overrides: Partial<StudentAbandonedEvent['payload']> = {},
): StudentAbandonedEvent {
  return {
    eventId: crypto.randomUUID(),
    eventName: 'student.abandoned',
    occurredAt: '2026-08-30T19:00',
    aggregateName: 'Student',
    aggregateId: STUDENT_ID,
    payload: {
      studentId: STUDENT_ID,
      userId: STUDENT_USER_ID,
      streamId: STREAM_ID,
      who: 'self',
      cause: 'voluntary',
      ...overrides,
    },
  };
}

// ══ Сборка стори с моками ══

interface SetupOptions {
  studentEntity?: {
    uuid: string;
    streamId: string;
    userId: string;
    status: string;
  };
}

function setupStory(opts: SetupOptions = {}): {
  story: InactivityStory;
  sends: Array<{ telegramId: number; text: string }>;
  notifies: Array<{ telegramId: number; text: string }>;
  execute: ReturnType<typeof mock>;
} {
  const sends: Array<{ telegramId: number; text: string }> = [];
  const notifies: Array<{ telegramId: number; text: string }> = [];
  const execute = mock(
    async (name: string, params?: Record<string, unknown>) => {
      if (name === 'get-user') {
        const uuid = params?.uuid as string;
        if (uuid === STUDENT_USER_ID) return student;
        if (uuid === MENTOR_USER_ID) return mentor;
        return undefined;
      }
      if (name === 'get-stream') return stream;
      if (name === 'get-student-progress') {
        return (
          opts.studentEntity ?? {
            uuid: STUDENT_ID,
            streamId: STREAM_ID,
            userId: STUDENT_USER_ID,
            status: 'active',
          }
        );
      }
      return undefined;
    },
  );

  const story = new InactivityStory();
  Object.assign(story, {
    appApi: { execute },
    proactiveSender: {
      send: mock(
        async (
          telegramId: number,
          command: { sendMessage: { text: string } },
        ) => {
          sends.push({ telegramId, text: command.sendMessage.text });
        },
      ),
      notify: mock(async (telegramId: number, payload: { text: string }) => {
        notifies.push({ telegramId, text: payload.text });
      }),
    },
    uiApp: { getAction: () => () => ({ text: '↩️', code: 'app:main-menu' }) },
  } as unknown);

  return { story, sends, notifies, execute };
}

/** Достаёт обработчик подписки по имени события */
function subHandler(
  story: InactivityStory,
  eventName: string,
): (event: never) => Promise<void> {
  const sub = story
    .getEventSubscriptions()
    .find((s) => s.eventName === eventName);
  if (!sub) throw new Error(`Подписка ${eventName} не найдена`);
  return sub.handle as (event: never) => Promise<void>;
}

describe('InactivityStory', () => {
  let actor: User;

  beforeEach(() => {
    actor = { ...student };
  });

  // ── Подписки ──

  test('подписывается на три события бездействия и ухода', () => {
    const { story } = setupStory();
    const names = story
      .getEventSubscriptions()
      .map((s) => s.eventName)
      .sort();
    expect(names).toEqual([
      'student.abandoned',
      'student.inactivity-remove-candidate',
      'student.inactivity-warning',
    ]);
  });

  // ── Предупреждение студенту (FR-1, 5+ дней) ──

  test('warning → студенту сообщение о N днях + кнопка «Покинуть учёбу»', async () => {
    const { story, sends } = setupStory();

    await subHandler(
      story,
      'student.inactivity-warning',
    )(makeWarningEvent() as never);

    expect(sends).toHaveLength(1);
    expect(sends[0]?.telegramId).toBe(1003);
    const text = sends[0]?.text ?? '';
    expect(text).toContain('5 дней');
    expect(text).toContain('снять тебя с учёбы');
  });

  test('warning: сообщение валидно для MarkdownV2', async () => {
    const { story, sends } = setupStory();

    await subHandler(
      story,
      'student.inactivity-warning',
    )(makeWarningEvent() as never);

    // Проверяем форму BotCommand через подписку proactiveSender — текст собран
    // стори в MarkdownV2; пробегаем через валидатор как response
    const text = sends[0]?.text ?? '';
    expect(() => {
      assertResponseMarkdownSafe({
        sendMessage: {
          text,
          parseMode: 'MarkdownV2',
        },
      });
    }).not.toThrow();
  });

  // ── Уведомление ментору (FR-1, 7+ дней) ──

  test('candidate → ментору «не занимался N дней» + кнопка «Снять с учёбы»', async () => {
    const { story, sends } = setupStory();

    await subHandler(
      story,
      'student.inactivity-remove-candidate',
    )(makeCandidateEvent() as never);

    expect(sends).toHaveLength(1);
    expect(sends[0]?.telegramId).toBe(1004);
    const text = sends[0]?.text ?? '';
    expect(text).toContain('Иван Студент');
    expect(text).toContain('JS Core — Поток 2');
    expect(text).toContain('7 дней');
    expect(text).not.toContain('ранее отправлены');
  });

  test('candidate с wasWarned → строка «уведомления были ранее отправлены»', async () => {
    const { story, sends } = setupStory();

    await subHandler(
      story,
      'student.inactivity-remove-candidate',
    )(makeCandidateEvent({ wasWarned: true }) as never);

    expect(sends[0]?.text).toContain('Уведомления были ранее отправлены');

    // MarkdownV2-валидация (динамические значения + точка после них)
    expect(() => {
      assertResponseMarkdownSafe({
        sendMessage: { text: sends[0]?.text ?? '', parseMode: 'MarkdownV2' },
      });
    }).not.toThrow();
  });

  // ── События ухода (FR-4/FR-5) ──

  test('abandoned who=self → ментору «покинул учёбу»', async () => {
    const { story, sends, notifies } = setupStory();

    await subHandler(
      story,
      'student.abandoned',
    )(makeAbandonedEvent({ who: 'self', cause: 'voluntary' }) as never);

    const all = [...sends, ...notifies];
    expect(all).toHaveLength(1);
    expect(all[0]?.telegramId).toBe(1004);
    expect(all[0]?.text).toContain('Иван Студент');
    expect(all[0]?.text).toContain('покинул учёбу');
  });

  test('abandoned who=mentor → студенту «Ты снят с учёбы…»', async () => {
    const { story, sends, notifies } = setupStory();

    await subHandler(
      story,
      'student.abandoned',
    )(
      makeAbandonedEvent({
        who: 'mentor',
        cause: 'inactivity',
      }) as never,
    );

    const all = [...sends, ...notifies];
    expect(all).toHaveLength(1);
    expect(all[0]?.telegramId).toBe(1003);
    expect(all[0]?.text).toContain('снят с учёбы');
  });

  // ── Callback: самовыход (FR-4) ──

  test('drop-student → confirm-диалог «Покинуть учёбу»', async () => {
    const { story } = setupStory();

    const response = await story.handleCallback(
      `drop-student:${STUDENT_ID}`,
      actor,
      { activeHandler: null },
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Покинуть учёбу');
    const buttons = response.sendMessage?.keyboard?.rows.flat() ?? [];
    expect(buttons.some((b) => b.code.includes('drop-student-confirm'))).toBe(
      true,
    );
    assertResponseMarkdownSafe(response);
  });

  test('drop-student-confirm → выполняет drop-student и отвечает', async () => {
    const { story, execute } = setupStory();

    const response = await story.handleCallback(
      `drop-student-confirm:${STUDENT_ID}`,
      actor,
      { activeHandler: null },
    );

    expect(execute).toHaveBeenCalledWith(
      'drop-student',
      { streamId: STREAM_ID, studentId: STUDENT_ID },
      STUDENT_USER_ID,
    );
    expect(response.sendMessage?.text).toContain('покинул учёбу');
  });

  // ── Callback: снятие ментором (FR-5) ──

  test('mark-abandoned → confirm-диалог «Снять с учёбы»', async () => {
    const { story } = setupStory();

    const response = await story.handleCallback(
      `mark-abandoned:${STUDENT_ID}`,
      mentor,
      { activeHandler: null },
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Снять студента с учёбы');
    const buttons = response.sendMessage?.keyboard?.rows.flat() ?? [];
    expect(buttons.some((b) => b.code.includes('mark-abandoned-confirm'))).toBe(
      true,
    );
    assertResponseMarkdownSafe(response);
  });

  test('mark-abandoned-confirm → выполняет mark-abandoned с cause=inactivity', async () => {
    const { story, execute } = setupStory();

    const response = await story.handleCallback(
      `mark-abandoned-confirm:${STUDENT_ID}`,
      mentor,
      { activeHandler: null },
    );

    expect(execute).toHaveBeenCalledWith(
      'mark-abandoned',
      {
        streamId: STREAM_ID,
        studentId: STUDENT_ID,
        cause: 'inactivity',
      },
      MENTOR_USER_ID,
    );
    expect(response.sendMessage?.text).toContain('снят с учёбы');
  });

  test('неизвестный action → сообщение об ошибке', async () => {
    const { story } = setupStory();

    const response = await story.handleCallback('unknown:1', actor, {
      activeHandler: null,
    });

    expect(response.sendMessage?.text).toContain('Неизвестная команда');
  });
});
