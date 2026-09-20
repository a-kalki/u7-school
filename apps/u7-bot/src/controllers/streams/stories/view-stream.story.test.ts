import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { BotSession } from '@u7-scl/core/ui';
import { assertDialogResponseMarkdownSafe } from '@u7-scl/core/ui';
import type { ContentSnapshot } from '@u7-scl/course/domain';
import { Role } from '@u7-scl/user/domain';
import { ViewStreamStory } from './view-stream.story';

const STREAM_ID = '11111111-1111-4111-8111-111111111111';

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
      uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001',
      userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      enrolledAt: '2026-01-01T00:00',
      status: 'active',
      streamId: STREAM_ID,
      currentStepId: 'cccc0000-0000-4000-8000-000000000001',
      steps: [],
      createdAt: '2026-01-01T00:00',
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
    expect(text).toContain('учится');
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
      guest,
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
      guest,
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
      students: [
        makeStudent({
          uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0009',
          userId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb9',
        }),
      ],
    });
    const response = await story.handleCallback(
      `students:${STREAM_ID}`,
      guest,
      session,
    );
    const codes =
      response.screen?.keyboard?.rows.flat().map((b) => b.code) ?? [];
    expect(codes).toContain(
      'view-stream:student-detail:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0009',
    );
    expect(codes.some((c) => c.startsWith('monitor:'))).toBe(false);
  });
});

// ── Пагинация программы курса (S03, трек pagination) ──

