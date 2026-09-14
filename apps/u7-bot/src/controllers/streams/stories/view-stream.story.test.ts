import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { BotSession } from '@u7-scl/core/ui';
import { assertDialogResponseMarkdownSafe } from '@u7-scl/core/ui';
import type { ContentSnapshot } from '@u7-scl/course/domain';
import { Role } from '@u7-scl/user/domain';
import { ViewStreamStory } from './view-stream.story';

const STREAM_ID = 's-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s';

/** Поток в статусе enrollment с кодовым словом и без */
function makeStream(overrides: Record<string, unknown> = {}) {
  return {
    uuid: STREAM_ID,
    title: 'Поток «JS Core — Поток 2»',
    description: 'Базовый поток по fullstack JS',
    status: 'enrollment',
    startDate: '2026-10-01T10:00:00.000Z',
    mentorId: 'm1-m1-m1',
    contentSnapshot: [] as ContentSnapshot,
    ...overrides,
  };
}

function makeActor(roles: Role[] = [Role.GUEST]): User {
  return {
    uuid: 'user-1',
    name: 'Гость',
    telegramId: 123,
    roles,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('ViewStreamStory (S02-S04)', () => {
  const session: BotSession = {
    dialog: { path: 'stream/view-stream', seq: 2 },
  };
  const guest = makeActor();

  interface SetupOptions {
    /** Поток, возвращаемый get-stream */
    stream?: Record<string, unknown>;
    /** Студенты, возвращаемые list-stream-students */
    students?: unknown[];
    /** Пользователи, возвращаемые get-user (по uuid) */
    users?: Record<string, { name: string }>;
  }

  function makeStory(opts: SetupOptions = {}) {
    const mockAppApi = {
      execute: mock(async (name: string, params?: Record<string, unknown>) => {
        if (name === 'get-stream') return opts.stream ?? makeStream();
        if (name === 'list-stream-students') return opts.students ?? [];
        if (name === 'get-user')
          return (
            opts.users?.[String(params?.uuid)] ?? {
              uuid: params?.uuid,
              name: 'Ментор Менторович',
              roles: [],
            }
          );
        if (name === 'get-student-progress') return undefined;
        return undefined;
      }),
    };

    const story = new ViewStreamStory();
    story.init({ appApi: mockAppApi } as never);
    return { story, mockAppApi };
  }

  // ── Карточка потока (view) ──

  test('view: показывает карточку потока', async () => {
    const { story } = makeStory();
    const response = await story.handleCallback(
      `view:${STREAM_ID}`,
      guest,
      session,
    );
    assertDialogResponseMarkdownSafe(response);
    const text = String(response.screen?.text);
    expect(text).toContain('Поток «JS Core — Поток 2»');
    expect(text).toContain('Базовый поток по fullstack JS');
    expect(text).toContain('🟡 Набор открыт');
  });

  test('view: активный поток — без мёртвой кнопки «🔔 Уведомить о наборе»', async () => {
    const { story } = makeStory({ stream: makeStream({ status: 'active' }) });
    const response = await story.handleCallback(
      `view:${STREAM_ID}`,
      guest,
      session,
    );
    assertDialogResponseMarkdownSafe(response);
    const btnTexts =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Уведомить'))).toBe(false);
  });

  test('view: показывает имя ментора', async () => {
    const { story } = makeStory();
    const response = await story.handleCallback(
      `view:${STREAM_ID}`,
      guest,
      session,
    );
    expect(String(response.screen?.text)).toContain('Ментор Менторович');
  });

  test('view: показывает количество студентов', async () => {
    const { story } = makeStory({
      students: [{ uuid: 'st1' }, { uuid: 'st2' }],
    });
    const response = await story.handleCallback(
      `view:${STREAM_ID}`,
      guest,
      session,
    );
    expect(String(response.screen?.text)).toContain('Студентов: 2');
  });

  test('view: строчка «📚 Курс: Fullstack JS»', async () => {
    const { story } = makeStory();
    const response = await story.handleCallback(
      `view:${STREAM_ID}`,
      guest,
      session,
    );
    expect(String(response.screen?.text)).toContain('📚 Курс: Fullstack JS');
  });

  test('S02: публичные кнопки — Детали/Программа (рядом), Студенты, Назад к списку', async () => {
    const { story } = makeStory();
    const response = await story.handleCallback(
      `view:${STREAM_ID}`,
      guest,
      session,
    );
    const codes =
      response.screen?.keyboard?.rows.flat().map((b) => b.code) ?? [];
    expect(codes).toContain(`view-stream:program:${STREAM_ID}`);
    expect(codes).toContain(`view-stream:students:${STREAM_ID}`);
    expect(codes).toContain(`view-stream:details:${STREAM_ID}`);
    expect(codes).toContain('catalog:list');
  });

  test('view: гост на enrollment — кнопка «📝 Записаться»', async () => {
    const { story } = makeStory();
    const response = await story.handleCallback(
      `view:${STREAM_ID}`,
      guest,
      session,
    );
    const btnTexts =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Записаться'))).toBe(true);
  });

  test('MENTOR — владелец потока — НЕ видит lifecycle-кнопок', async () => {
    const mentor = makeActor([Role.MENTOR]);
    const { story } = makeStory({
      stream: makeStream({ mentorId: mentor.uuid }),
    });
    const response = await story.handleCallback(
      `view:${STREAM_ID}`,
      mentor,
      session,
    );
    const btnTexts =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Записаться'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Уведомить'))).toBe(false);
  });

  // ── Программа (program) ──

  test('program: показывает contentSnapshot', async () => {
    const snapshot: ContentSnapshot = [
      {
        projectId: 'proj-1',
        projectTitle: 'Проект «CLI-калькулятор»',
        lessons: [
          {
            lessonId: 'l1',
            lessonTitle: 'Урок «Введение»',
            stepIds: ['1', '2'],
          },
        ],
      },
    ];
    const { story } = makeStory({
      stream: makeStream({ contentSnapshot: snapshot }),
    });
    const response = await story.handleCallback(
      `program:${STREAM_ID}`,
      guest,
      session,
    );
    assertDialogResponseMarkdownSafe(response);
    const text = String(response.screen?.text);
    expect(text).toContain('Программа курса');
    // префиксы — как в каталоге «Программы курсов»
    expect(text).toContain('Проект: Проект «CLI\\-калькулятор»');
    expect(text).toContain('Урок: Урок «Введение»');
    // дефис в доменном названии экранирован md-интерполяцией
    expect(text).toContain('CLI\\-калькулятор');
    expect(text).toContain('Введение');
  });

  test('program: пустой contentSnapshot — заглушка', async () => {
    const { story } = makeStory({
      stream: makeStream({ contentSnapshot: [] }),
    });
    const response = await story.handleCallback(
      `program:${STREAM_ID}`,
      guest,
      session,
    );
    expect(String(response.screen?.text)).toContain('не загружена');
  });

  // ── Детали (details) ──

  test('details: показывает заполненные поля', async () => {
    const { story } = makeStory({
      stream: makeStream({ goal: 'Цель курса', result: 'Результат курса' }),
    });
    const response = await story.handleCallback(
      `details:${STREAM_ID}`,
      guest,
      session,
    );
    const text = String(response.screen?.text);
    expect(text).toContain('Детали');
    expect(text).toContain('Цель курса');
    expect(text).toContain('Результат курса');
  });

  test('details: без полей — заглушка', async () => {
    const { story } = makeStory();
    const response = await story.handleCallback(
      `details:${STREAM_ID}`,
      guest,
      session,
    );
    expect(String(response.screen?.text)).toContain('не добавлена');
  });

  test('details: кнопка «Назад к потоку»', async () => {
    const { story } = makeStory();
    const response = await story.handleCallback(
      `details:${STREAM_ID}`,
      guest,
      session,
    );
    const codes =
      response.screen?.keyboard?.rows.flat().map((b) => b.code) ?? [];
    expect(codes).toContain(`view-stream:view:${STREAM_ID}`);
  });

  // ── Неизвестные команды ──

  test('неизвестная команда', async () => {
    const { story } = makeStory();
    const response = await story.handleCallback('bogus:1', guest, session);
    expect(String(response.screen?.text)).toContain('Неизвестная');
  });

  test('view без streamId — ошибка', async () => {
    const { story } = makeStory();
    const response = await story.handleCallback('view', guest, session);
    expect(String(response.screen?.text)).toContain('Неизвестная');
  });

  // ── Список студентов (students) ──

  /** Полная запись студента (как возвращает get-student-progress) */
  function makeStudent(overrides: Record<string, unknown> = {}) {
    return {
      uuid: 'st-1',
      userId: 'u-1',
      status: 'active',
      joinedAt: '2026-01-01T00:00:00.000Z',
      streamId: STREAM_ID,
      currentStepId: null,
      steps: [],
      ...overrides,
    };
  }

  test('students: пустой список — заголовок и «Назад к потоку»', async () => {
    const { story } = makeStory({ students: [] });
    const response = await story.handleCallback(
      `students:${STREAM_ID}`,
      guest,
      session,
    );
    assertDialogResponseMarkdownSafe(response);
    expect(String(response.screen?.text)).toContain('Студенты потока');
    const codes =
      response.screen?.keyboard?.rows.flat().map((b) => b.code) ?? [];
    expect(codes).toContain(`view-stream:view:${STREAM_ID}`);
  });

  test('students: НЕ содержит менторских кнопок (⛔✅🔄)', async () => {
    const { story } = makeStory({ students: [makeStudent()] });
    const response = await story.handleCallback(
      `students:${STREAM_ID}`,
      guest,
      session,
    );
    const btnTexts =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => /[⛔✅🔄]/u.test(t))).toBe(false);
  });

  // ── Карточка студента (student-detail) ──

  test('student-detail: показывает карточку студента', async () => {
    const mockAppApi = {
      execute: mock(async (name: string) => {
        if (name === 'get-student-progress') return makeStudent();
        if (name === 'get-stream') return makeStream();
        if (name === 'get-user')
          return { uuid: 'u-1', name: 'Студент Студентов', roles: [] };
        return undefined;
      }),
    };
    const { story } = makeStory();
    story.init({ appApi: mockAppApi } as never);

    const response = await story.handleCallback(
      'student-detail:st-1',
      guest,
      session,
    );
    assertDialogResponseMarkdownSafe(response);
    const text = String(response.screen?.text);
    expect(text).toContain('Студент Студентов');
    expect(text).toContain('Учится');
    const codes =
      response.screen?.keyboard?.rows.flat().map((b) => b.code) ?? [];
    expect(codes).toContain(`view-stream:students:${STREAM_ID}`);
  });

  // ── Запись (enroll): без кодового слова → delegate на меню ──

  test('enroll без кодового слова: поздравление-реплика + delegate на меню', async () => {
    const { story, mockAppApi } = makeStory({
      stream: makeStream({ enrollmentKey: undefined }),
    });
    const response = await story.handleCallback(
      `enroll:${STREAM_ID}`,
      guest,
      session,
    );

    expect(mockAppApi.execute).toHaveBeenCalledWith(
      'enroll-student',
      { streamId: STREAM_ID, userId: guest.uuid, enrollmentKey: undefined },
      guest.uuid,
    );
    expect(String(response.notify?.text)).toContain('успешно записаны');
    // delegate: enroll→menu (сохранённое использование)
    expect(response.delegate?.path).toBe('app:main-menu');
    expect(response.screen).toBeUndefined();
  });

  test('enroll c кодовым словом: экран запроса слова + awaitInput', async () => {
    const { story, mockAppApi } = makeStory({
      stream: makeStream({ enrollmentKey: 'дракон' }),
    });
    const response = await story.handleCallback(
      `enroll:${STREAM_ID}`,
      guest,
      session,
    );

    expect(String(response.screen?.text)).toContain('кодовое слово');
    // Зачисления ещё нет — только запрос слова
    const enrollCalls = (
      mockAppApi.execute as unknown as { mock: { calls: unknown[][] } }
    ).mock.calls.filter((c) => c[0] === 'enroll-student');
    expect(enrollCalls).toHaveLength(0);
    expect(response.awaitInput?.context).toEqual({
      streamId: STREAM_ID,
      enrollmentKey: 'дракон',
      attempts: 0,
    });
    // Кнопка отмены — на enroll-cancel
    const codes =
      response.screen?.keyboard?.rows.flat().map((b) => b.code) ?? [];
    expect(codes).toContain(`view-stream:cancel:${STREAM_ID}`);
  });

  test('enroll: ошибка UC — errorNotify (реплика warn без захвата экрана)', async () => {
    const { story } = makeStory();
    // Подменяем execute, чтобы enroll-student бросил ошибку валидации
    const failing = {
      execute: mock(async (name: string) => {
        if (name === 'get-stream')
          return makeStream({ enrollmentKey: undefined });
        if (name === 'enroll-student') throw new Error('validation failed');
        return undefined;
      }),
    };
    story.init({ appApi: failing } as never);

    const response = await story.handleCallback(
      `enroll:${STREAM_ID}`,
      guest,
      session,
    );
    expect(response.notify?.kind).toBe('warn');
    expect(response.delegate).toBeUndefined();
  });

  // ── Отмена записи (cancel): release + delegate на view ──

  test('cancel: release + delegate на экран потока (enroll-cancel→view)', async () => {
    const { story } = makeStory();
    const response = await story.handleCallback(
      `cancel:${STREAM_ID}`,
      guest,
      session,
    );
    expect(response.release).toBe(true);
    expect(response.delegate?.path).toBe(`view-stream:view:${STREAM_ID}`);
  });

  // ── Ввод кодового слова (handleMessage) ──

  function enrollSession(attempts: number): BotSession {
    return {
      dialog: {
        path: 'stream/view-stream',
        seq: 2,
        input: {
          context: { streamId: STREAM_ID, enrollmentKey: 'дракон', attempts },
        },
      },
    };
  }

  test('handleMessage: верное слово — зачисление (notify + delegate на меню)', async () => {
    const { story, mockAppApi } = makeStory({
      stream: makeStream({ enrollmentKey: 'дракон' }),
    });
    const response = await story.handleMessage(
      { type: 'message', text: 'дракон', telegramId: 1 },
      guest,
      enrollSession(0),
    );

    expect(mockAppApi.execute).toHaveBeenCalledWith(
      'enroll-student',
      { streamId: STREAM_ID, userId: guest.uuid, enrollmentKey: 'дракон' },
      guest.uuid,
    );
    expect(String(response.notify?.text)).toContain('успешно записаны');
    expect(response.delegate?.path).toBe('app:main-menu');
  });

  test('handleMessage: неверное слово — warn-переспрос + awaitInput с попытками+1', async () => {
    const { story } = makeStory();
    const response = await story.handleMessage(
      { type: 'message', text: 'не то', telegramId: 1 },
      guest,
      enrollSession(0),
    );

    expect(response.notify?.kind).toBe('warn');
    expect(String(response.notify?.text)).toContain('Осталось попыток: 2');
    expect(response.awaitInput?.context).toEqual({
      streamId: STREAM_ID,
      enrollmentKey: 'дракон',
      attempts: 1,
    });
    expect(response.screen).toBeUndefined();
  });

  test('handleMessage: попытки исчерпаны — release + экран возврата к потоку', async () => {
    const { story } = makeStory();
    const response = await story.handleMessage(
      { type: 'message', text: 'не то', telegramId: 1 },
      guest,
      enrollSession(2),
    );

    expect(response.release).toBe(true);
    expect(String(response.screen?.text)).toContain('Попытки исчерпаны');
    const codes =
      response.screen?.keyboard?.rows.flat().map((b) => b.code) ?? [];
    expect(codes).toContain(`view-stream:view:${STREAM_ID}`);
  });

  test('handleMessage: ввод без awaitInput-контекста — реплика-отказ + release', async () => {
    const { story } = makeStory();
    const response = await story.handleMessage(
      { type: 'message', text: 'что-то', telegramId: 1 },
      guest,
      session,
    );
    expect(String(response.notify?.text)).toContain('не принимаются');
    expect(response.release).toBe(true);
  });

  // ── Мосты навигации ──

  test('students: кнопка студента ведёт в view-stream:student-detail (не monitor)', async () => {
    const { story } = makeStory({
      students: [makeStudent({ uuid: 'st-9', userId: 'u-9' })],
    });
    const response = await story.handleCallback(
      `students:${STREAM_ID}`,
      guest,
      session,
    );
    const codes =
      response.screen?.keyboard?.rows.flat().map((b) => b.code) ?? [];
    expect(codes).toContain('view-stream:student-detail:st-9');
    expect(codes.some((c) => c.startsWith('monitor:'))).toBe(false);
  });
});
