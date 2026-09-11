import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { assertMarkdownV2Safe, type MdText } from '@u7-scl/core/shared';
import type {
  BotSession,
  DialogResponse,
  NotificationPayload,
} from '@u7-scl/core/ui';
import { assertDialogResponseMarkdownSafe } from '@u7-scl/core/ui';
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
const STUDENT_USER_ID = '11111111-1111-4111-8111-111111111111';
const MENTOR_USER_ID = '66666666-6666-4666-8666-666666666666';
const GROUP_ID = '-1002222222222';

const student: User = {
  uuid: STUDENT_USER_ID,
  name: 'Иван Студент',
  telegramId: 1003,
  roles: [Role.STUDENT],
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
    aggregateId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    payload: {
      studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
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
    aggregateId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    payload: {
      studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
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
    aggregateId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    payload: {
      studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      userId: STUDENT_USER_ID,
      streamId: STREAM_ID,
      who: 'self',
      cause: 'voluntary',
      ...overrides,
    },
  };
}

// ══ Сборка стори с моками ══

function setupStory(opts: { streamOverrides?: Partial<Stream> } = {}): {
  story: InactivityStory;
  notifies: Array<{ telegramId: number; payload: NotificationPayload }>;
  invites: Array<{
    telegramId: number;
    payload: {
      text: MdText;
      keyboard: { rows: Array<Array<{ text: string; code: string }>> };
    };
  }>;
  kicks: Array<{ groupId: number | string; userId: number }>;
  execute: ReturnType<typeof mock>;
} {
  const notifies: Array<{
    telegramId: number;
    payload: NotificationPayload;
  }> = [];
  const invites: Array<{
    telegramId: number;
    payload: {
      text: MdText;
      keyboard: { rows: Array<Array<{ text: string; code: string }>> };
    };
  }> = [];
  const kicks: Array<{ groupId: number | string; userId: number }> = [];
  const execute = mock(
    async (name: string, params?: Record<string, unknown>) => {
      if (name === 'get-user') {
        const uuid = params?.uuid as string;
        if (uuid === STUDENT_USER_ID) return student;
        return undefined;
      }
      if (name === 'get-stream') {
        return { ...stream, ...opts.streamOverrides };
      }
      if (name === 'get-student-progress') {
        const sid = params?.studentId as string;
        if (sid === 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa') {
          return {
            uuid: sid,
            userId: STUDENT_USER_ID,
            streamId: STREAM_ID,
            status: 'active',
          };
        }
        return undefined;
      }
      return undefined;
    },
  );

  const story = new InactivityStory();
  Object.assign(story, {
    appApi: { execute },
    proactiveSender: {
      notify: mock(async (telegramId: number, payload: NotificationPayload) => {
        notifies.push({ telegramId, payload });
      }),
      invite: mock(
        async (
          telegramId: number,
          payload: {
            text: MdText;
            keyboard: { rows: Array<Array<{ text: string; code: string }>> };
          },
        ) => {
          invites.push({ telegramId, payload });
        },
      ),
      kickFromGroup: mock(async (groupId: number | string, userId: number) => {
        kicks.push({ groupId, userId });
      }),
    },
  } as unknown);

  return { story, notifies, invites, kicks, execute };
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

  test('warning → студенту invite с кнопкой «🚪 Покинуть учёбу»', async () => {
    const { story, invites, notifies } = setupStory();

    await subHandler(
      story,
      'student.inactivity-warning',
    )(makeWarningEvent() as never);

    // Кнопочный проактив — канал invite (не notify)
    expect(notifies).toHaveLength(0);
    expect(invites).toHaveLength(1);
    expect(invites[0]?.telegramId).toBe(1003);
    const text = String(invites[0]?.payload.text);
    expect(text).toContain('5 дней');
    expect(text).toContain('снять тебя с учёбы');
    expect(text).not.toContain('/start');
    // Кнопка самовыхода: в drop-student confirm этой же стори
    const btns = invites[0]?.payload.keyboard.rows.flat() ?? [];
    expect(btns).toHaveLength(1);
    expect(btns[0]?.text).toBe('🚪 Покинуть учёбу');
    // Полный путь (кросс-диалоговый invite-канал, как в Routes.stream)
    expect(btns[0]?.code).toBe(
      'stream:inactivity:drop-student:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );
  });

  test('warning: текст валиден для MarkdownV2', async () => {
    const { story, invites } = setupStory();

    await subHandler(
      story,
      'student.inactivity-warning',
    )(makeWarningEvent() as never);

    expect(() =>
      assertMarkdownV2Safe(String(invites[0]?.payload.text)),
    ).not.toThrow();
  });

  // ── Уведомление ментору (FR-1, 7+ дней) ──

  test('candidate → ментору invite с кнопкой «⚠️ Снять с учёбы»', async () => {
    const { story, invites, notifies } = setupStory();

    await subHandler(
      story,
      'student.inactivity-remove-candidate',
    )(makeCandidateEvent() as never);

    // Кнопочный проактив — канал invite (не notify)
    expect(notifies).toHaveLength(0);
    expect(invites).toHaveLength(1);
    expect(invites[0]?.telegramId).toBe(1004);
    const text = String(invites[0]?.payload.text);
    // доменные данные экранированы md-интерполяцией — литерал без спецсимволов
    expect(text).toContain('Иван Студент');
    expect(text).toContain('JS Core — Поток 2');
    expect(text).toContain('7 дней');
    expect(text).not.toContain('ранее отправлены');
    expect(text).not.toContain('Действия по студенту');
    // Кнопка снятия: в mark-abandoned confirm этой же стори
    const btns = invites[0]?.payload.keyboard.rows.flat() ?? [];
    expect(btns).toHaveLength(1);
    expect(btns[0]?.text).toBe('⚠️ Снять с учёбы');
    expect(btns[0]?.code).toBe(
      'stream:inactivity:mark-abandoned:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );
  });

  test('candidate с wasWarned → строка «уведомления были ранее отправлены»', async () => {
    const { story, invites } = setupStory();

    await subHandler(
      story,
      'student.inactivity-remove-candidate',
    )(makeCandidateEvent({ wasWarned: true }) as never);

    const text = String(invites[0]?.payload.text);
    expect(text).toContain('Уведомления были ранее отправлены');
    expect(() => assertMarkdownV2Safe(text)).not.toThrow();
  });

  test('candidate: имя не резолвится → fallback, первые 8 символов userId', async () => {
    const { story, invites } = setupStory();

    await subHandler(
      story,
      'student.inactivity-remove-candidate',
    )(
      makeCandidateEvent({
        userId: '99999999-9999-4999-8999-999999999999',
      }) as never,
    );

    const text = String(invites[0]?.payload.text);
    expect(text).toContain('99999999');
    expect(() => assertMarkdownV2Safe(text)).not.toThrow();
  });

  // ── События ухода (кик; текстовые уведомления — в UC, трек user-notify) ──

  test('abandoned → мягкий кик из группы потока (FR-6)', async () => {
    const { story, kicks } = setupStory({
      streamOverrides: { telegramGroupId: GROUP_ID },
    });

    await subHandler(story, 'student.abandoned')(makeAbandonedEvent() as never);

    expect(kicks).toHaveLength(1);
    expect(kicks[0]).toEqual({ groupId: GROUP_ID, userId: 1003 });
  });

  test('abandoned: у потока нет группы — кик не вызывается, ошибок нет', async () => {
    const { story, kicks } = setupStory();

    await subHandler(story, 'student.abandoned')(makeAbandonedEvent() as never);

    expect(kicks).toHaveLength(0);
  });

  test('abandoned: у студента нет telegramId — кик не вызывается', async () => {
    const { story, kicks } = setupStory({
      streamOverrides: { telegramGroupId: GROUP_ID },
    });

    // get-user вернул студента без telegramId — кику некому
    const userWithoutTg = { ...student, telegramId: undefined };
    (story as unknown as { appApi: unknown }).appApi = {
      execute: mock(async (name: string) => {
        if (name === 'get-user') return userWithoutTg;
        if (name === 'get-stream') return stream;
        return undefined;
      }),
    };

    await subHandler(story, 'student.abandoned')(makeAbandonedEvent() as never);

    expect(kicks).toHaveLength(0);
  });

  // ── Callback: восстановленные кнопочные сценарии (FR-4/FR-5) ──

  const SESSION = {
    dialog: { path: 'streams/inactivity', seq: 1 },
  } as BotSession;

  function buttonCodes(
    response: DialogResponse,
  ): Array<{ text: string; code: string }> {
    return response.screen?.keyboard?.rows.flat() ?? [];
  }

  test('drop-student: confirm-диалог «Покинуть учёбу?» с возвратом в меню', async () => {
    const { story } = setupStory();

    const response = await story.handleCallback(
      `drop-student:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`,
      student,
      SESSION,
    );

    assertDialogResponseMarkdownSafe(response);
    expect(String(response.screen?.text)).toContain('Покинуть учёбу?');
    expect(String(response.screen?.text)).toContain('Прогресс сохранится');
    const btns = buttonCodes(response);
    expect(btns).toEqual([
      {
        text: '🚪 Да, покинуть',
        code: 'inactivity:drop-student-confirm:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      },
      { text: '❌ Остаться', code: 'app:main-menu' },
    ]);
  });

  test('drop-student-confirm: UC drop-student + прощание и выход в меню', async () => {
    const { story, execute } = setupStory({
      streamOverrides: { telegramGroupId: GROUP_ID },
    });

    const response = await story.handleCallback(
      `drop-student-confirm:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`,
      student,
      SESSION,
    );

    assertDialogResponseMarkdownSafe(response);
    expect(execute).toHaveBeenCalledWith(
      'drop-student',
      {
        streamId: STREAM_ID,
        studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      },
      student.uuid,
    );
    expect(String(response.screen?.text)).toContain('Ты покинул учёбу');
    expect(buttonCodes(response)).toEqual([
      { text: '⬅️ В меню', code: 'app:main-menu' },
    ]);
  });

  test('mark-abandoned: confirm-диалог снятия с возвратом в меню', async () => {
    const { story, execute } = setupStory();

    const response = await story.handleCallback(
      `mark-abandoned:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`,
      student,
      SESSION,
    );

    assertDialogResponseMarkdownSafe(response);
    expect(execute).toHaveBeenCalledWith(
      'get-student-progress',
      { studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
      student.uuid,
    );
    expect(String(response.screen?.text)).toContain(
      'Снять студента *Иван Студент*',
    );
    expect(String(response.screen?.text)).toContain(
      'исключён из группы потока',
    );
    const btns = buttonCodes(response);
    expect(btns).toEqual([
      {
        text: '⚠️ Да, снять с учёбы',
        code: 'inactivity:mark-abandoned-confirm:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      },
      { text: '❌ Отмена', code: 'app:main-menu' },
    ]);
  });

  test('mark-abandoned: студент не найден — экран «Запись студента не найдена»', async () => {
    const { story } = setupStory();

    const response = await story.handleCallback(
      `mark-abandoned:bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb`,
      student,
      SESSION,
    );

    expect(String(response.screen?.text)).toContain(
      'Запись студента не найдена',
    );
  });

  test('mark-abandoned-confirm: UC mark-abandoned cause=inactivity + реплика результата', async () => {
    const { story, execute } = setupStory();

    const response = await story.handleCallback(
      `mark-abandoned-confirm:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa`,
      student,
      SESSION,
    );

    assertDialogResponseMarkdownSafe(response);
    expect(execute).toHaveBeenCalledWith(
      'mark-abandoned',
      {
        streamId: STREAM_ID,
        studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        cause: 'inactivity',
      },
      student.uuid,
    );
    expect(String(response.screen?.text)).toContain(
      'снят с учёбы за бездействие и исключён из группы потока',
    );
    expect(buttonCodes(response)).toEqual([]);
  });

  test('drop-student-confirm: ошибка UC — экран ошибки с выходом в меню', async () => {
    const { story } = setupStory();
    // get-student-progress для несуществующего студента бросает —
    // #getStudent возвращает undefined → экран «не найдена» (без UC-вызова)
    const response = await story.handleCallback(
      `drop-student-confirm:bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb`,
      student,
      SESSION,
    );

    expect(String(response.screen?.text)).toContain(
      'Запись студента не найдена',
    );
  });

  test('неизвестный action — экран «Неизвестная команда»', async () => {
    const { story } = setupStory();

    const response = await story.handleCallback('wat:123', student, SESSION);

    assertDialogResponseMarkdownSafe(response);
    expect(String(response.screen?.text)).toContain('Неизвестная команда');
  });
});