describe('ViewStreamStory — пагинация программы (S03)', () => {
  const PAGED_STREAM_ID = '22222222-2222-4222-8222-222222222222';

  /** Минимальная форма ответа для поиска кнопок. */
  interface ScreenLike {
    screen?: {
      text?: string;
      keyboard?: { rows: Array<Array<{ text: string; code: string }>> };
    };
  }

  const pagedSession: BotSession = {
    dialog: { path: 'stream/view-stream', seq: 1 },
  };
  const pagedActor = makeActor();

  /** Длинный снапшот: блок «проект с уроками» ~500 символов. */
  function makeLongSnapshot(
    projectCount: number,
    lessonsPerProject: number,
  ): ContentSnapshot {
    return Array.from({ length: projectCount }, (_, p) => ({
      projectId: `proj-${p}`,
      projectTitle: `Проект ${p + 1}: Разработка и отладка серверных приложений на современном стеке технологий`,
      lessons: Array.from({ length: lessonsPerProject }, (_, l) => ({
        lessonId: `lesson-${p}-${l}`,
        lessonTitle: `Урок ${p + 1}.${l + 1}: Практическое занятие по проектированию надёжной архитектуры модуля`,
        stepIds: ['s1', 's2', 's3'],
      })),
    }));
  }

  /** Стори с подсчётом чтений домена (get-stream). */
  function makePagedStory(snapshot: ContentSnapshot) {
    let getStreamCalls = 0;
    const mockAppApi = {
      execute: mock(async (name: string) => {
        if (name === 'get-stream') {
          getStreamCalls++;
          return makeStream({
            uuid: PAGED_STREAM_ID,
            contentSnapshot: snapshot,
          });
        }
        return undefined;
      }),
    };
    const story = new ViewStreamStory();
    story.init({ appApi: mockAppApi } as never);
    return { story, getStreamCalls: () => getStreamCalls };
  }

  /** Разбирает страницу: полные блоки «проект → его уроки». */
  function parsePage(
    text: string,
  ): Array<{ title: string; lessons: string[] }> {
    const blocks: Array<{ title: string; lessons: string[] }> = [];
    for (const line of text.split('\n')) {
      const proj = /^📁 \*Проект: (.+)\*$/.exec(line);
      if (proj) {
        blocks.push({ title: proj[1] ?? '', lessons: [] });
        continue;
      }
      const lesson = /^ {4}📝 Урок: (.+) — \d+ шаг/.exec(line);
      if (lesson && blocks.length > 0) {
        blocks[blocks.length - 1]?.lessons.push(lesson[1] ?? '');
      }
    }
    return blocks;
  }

  /** Кнопка с экрана по подстроке текста (или undefined). */
  function findBtn(response: ScreenLike, textContains: string) {
    return (response.screen?.keyboard?.rows ?? [])
      .flat()
      .find((b) => b.text.includes(textContains));
  }

  test('длинная программа: ≥3 страницы из целых проектов, полный цикл листания', async () => {
    const snapshot = makeLongSnapshot(26, 4);
    const { story } = makePagedStory(snapshot);

    // Страница 0 и дальнейшее листание по кодам кнопок «След ›»
    const pageTexts: string[] = [];
    let response = await story.handleCallback(
      `program:${PAGED_STREAM_ID}`,
      pagedActor,
      pagedSession,
    );
    assertDialogResponseMarkdownSafe(response);
    pageTexts.push(String(response.screen?.text ?? ''));

    for (let i = 0; i < 10; i++) {
      const next = findBtn(response, 'След ›');
      if (!next) break;
      response = await story.handleCallback(
        `program:${PAGED_STREAM_ID}:${next.code.split(':').pop()}`,
        pagedActor,
        pagedSession,
      );
      assertDialogResponseMarkdownSafe(response);
      pageTexts.push(String(response.screen?.text ?? ''));
    }

    // Не меньше трёх страниц
    expect(pageTexts.length).toBeGreaterThanOrEqual(3);

    // Каждая страница несёт шапку и индикатор Стр. k/M
    const total = pageTexts.length;
    for (let i = 0; i < total; i++) {
      expect(pageTexts[i]).toContain('Программа курса');
      expect(pageTexts[i]).toContain(`Стр\\. ${i + 1}/${total}`);
    }

    // Объединение страниц = все 26 проектов по порядку, без потерь и дублей
    const allBlocks = pageTexts.flatMap((t) => parsePage(t));
    expect(allBlocks).toHaveLength(26);
    const expected = snapshot.map((p) => p.projectTitle);
    expect(allBlocks.map((b) => b.title)).toEqual(expected);

    // Каждый проект на странице — ЦЕЛЫЙ: все 4 урока при нём
    for (const block of allBlocks) {
      expect(block.lessons).toHaveLength(4);
    }
  });

  test('кнопки ‹ Пред / След › одним рядом, коды содержат номер страницы', async () => {
    const { story } = makePagedStory(makeLongSnapshot(26, 4));

    // Страница 0: только «След ›»
    const first = await story.handleCallback(
      `program:${PAGED_STREAM_ID}`,
      pagedActor,
      pagedSession,
    );
    const navRow0 = (first.screen?.keyboard?.rows ?? []).find((row) =>
      row.some((b) => b.text.includes('Пред') || b.text.includes('След')),
    );
    expect(navRow0).toBeDefined();
    expect(navRow0).toHaveLength(1); // одна кнопка в ряду
    expect(navRow0?.[0]?.text).toBe('След ›');
    expect(navRow0?.[0]?.code).toBe(`view-stream:program:${PAGED_STREAM_ID}:1`);

    // Средняя страница 1: обе кнопки одним рядом
    const mid = await story.handleCallback(
      `program:${PAGED_STREAM_ID}:1`,
      pagedActor,
      pagedSession,
    );
    const navRowMid = (mid.screen?.keyboard?.rows ?? []).find((row) =>
      row.some((b) => b.text.includes('‹ Пред')),
    );
    expect(navRowMid).toHaveLength(2);
    expect(navRowMid?.[0]?.text).toBe('‹ Пред');
    expect(navRowMid?.[0]?.code).toBe(
      `view-stream:program:${PAGED_STREAM_ID}:0`,
    );
    expect(navRowMid?.[1]?.text).toBe('След ›');
    expect(navRowMid?.[1]?.code).toBe(
      `view-stream:program:${PAGED_STREAM_ID}:2`,
    );

    // Кнопка «Назад к потоку» — под навигацией
    const rows = mid.screen?.keyboard?.rows ?? [];
    const navIdx = rows.findIndex((r) =>
      r.some((b) => b.text.includes('‹ Пред')),
    );
    const backIdx = rows.findIndex((r) =>
      r.some((b) => b.text.includes('Назад к потоку')),
    );
    expect(navIdx).toBeGreaterThanOrEqual(0);
    expect(backIdx).toBeGreaterThan(navIdx);
  });

  test('кеш: тыки по навигации не перечитывают домен', async () => {
    const { story, getStreamCalls } = makePagedStory(makeLongSnapshot(26, 4));
    await story.handleCallback(
      `program:${PAGED_STREAM_ID}`,
      pagedActor,
      pagedSession,
    );
    await story.handleCallback(
      `program:${PAGED_STREAM_ID}:1`,
      pagedActor,
      pagedSession,
    );
    await story.handleCallback(
      `program:${PAGED_STREAM_ID}:0`,
      pagedActor,
      pagedSession,
    );
    expect(getStreamCalls()).toBe(1);
  });

  test('смена диалога (новая эпоха) → пересборка: домен перечитывается', async () => {
    const { story, getStreamCalls } = makePagedStory(makeLongSnapshot(26, 4));
    await story.handleCallback(
      `program:${PAGED_STREAM_ID}`,
      pagedActor,
      pagedSession,
    );
    expect(getStreamCalls()).toBe(1);

    // Новая эпоха диалога: seq вырос — кеш чужой, тихая пересборка
    const nextSession: BotSession = {
      dialog: { path: 'stream/view-stream', seq: 2 },
    };
    await story.handleCallback(
      `program:${PAGED_STREAM_ID}:1`,
      pagedActor,
      nextSession,
    );
    expect(getStreamCalls()).toBe(2);
  });

  test('короткая программа: одна страница — без навигации и индикатора', async () => {
    const { story } = makePagedStory(makeLongSnapshot(2, 2));
    const response = await story.handleCallback(
      `program:${PAGED_STREAM_ID}`,
      pagedActor,
      pagedSession,
    );
    const text = String(response.screen?.text ?? '');
    expect(text).toContain('Проект 1');
    expect(text).not.toContain('Стр');
    const btns =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t.includes('След'))).toBe(false);
    expect(btns.some((t) => t.includes('Пред'))).toBe(false);
  });

  test('clamp: номер страницы за пределами — последняя страница', async () => {
    const { story } = makePagedStory(makeLongSnapshot(26, 4));
    const first = String(
      (
        await story.handleCallback(
          `program:${PAGED_STREAM_ID}`,
          pagedActor,
          pagedSession,
        )
      ).screen?.text ?? '',
    );
    const total = Number(/Стр\\. 1\/(\d+)/.exec(first)?.[1]);
    expect(total).toBeGreaterThanOrEqual(3);

    const response = await story.handleCallback(
      `program:${PAGED_STREAM_ID}:99`,
      pagedActor,
      pagedSession,
    );
    const text = String(response.screen?.text ?? '');
    expect(text).toContain(`Стр\\. ${total}/${total}`);
    const btns =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btns.some((t) => t === '‹ Пред')).toBe(true);
    expect(btns.some((t) => t === 'След ›')).toBe(false);
  });
});

