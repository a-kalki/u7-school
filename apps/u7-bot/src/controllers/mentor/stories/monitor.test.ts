import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { BotSession, DialogResponse } from '@u7-scl/core/ui';
import { assertDialogResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { MonitorStory } from './monitor';

// ══ Фабрики ══

function mentorActor(): User {
  return {
    uuid: 'mentor-1',
    name: 'Ментор Тест',
    telegramId: 123,
    roles: [Role.MENTOR],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

interface TestStudent {
  uuid: string;
  streamId: string;
  userId: string;
  enrolledAt: string;
  status: 'enrolled' | 'active' | 'abandoned' | 'advanced' | 'not_advanced';
  currentStepId: string | null;
  steps: Array<{
    stepId: string;
    status: 'issued' | 'completed';
    issuedAt: string;
    completedAt?: string;
  }>;
  createdAt: string;
}

/** Студент с недавними completed шагами (on_track для StreamDs) */
function makeStudent(overrides: Partial<TestStudent> = {}): TestStudent {
  const now = new Date();
  const h = (hoursAgo: number) =>
    new Date(now.getTime() - hoursAgo * 36e5).toISOString();
  return {
    uuid: 'student-1',
    streamId: 'stream-1',
    userId: 'user-1',
    enrolledAt: '2026-01-01T00:00:00.000Z',
    status: 'active',
    currentStepId: 'step-3',
    steps: [
      {
        stepId: 'step-1',
        status: 'completed',
        issuedAt: h(2),
        completedAt: h(1.5),
      },
      {
        stepId: 'step-2',
        status: 'completed',
        issuedAt: h(1),
        completedAt: h(0.5),
      },
      { stepId: 'step-3', status: 'issued', issuedAt: h(0.2) },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/** Студент с большим отставанием (давние completed) */
function makeLaggingStudent(): TestStudent {
  const daysAgo = (d: number) => new Date(Date.now() - d * 864e5).toISOString();
  return {
    uuid: 'student-lag',
    streamId: 'stream-1',
    userId: 'user-lag',
    enrolledAt: '2026-01-01T00:00:00.000Z',
    status: 'active',
    currentStepId: 'step-1',
    steps: [
      {
        stepId: 'step-1',
        status: 'completed',
        issuedAt: daysAgo(10),
        completedAt: daysAgo(9),
      },
      { stepId: 'step-2', status: 'issued', issuedAt: daysAgo(9) },
    ],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

interface TestStream {
  uuid: string;
  title: string;
  status: string;
  mentorId: string;
  contentSnapshot: unknown[];
}

function makeStream(overrides: Partial<TestStream> = {}): TestStream {
  return {
    uuid: 'stream-1',
    title: 'Тестовый Поток',
    status: 'active',
    mentorId: 'mentor-1',
    contentSnapshot: [],
    ...overrides,
  };
}

// ══ Настройка story ══

function setupStory(
  opts: {
    students?: TestStudent[];
    stream?: TestStream | null;
    apiErrors?: Set<string>;
    userError?: boolean;
    userNames?: Record<string, string>;
  } = {},
) {
  const {
    students = [makeStudent()],
    stream = makeStream(),
    apiErrors = new Set<string>(),
    userError = false,
    userNames = { 'user-1': 'Иван Петров' },
  } = opts;

  const story = new MonitorStory();
  const appApi = {
    execute: mock(async (name: string, params?: Record<string, unknown>) => {
      if (apiErrors.has(name)) throw new Error(`API error: ${name}`);
      if (name === 'list-stream-students') return students;
      if (name === 'get-stream') return stream;
      if (name === 'get-student-progress')
        return students.find((s) => s.uuid === params?.studentId) ?? null;
      if (name === 'get-user') {
        if (userError) throw new Error('User not found');
        const uuid = params?.uuid as string;
        return { uuid, name: userNames[uuid] ?? uuid.slice(0, 8) };
      }
      if (name === 'mark-abandoned') return undefined;
      if (name === 'complete-student') return undefined;
      return undefined;
    }),
  };
  story.init({ appApi } as never);
  return { story, appApi };
}

const session: BotSession = {
  dialog: { path: 'mentor/monitor', seq: 2 },
};

function flat(response: DialogResponse) {
  const rows = response.screen?.keyboard?.rows ?? [];
  return {
    rows,
    texts: rows.flat().map((b) => b.text),
    codes: rows.flat().map((b) => b.code),
    rowOf(textPart: string) {
      return rows.find((r) => r.some((b) => b.text.includes(textPart)));
    },
  };
}

describe('MonitorStory (S07/S08) — контракт «Диалог и Экран»', () => {
  test('menuButtons: пусто (вход из карточки потока)', () => {
    const { story } = setupStory();
    expect(story.menuButtons(mentorActor())).toEqual([]);
  });

  // ═══ students: список (S07) ═══

  test('students: список с активным студентом, точные коды навигации', async () => {
    const { story } = setupStory();
    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor(),
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text);
    expect(text).toContain('Студенты потока');
    expect(text).toContain('Тестовый Поток');
    expect(text).toContain('Иван Петров');
    expect(text).toContain('В процессе: 1');
    // Прогресс-бар (пустой при 0/0)
    expect(text).toContain('\\[');
    expect(text).toContain('\\]');

    const { texts, codes, rowOf } = flat(response);
    // Строка студента: имя + ⛔/✅ с точными кодами
    const studentRow = rowOf('Иван Петров');
    expect(studentRow?.[0]?.code).toBe('monitor:detail:student-1');
    expect(studentRow?.map((b) => b.code)).toContain(
      'monitor:mark-abandoned:student-1',
    );
    expect(studentRow?.map((b) => b.code)).toContain(
      'monitor:complete:student-1',
    );
    // Навигация (инвентаризация S07)
    expect(texts.some((t) => t.includes('Показать выбывших'))).toBe(true);
    expect(codes).toContain('monitor:students-all:stream-1');
    expect(codes).toContain('view-stream-mentor:view:stream-1');
    expect(texts.some((t) => t.includes('⬅️ Назад к потоку'))).toBe(true);
  });

  test('students: пустой список', async () => {
    const { story } = setupStory({ students: [] });
    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor(),
      session,
    );
    expect(String(response.screen?.text)).toContain('Всего: 0 студентов');
  });

  test('students: поток не найден — экран ошибки', async () => {
    const { story } = setupStory({ stream: null });
    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor(),
      session,
    );
    expect(String(response.screen?.text)).toContain('Поток не найден');
  });

  test('students: дефолт-фильтр FR-8 — только активные, сводка по всем', async () => {
    const { story } = setupStory({
      students: [
        makeStudent({ uuid: 's1', userId: 'u1', status: 'active' }),
        makeStudent({ uuid: 's2', userId: 'u2', status: 'advanced' }),
        makeStudent({ uuid: 's3', userId: 'u3', status: 'abandoned' }),
        makeStudent({ uuid: 's4', userId: 'u4', status: 'not_advanced' }),
      ],
      userNames: { u1: 'Активный', u2: 'Прошёл', u3: 'Выбыл', u4: 'Не прошёл' },
    });
    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor(),
      session,
    );

    const text = String(response.screen?.text);
    expect(text).toContain('Всего: 4 студента, из них 1 активный, 3 выбывших');
    expect(text).toContain('В процессе: 1');
    expect(text).not.toContain('Прошли: 1');
    expect(text).not.toContain('Выбыли: 1');
    expect(text).toContain('Активный');
    expect(text).not.toContain('Прошёл');

    const { texts } = flat(response);
    expect(texts.some((t) => t.includes('Активный'))).toBe(true);
    expect(texts.some((t) => t.includes('Выбыл'))).toBe(false);
    expect(texts.some((t) => t.includes('Показать выбывших'))).toBe(true);
  });

  test('students-all: все студенты, метрики по всем, маркеры статусов', async () => {
    const { story } = setupStory({
      students: [
        makeStudent({ uuid: 's1', userId: 'u1', status: 'active' }),
        makeStudent({ uuid: 's2', userId: 'u2', status: 'advanced' }),
        makeStudent({ uuid: 's3', userId: 'u3', status: 'abandoned' }),
        makeStudent({ uuid: 's4', userId: 'u4', status: 'not_advanced' }),
      ],
      userNames: { u1: 'Активный', u2: 'Прошёл', u3: 'Выбыл', u4: 'Не прошёл' },
    });
    const response = await story.handleCallback(
      'students-all:stream-1',
      mentorActor(),
      session,
    );

    const text = String(response.screen?.text);
    expect(text).toContain('Всего: 4 студента, из них 1 активный, 3 выбывших');
    expect(text).toContain('В процессе: 1');
    expect(text).toContain('Прошли: 1');
    expect(text).toContain('Не прошли: 1');
    expect(text).toContain('Выбыли: 1');

    const { texts, codes } = flat(response);
    expect(texts.some((t) => t.includes('🚫') && t.includes('Выбыл'))).toBe(
      true,
    );
    expect(texts.some((t) => t.includes('✅') && t.includes('Прошёл'))).toBe(
      true,
    );
    expect(texts.some((t) => t.includes('Скрыть выбывших'))).toBe(true);
    expect(codes).toContain('monitor:students:stream-1');
  });

  test('students-all: ⛔✅ у активного и в режиме «все»', async () => {
    const { story } = setupStory({
      students: [
        makeStudent({ uuid: 's1', userId: 'u1', status: 'active' }),
        makeStudent({ uuid: 's3', userId: 'u3', status: 'abandoned' }),
      ],
      userNames: { u1: 'Активный', u3: 'Выбыл' },
    });
    const response = await story.handleCallback(
      'students-all:stream-1',
      mentorActor(),
      session,
    );
    const { rowOf } = flat(response);
    const activeRow = rowOf('Активный');
    expect(activeRow?.map((b) => b.code)).toContain(
      'monitor:mark-abandoned:s1',
    );
    // У выбывшего нет ⛔
    const abandonedRow = rowOf('Выбыл');
    expect(abandonedRow?.map((b) => b.code)).not.toContain(
      'monitor:mark-abandoned:s3',
    );
  });

  test('students: отстающий студент получает маркер ⚠️ или 🛑', async () => {
    const { story } = setupStory({
      students: [makeLaggingStudent()],
      userNames: { 'user-lag': 'Отстающий' },
    });
    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor(),
      session,
    );
    const text = String(response.screen?.text);
    expect(text.includes('⚠️') || text.includes('🛑')).toBe(true);
  });

  test('students: advanced в режиме «все» — кнопка 🔄 без ⛔', async () => {
    const { story } = setupStory({
      students: [makeStudent({ uuid: 's2', userId: 'u2', status: 'advanced' })],
      userNames: { u2: 'Студент Прошёл' },
    });
    const response = await story.handleCallback(
      'students-all:stream-1',
      mentorActor(),
      session,
    );
    const { rowOf } = flat(response);
    const row = rowOf('Студент Прошёл');
    const btnTexts = row?.map((b) => b.text) ?? [];
    expect(btnTexts).toContain('🔄');
    expect(btnTexts).not.toContain('⛔');
  });

  test('students: чужой ментор — без ⛔✅', async () => {
    const { story } = setupStory({
      stream: makeStream({ mentorId: 'other-mentor' }),
    });
    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor(),
      session,
    );
    const { rowOf } = flat(response);
    const btnTexts = rowOf('Иван Петров')?.map((b) => b.text) ?? [];
    expect(btnTexts).not.toContain('⛔');
    expect(btnTexts).not.toContain('✅');
  });

  test('students: ошибка get-user не ломает список (имя — обрезок id)', async () => {
    const { story } = setupStory({ userError: true });
    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor(),
      session,
    );
    expect(String(response.screen?.text)).toContain('user\\-1');
  });

  // ═══ сортировка ═══

  test('сортировка: отстающие раньше нормальных', async () => {
    const { story } = setupStory({
      students: [
        makeStudent({ uuid: 's1', userId: 'u1', status: 'active' }),
        makeLaggingStudent(),
      ],
      userNames: { u1: 'Нормальный', 'user-lag': 'Отстающий' },
    });
    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor(),
      session,
    );
    const text = String(response.screen?.text);
    expect(text.indexOf('Отстающий')).toBeLessThan(text.indexOf('Нормальный'));
  });

  test('сортировка (students-all): завершённые — в конце', async () => {
    const { story } = setupStory({
      students: [
        makeStudent({ uuid: 's1', userId: 'u1', status: 'active' }),
        makeStudent({ uuid: 's2', userId: 'u2', status: 'advanced' }),
      ],
      userNames: { u1: 'Активный', u2: 'Завершённый' },
    });
    const response = await story.handleCallback(
      'students-all:stream-1',
      mentorActor(),
      session,
    );
    const text = String(response.screen?.text);
    expect(text.indexOf('Активный')).toBeLessThan(text.indexOf('Завершённый'));
  });

  // ═══ detail: карточка студента (S08) ═══

  test('detail: три секции карточки, назад в список', async () => {
    const { story } = setupStory();
    const response = await story.handleCallback(
      'detail:student-1',
      mentorActor(),
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text);
    expect(text).toContain('Иван Петров');
    expect(text).toContain('Прогресс студента');
    expect(text).toContain('Прогресс по модулю');
    expect(text).toContain('Усидчивость студента');
    expect(text).toContain('Активность студента');
    expect(text).toContain('Учится');

    // S08: только навигация, кнопок действий нет
    expect(response.screen?.keyboard?.rows).toEqual([
      [{ text: '⬅️ Назад к списку', code: 'monitor:students:stream-1' }],
    ]);
  });

  test('detail: поток не найден — экран ошибки', async () => {
    const { story } = setupStory({ stream: null });
    const response = await story.handleCallback(
      'detail:student-1',
      mentorActor(),
      session,
    );
    expect(String(response.screen?.text)).toContain('Поток не найден');
  });

  // ═══ mark-abandoned: confirm → выполнение (FR-5, delegate) ═══

  test('mark-abandoned: confirm-диалог с точными кнопками', async () => {
    const { story } = setupStory();
    const response = await story.handleCallback(
      'mark-abandoned:student-1',
      mentorActor(),
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text);
    expect(text).toContain('Иван Петров');
    expect(text).toContain('Снять студента');
    expect(text).toContain('бездействие');
    expect(response.screen?.keyboard?.rows).toEqual([
      [
        {
          text: '⚠️ Да, неактивен',
          code: 'monitor:mark-abandoned-confirm:student-1',
        },
        { text: '❌ Отмена', code: 'monitor:detail:student-1' },
      ],
    ]);
  });

  test('mark-abandoned-confirm: UC mark-abandoned cause=inactivity + delegate на список', async () => {
    const { story, appApi } = setupStory();
    const response = await story.handleCallback(
      'mark-abandoned-confirm:student-1',
      mentorActor(),
      session,
    );

    // FR-5: снятие за бездействие с причиной inactivity
    const calls = appApi.execute.mock.calls as unknown[][];
    const call = calls.find((c) => c[0] === 'mark-abandoned');
    expect(call?.[1]).toEqual({
      streamId: 'stream-1',
      studentId: 'student-1',
      cause: 'inactivity',
    });

    expect(String(response.screen?.text)).toContain('снят с учёбы');
    // delegate monitor→students: возврат к списку потока
    expect(response.delegate?.path).toBe('monitor:students:stream-1');
  });

  test('mark-abandoned-confirm: ошибка UC — экран ошибки с выходом в меню', async () => {
    const { story } = setupStory({ apiErrors: new Set(['mark-abandoned']) });
    const response = await story.handleCallback(
      'mark-abandoned-confirm:student-1',
      mentorActor(),
      session,
    );
    const text = String(response.screen?.text);
    expect(text).toContain('⚠️');
    const { codes } = flat(response);
    expect(codes).toContain('app:main-menu');
  });

  // ═══ complete-student: выбор исхода → confirm → выполнение ═══

  test('complete: выбор исхода с точными кодами', async () => {
    const { story } = setupStory();
    const response = await story.handleCallback(
      'complete:student-1',
      mentorActor(),
      session,
    );
    expect(String(response.screen?.text)).toContain('Выберите исход');
    const { texts, codes } = flat(response);
    expect(texts).toEqual([
      '✅ Прошёл',
      '↩️ Не прошёл',
      '🔴 Выбыл',
      '❌ Отмена',
    ]);
    expect(codes).toContain('monitor:complete-confirm:student-1:advanced');
    expect(codes).toContain('monitor:complete-confirm:student-1:not_advanced');
    expect(codes).toContain('monitor:complete-confirm:student-1:abandoned');
    expect(codes).toContain('monitor:detail:student-1');
  });

  test('complete-confirm (advanced): confirm-диалог', async () => {
    const { story } = setupStory();
    const response = await story.handleCallback(
      'complete-confirm:student-1:advanced',
      mentorActor(),
      session,
    );
    const text = String(response.screen?.text);
    expect(text).toContain('Иван Петров');
    expect(text).toContain('прошёл');
    const { texts, codes } = flat(response);
    expect(texts).toContain('✅ Завершить');
    expect(codes).toContain(
      'monitor:complete-confirm-confirm:student-1:advanced',
    );
    expect(codes).toContain('monitor:detail:student-1');
  });

  test('complete-confirm (not_advanced / abandoned): тексты исходов', async () => {
    const { story } = setupStory();
    const notAdvanced = await story.handleCallback(
      'complete-confirm:student-1:not_advanced',
      mentorActor(),
      session,
    );
    expect(String(notAdvanced.screen?.text)).toContain('не прошёл');

    const abandoned = await story.handleCallback(
      'complete-confirm:student-1:abandoned',
      mentorActor(),
      session,
    );
    expect(String(abandoned.screen?.text)).toContain('выбыл');
  });

  test('complete-confirm-confirm: UC complete-student + delegate на список', async () => {
    const { story, appApi } = setupStory();
    const response = await story.handleCallback(
      'complete-confirm-confirm:student-1:advanced',
      mentorActor(),
      session,
    );
    const calls = appApi.execute.mock.calls as unknown[][];
    expect(calls.find((c) => c[0] === 'complete-student')?.[1]).toEqual({
      streamId: 'stream-1',
      studentId: 'student-1',
      outcome: 'advanced',
    });
    expect(String(response.screen?.text)).toContain('завершён');
    expect(response.delegate?.path).toBe('monitor:students:stream-1');
  });

  test('complete-confirm-confirm: not_advanced и abandoned', async () => {
    const { story } = setupStory();
    const notAdvanced = await story.handleCallback(
      'complete-confirm-confirm:student-1:not_advanced',
      mentorActor(),
      session,
    );
    expect(String(notAdvanced.screen?.text)).toContain('завершён');

    const abandoned = await story.handleCallback(
      'complete-confirm-confirm:student-1:abandoned',
      mentorActor(),
      session,
    );
    expect(String(abandoned.screen?.text)).toContain('завершён');
  });

  test('complete-confirm-confirm: неизвестный исход — экран ошибки', async () => {
    const { story } = setupStory();
    const response = await story.handleCallback(
      'complete-confirm-confirm:student-1:invalid_outcome',
      mentorActor(),
      session,
    );
    expect(String(response.screen?.text)).toContain('Неизвестный исход');
  });

  test('complete-confirm-confirm: ошибка UC — экран ошибки', async () => {
    const { story } = setupStory({ apiErrors: new Set(['complete-student']) });
    const response = await story.handleCallback(
      'complete-confirm-confirm:student-1:advanced',
      mentorActor(),
      session,
    );
    expect(String(response.screen?.text)).toContain('⚠️');
  });

  // ═══ history / неизвестные / ввод ═══

  test('history: заглушка «ещё не реализована»', async () => {
    const { story } = setupStory();
    const response = await story.handleCallback(
      'history:student-1',
      mentorActor(),
      session,
    );
    expect(String(response.screen?.text)).toContain('ещё не реализована');
  });

  test('неизвестная команда — экран «Неизвестная команда»', async () => {
    const { story } = setupStory();
    const response = await story.handleCallback(
      'unknown',
      mentorActor(),
      session,
    );
    expect(String(response.screen?.text)).toContain('Неизвестная');
  });

  test('пустой action — экран «Неизвестная команда»', async () => {
    const { story } = setupStory();
    const response = await story.handleCallback('', mentorActor(), session);
    expect(String(response.screen?.text)).toContain('Неизвестная');
  });

  test('handleMessage: дефолт ядра — реплика-отказ + release', async () => {
    const { story } = setupStory();
    const response = await story.handleMessage(
      { type: 'message', text: 'что-то', telegramId: 123 },
      mentorActor(),
      session,
    );
    expect(String(response.notify?.text)).toContain('не принимаются');
    expect(response.release).toBe(true);
  });
});
