import { describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { Role } from '@u7-scl/user/domain';
import { MonitorStory } from './monitor';

// ══ Типы для моков ══

interface TestStudent {
  uuid: string;
  streamId: string;
  userId: string;
  enrolledAt: string;
  status: 'enrolled' | 'active' | 'abandoned' | 'advanced' | 'not_advanced';
  abandonDetails?: { who: 'mentor'; cause: 'inactivity' };
  completionDetails?: {
    nextPreference: 'wants_next' | 'wants_repeat' | 'undecided';
  };
  currentStepId: string;
  steps: Array<{
    stepId: string;
    status: 'issued' | 'completed';
    issuedAt: string;
    completedAt?: string;
  }>;
  createdAt: string;
  updatedAt?: string;
}

interface TestStream {
  uuid: string;
  title: string;
  status: string;
  mentorId: string;
  contentSnapshot: unknown[];
  startDate?: string;
}

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
    stream?: TestStream;
    apiErrors?: Set<string>;
    userError?: boolean;
    userNames?: Record<string, string>;
  } = {},
): MonitorStory {
  const {
    students = [makeStudent()],
    stream = makeStream(),
    apiErrors = new Set(),
    userError = false,
    userNames = { 'user-1': 'Иван Петров' },
  } = opts;

  const story = new MonitorStory();
  Object.assign(story, {
    appApi: {
      execute: async (name: string, params?: Record<string, unknown>) => {
        if (apiErrors.has(name)) {
          throw new Error(`API error: ${name}`);
        }

        if (name === 'list-stream-students') return students;
        if (name === 'get-stream')
          return stream === null ? null : (stream ?? makeStream());
        if (name === 'get-student-progress') {
          return students.find((s) => s.uuid === params?.studentId) ?? null;
        }
        if (name === 'get-user') {
          if (userError) throw new Error('User not found');
          const uuid = params?.uuid as string;
          const name = userNames[uuid] ?? uuid.slice(0, 8);
          return { uuid, name, telegramId: 0, roles: [], createdAt: '' };
        }
        if (name === 'mark-abandoned') return undefined;
        if (name === 'complete-student') return undefined;
        return undefined;
      },
    },
    uiApp: {
      getAction: () => () => ({ text: '↩️', code: 'app:main-menu' }),
    },
  } as unknown);

  return story;
}