describe('ViewStreamStory — кнопка «💬 Отзывы» в карточке потока (S02)', () => {
  const rvSession: BotSession = {
    dialog: { path: 'stream/view-stream', seq: 1 },
  };
  const rvActor = makeActor();

  /** Мок карточки: единственная переменная — факты отзывов скоупа. */
  function makeStoryWithFacts(
    facts: { hasReviews: boolean; reviewsCount: number } | 'throw' | undefined,
  ) {
    const mockAppApi = {
      execute: mock(async (name: string) => {
        if (name === 'get-stream') return makeStream();
        if (name === 'list-stream-students') return [];
        if (name === 'get-user')
          return { uuid: 'm1', name: 'Ментор Менторович', roles: [] };
        if (name === 'list-scope-facts') {
          if (facts === 'throw') throw new Error('домен недоступен');
          return facts ?? { hasReviews: false, reviewsCount: 0 };
        }
        return undefined;
      }),
    };
    const story = new ViewStreamStory();
    story.init({ appApi: mockAppApi } as never);
    return { story, mockAppApi };
  }

  test('есть отзывы → кнопка «💬 Отзывы» с мостом в S07 peer-review', async () => {
    const { story } = makeStoryWithFacts({
      hasReviews: true,
      reviewsCount: 3,
    });

    const response = await story.handleCallback(
      `view:${STREAM_ID}`,
      rvActor,
      rvSession,
    );
    assertDialogResponseMarkdownSafe(response);

    const btn = response.screen?.keyboard?.rows
      .flat()
      .find((b) => b.text === '💬 Отзывы');
    expect(btn?.code).toBe(`peer-review:scope-reviews:view:${STREAM_ID}`);
  });

  test('нет отзывов → кнопки нет', async () => {
    const { story } = makeStoryWithFacts({
      hasReviews: false,
      reviewsCount: 0,
    });

    const response = await story.handleCallback(
      `view:${STREAM_ID}`,
      rvActor,
      rvSession,
    );

    const btnTexts =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Отзывы'))).toBe(false);
  });

  test('факты недоступны (ошибка UC) → карточка живёт, кнопки нет', async () => {
    const { story } = makeStoryWithFacts('throw');

    const response = await story.handleCallback(
      `view:${STREAM_ID}`,
      rvActor,
      rvSession,
    );

    expect(String(response.screen?.text)).toContain('JS Core');
    const btnTexts =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Отзывы'))).toBe(false);
  });

  test('видимость проверяется UC list-scope-facts с scopeId потока', async () => {
    const { story, mockAppApi } = makeStoryWithFacts({
      hasReviews: true,
      reviewsCount: 1,
    });

    await story.handleCallback(`view:${STREAM_ID}`, rvActor, rvSession);

    const call = (
      mockAppApi.execute.mock.calls as unknown as Array<
        [string, Record<string, unknown>]
      >
    ).find(([name]) => name === 'list-scope-facts');
    expect(call?.[1]).toEqual({ scopeId: STREAM_ID });
  });
});