describe('MonitorStory', () => {
  // ═══ handleStart ═══

  test('handleStart возвращает null', async () => {
    const story = setupStory();
    expect(await story.handleStart(mentorActor())).toBeNull();
  });

  // ═══ students — список студентов ═══

  test('handleCallback "students" — показывает список с одним активным студентом', async () => {
    const story = setupStory();

    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor(),
      {
        activeHandler: null,
      },
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Студенты потока');
    expect(text).toContain('Тестовый Поток');
    expect(text).toContain('Иван Петров');
    // Метрики группы
    expect(text).toContain('В процессе: 1');

    // Клавиатура: строка студента + «Назад к потоку»
    const rows = response.sendMessage?.keyboard?.rows ?? [];
    expect(rows.length).toBeGreaterThanOrEqual(2);
    const allTexts = rows.flat().map((b) => b.text);
    expect(allTexts.some((t) => t.includes('Иван Петров'))).toBe(true);
    expect(allTexts.some((t) => t.includes('⬅️ Назад к потоку'))).toBe(true);
  });

  test('handleCallback "students" — пустой список', async () => {
    const story = setupStory({ students: [] });

    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor(),
      {
        activeHandler: null,
      },
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Студенты потока');
    expect(text).toContain('Всего: 0 студентов');
  });

  test('handleCallback "students" — поток не найден (null)', async () => {
    const story = setupStory({ stream: null as unknown as TestStream });

    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor(),
      {
        activeHandler: null,
      },
    );

    expect(response.sendMessage?.text).toContain('Поток не найден');
  });

  // ═══ students — множественные статусы и метрики ═══

  test('handleCallback "students" — несколько студентов с разными статусами', async () => {
    const story = setupStory({
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
      {
        activeHandler: null,
      },
    );

    const text = response.sendMessage?.text ?? '';
    // Метрики группы
    expect(text).toContain('Метрики группы');
    expect(text).toContain('В процессе: 1');
    expect(text).toContain('Прошли: 1');
    expect(text).toContain('Не прошли: 1');
    expect(text).toContain('Выбыли: 1');

    // Статусные маркеры
    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const allTexts = rows.flat().map((b) => b.text);
    expect(allTexts.some((t) => t.includes('🚫') && t.includes('Выбыл'))).toBe(
      true,
    );
    expect(allTexts.some((t) => t.includes('✅') && t.includes('Прошёл'))).toBe(
      true,
    );
    expect(
      allTexts.some((t) => t.includes('↩️') && t.includes('Не прошёл')),
    ).toBe(true);
  });

  // ═══ students — отставание ═══

  test('handleCallback "students" — отстающий студент получает маркер ⚠️ или 🛑', async () => {
    const story = setupStory({
      students: [makeLaggingStudent()],
      userNames: { 'user-lag': 'Отстающий' },
    });

    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor(),
      {
        activeHandler: null,
      },
    );

    const text = response.sendMessage?.text ?? '';
    // Должен быть маркер отставания (⚠️ lagging или 🛑 critical — StreamDs решает)
    const hasLagMarker = text.includes('⚠️') || text.includes('🛑');
    expect(hasLagMarker).toBe(true);
  });

  // ═══ students — менторские кнопки ═══

  test('handleCallback "students" — менторские кнопки ⛔✅ для активного студента', async () => {
    const story = setupStory();

    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor(),
      {
        activeHandler: null,
      },
    );

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const studentRow = rows.find((r) =>
      r.some((b) => b.text.includes('Иван Петров')),
    );
    expect(studentRow).toBeDefined();
    const btnTexts = studentRow!.map((b) => b.text);
    expect(btnTexts.some((t) => t === '⛔')).toBe(true);
    expect(btnTexts.some((t) => t === '✅')).toBe(true);
  });

  test('handleCallback "students" — кнопка 🔄 для advanced', async () => {
    const story = setupStory({
      students: [makeStudent({ uuid: 's2', userId: 'u2', status: 'advanced' })],
      userNames: { u2: 'Студент Прошёл' },
    });

    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor(),
      {
        activeHandler: null,
      },
    );

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const studentRow = rows.find((r) =>
      r.some((b) => b.text.includes('Студент Прошёл')),
    );
    expect(studentRow).toBeDefined();
    const btnTexts = studentRow!.map((b) => b.text);
    expect(btnTexts.some((t) => t === '🔄')).toBe(true);
    expect(btnTexts.some((t) => t === '⛔')).toBe(false);
  });

  test('handleCallback "students" — чужой ментор не видит ⛔✅', async () => {
    const story = setupStory({
      stream: makeStream({ mentorId: 'other-mentor' }),
    });

    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor(),
      {
        activeHandler: null,
      },
    );

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const studentRow = rows.find((r) =>
      r.some((b) => b.text.includes('Иван Петров')),
    );
    expect(studentRow).toBeDefined();
    const btnTexts = studentRow!.map((b) => b.text);
    expect(btnTexts.some((t) => t === '⛔')).toBe(false);
    expect(btnTexts.some((t) => t === '✅')).toBe(false);
  });

  test('handleCallback "students" — ошибка getUser не ломает список', async () => {
    const story = setupStory({ userError: true });

    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor(),
      {
        activeHandler: null,
      },
    );

    // Имя экранируется: user-1 → user\\-1
    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('user\\-1');
  });

  // ═══ detail — карточка студента (S08) ═══

  test('handleCallback "detail" — показывает карточку активного студента', async () => {
    const story = setupStory();

    const response = await story.handleCallback(
      'detail:student-1',
      mentorActor(),
      {
        activeHandler: null,
      },
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Иван Петров');
    expect(text).toContain('Прогресс студента');
    expect(text).toContain('Прогресс по модулю');
    expect(text).toContain('Усидчивость студента');
    expect(text).toContain('Активность студента');
  });

  test('handleCallback "detail" — поток не найден для студента', async () => {
    const story = setupStory({ stream: null as unknown as TestStream });

    const response = await story.handleCallback(
      'detail:student-1',
      mentorActor(),
      {
        activeHandler: null,
      },
    );

    // Если поток не найден — возвращается ошибка
    expect(response.sendMessage?.text).toContain('Поток не найден');
  });

  test('handleCallback "detail" — кнопка «Назад к списку»', async () => {
    const story = setupStory();

    const response = await story.handleCallback(
      'detail:student-1',
      mentorActor(),
      {
        activeHandler: null,
      },
    );

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const allTexts = rows.flat().map((b) => b.text);
    expect(allTexts.some((t) => t.includes('Назад к списку'))).toBe(true);
  });

  // ═══ mark-abandoned — подтверждение ═══

  test('handleCallback "mark-abandoned" — показывает подтверждение', async () => {
    const story = setupStory();

    const response = await story.handleCallback(
      'mark-abandoned:student-1',
      mentorActor(),
      {
        activeHandler: null,
      },
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Иван Петров');
    expect(text).toContain('неактивного');
    // Кнопка подтверждения
    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const btnTexts = rows.flat().map((b) => b.text);
    expect(btnTexts.some((t) => t.includes('Да, неактивен'))).toBe(true);
  });

  test('handleCallback "mark-abandoned" — ошибка getUser (показывает UUID)', async () => {
    const story = setupStory({ userError: true });

    const response = await story.handleCallback(
      'mark-abandoned:student-1',
      mentorActor(),
      {
        activeHandler: null,
      },
    );

    const text = response.sendMessage?.text ?? '';
    // В MarkdownV2 дефис экранируется
    expect(text).toContain('user');
  });

  // ═══ mark-abandoned-confirm — выполнение ═══

  test('handleCallback "mark-abandoned-confirm" — выполняет отчисление', async () => {
    const story = setupStory();

    const response = await story.handleCallback(
      'mark-abandoned-confirm:student-1',
      mentorActor(),
      { activeHandler: null },
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('отмечен как неактивный');
    // Проверяем делегирование (возврат к списку)
    expect(response.delegate?.path).toContain('monitor:students:');
  });

  test('handleCallback "mark-abandoned-confirm" — ошибка API', async () => {
    const story = setupStory({ apiErrors: new Set(['mark-abandoned']) });

    const response = await story.handleCallback(
      'mark-abandoned-confirm:student-1',
      mentorActor(),
      { activeHandler: null },
    );

    expect(response.sendMessage?.text).toContain('⚠️');
  });

  // ═══ complete-student — выбор исхода ═══

  test('handleCallback "complete" — показывает выбор исхода', async () => {
    const story = setupStory();

    const response = await story.handleCallback(
      'complete:student-1',
      mentorActor(),
      {
        activeHandler: null,
      },
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Выберите исход');

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const allTexts = rows.flat().map((b) => b.text);
    expect(allTexts).toContain('✅ Прошёл');
    expect(allTexts).toContain('↩️ Не прошёл');
    expect(allTexts).toContain('🔴 Выбыл');
    expect(allTexts).toContain('❌ Отмена');
  });

  // ═══ complete-confirm — подтверждение исхода ═══

  test('handleCallback "complete-confirm" — подтверждение «прошёл»', async () => {
    const story = setupStory();

    const response = await story.handleCallback(
      'complete-confirm:student-1:advanced',
      mentorActor(),
      { activeHandler: null },
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Иван Петров');
    expect(text).toContain('прошёл');
    // Кнопка подтверждения
    const rows2 = response.sendMessage?.keyboard?.rows ?? [];
    const btnTexts2 = rows2.flat().map((b) => b.text);
    expect(btnTexts2.some((t) => t.includes('Завершить'))).toBe(true);
  });

  test('handleCallback "complete-confirm" — подтверждение «не прошёл»', async () => {
    const story = setupStory();

    const response = await story.handleCallback(
      'complete-confirm:student-1:not_advanced',
      mentorActor(),
      { activeHandler: null },
    );

    expect(response.sendMessage?.text).toContain('не прошёл');
  });

  test('handleCallback "complete-confirm" — подтверждение «выбыл»', async () => {
    const story = setupStory();

    const response = await story.handleCallback(
      'complete-confirm:student-1:abandoned',
      mentorActor(),
      { activeHandler: null },
    );

    expect(response.sendMessage?.text).toContain('выбыл');
  });

  // ═══ complete-confirm-confirm — выполнение ═══

  test('handleCallback "complete-confirm-confirm" — завершает студента (advanced)', async () => {
    const story = setupStory();

    const response = await story.handleCallback(
      'complete-confirm-confirm:student-1:advanced',
      mentorActor(),
      { activeHandler: null },
    );

    expect(response.sendMessage?.text).toContain('завершён');
    expect(response.delegate?.path).toContain('monitor:students:');
  });

  test('handleCallback "complete-confirm-confirm" — завершает (not_advanced)', async () => {
    const story = setupStory();

    const response = await story.handleCallback(
      'complete-confirm-confirm:student-1:not_advanced',
      mentorActor(),
      { activeHandler: null },
    );

    expect(response.sendMessage?.text).toContain('завершён');
  });

  test('handleCallback "complete-confirm-confirm" — завершает (abandoned)', async () => {
    const story = setupStory();

    const response = await story.handleCallback(
      'complete-confirm-confirm:student-1:abandoned',
      mentorActor(),
      { activeHandler: null },
    );

    expect(response.sendMessage?.text).toContain('завершён');
  });

  test('handleCallback "complete-confirm-confirm" — неизвестный исход', async () => {
    const story = setupStory();

    const response = await story.handleCallback(
      'complete-confirm-confirm:student-1:invalid_outcome',
      mentorActor(),
      { activeHandler: null },
    );

    expect(response.sendMessage?.text).toContain('Неизвестный исход');
  });

  test('handleCallback "complete-confirm-confirm" — ошибка API', async () => {
    const story = setupStory({ apiErrors: new Set(['complete-student']) });

    const response = await story.handleCallback(
      'complete-confirm-confirm:student-1:advanced',
      mentorActor(),
      { activeHandler: null },
    );

    expect(response.sendMessage?.text).toContain('⚠️');
  });

  // ═══ history — заглушка ═══

  test('handleCallback "history" — заглушка', async () => {
    const story = setupStory();

    const response = await story.handleCallback(
      'history:student-1',
      mentorActor(),
      {
        activeHandler: null,
      },
    );

    expect(response.sendMessage?.text).toContain('ещё не реализована');
  });

  // ═══ неизвестная команда ═══

  test('handleCallback неизвестная команда — ошибка', async () => {
    const story = setupStory();

    const response = await story.handleCallback('unknown', mentorActor(), {
      activeHandler: null,
    });

    expect(response.sendMessage?.text).toContain('Неизвестная команда');
  });

  test('handleCallback пустая команда — ошибка', async () => {
    const story = setupStory();

    const response = await story.handleCallback('', mentorActor(), {
      activeHandler: null,
    });

    expect(response.sendMessage?.text).toContain('Неизвестная команда');
  });

  // ═══ handleMessage ═══

  test('handleMessage возвращает заглушку', async () => {
    const story = setupStory();

    const response = await story.handleMessage(
      // @ts-expect-error: передаем параметр эмулируя неверное использование метода
      { type: 'message', text: 'что-то', telegramId: 123 },
      mentorActor(),
      { activeHandler: null },
    );

    expect(response.sendMessage?.text).toContain('Неизвестное сообщение');
  });

  // ═══ сортировка ═══

  test('сортировка: отстающие раньше нормальных', async () => {
    const story = setupStory({
      students: [
        makeStudent({ uuid: 's1', userId: 'u1', status: 'active' }),
        makeLaggingStudent(),
      ],
      userNames: { u1: 'Нормальный', 'user-lag': 'Отстающий' },
    });

    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor(),
      {
        activeHandler: null,
      },
    );

    const text = response.sendMessage?.text ?? '';
    const lagIdx = text.indexOf('Отстающий');
    const normIdx = text.indexOf('Нормальный');
    expect(lagIdx).toBeLessThan(normIdx);
  });

  test('сортировка: завершённые — в конце', async () => {
    const story = setupStory({
      students: [
        makeStudent({ uuid: 's1', userId: 'u1', status: 'active' }),
        makeStudent({ uuid: 's2', userId: 'u2', status: 'advanced' }),
      ],
      userNames: { u1: 'Активный', u2: 'Завершённый' },
    });

    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor(),
      {
        activeHandler: null,
      },
    );

    const text = response.sendMessage?.text ?? '';
    const activeIdx = text.indexOf('Активный');
    const doneIdx = text.indexOf('Завершённый');
    expect(activeIdx).toBeLessThan(doneIdx);
  });

  test('прогресс-бар отображается в списке', async () => {
    const story = setupStory();

    const response = await story.handleCallback(
      'students:stream-1',
      mentorActor(),
      {
        activeHandler: null,
      },
    );

    const text = response.sendMessage?.text ?? '';
    // Прогресс-бар: [░░░...] (может быть пустым при 0/0)
    expect(text).toContain('\\[');
    expect(text).toContain('\\]');
    expect(text).toContain('0/0');
  });
});
