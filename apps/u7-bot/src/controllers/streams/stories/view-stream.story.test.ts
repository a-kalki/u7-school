import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { ViewStreamStory } from './view-stream.story';

describe('ViewStreamStory (S02-S04)', () => {
  const session: SessionData = { activeHandler: null };
  const guestActor: User = {
    uuid: 'user-1',
    name: 'Гость',
    telegramId: 123,
    roles: [Role.GUEST],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const studentActor: User = {
    uuid: 'user-2',
    name: 'Студент',
    telegramId: 456,
    roles: [Role.STUDENT],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const mentorActor: User = {
    uuid: 'm-m-m-m-m-m-m-m-m-m-m-m-m-m-m-m',
    name: 'Алексей Смирнов',
    telegramId: 999,
    roles: [Role.MENTOR],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const SAMPLE_ID = 's-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s';

  const sampleStream = {
    uuid: SAMPLE_ID,
    title: 'Python Advanced',
    description: 'Продвинутый курс',
    moduleId: 'mod-1',
    status: 'enrollment',
    startDate: '2026-06-01T00:00:00.000Z',
    mentorId: 'm-m-m-m-m-m-m-m-m-m-m-m-m-m-m-m',
    contentSnapshot: [],
  };

  function makeStory(
    streamOverrides: Record<string, unknown> = {},
    studentCount = 0,
    mentorName = 'Алексей Смирнов',
  ) {
    const stream = { ...sampleStream, ...streamOverrides };

    const mockAppApi = {
      execute: mock((name: string) => {
        if (name === 'get-stream') return stream;
        if (name === 'list-stream-students')
          return Array.from({ length: studentCount }, (_, i) => ({
            uuid: `student-${i}`,
            userId: `user-${i}`,
            status: 'active',
            joinedAt: '2026-01-01T00:00:00.000Z',
            streamId: SAMPLE_ID,
            currentStepId: null,
            steps: [],
          }));
        if (name === 'get-user')
          return { uuid: 'm1', name: mentorName, roles: [Role.MENTOR] };
        if (name === 'get-steps-by-lessons') return {};
        return undefined;
      }),
    };

    const mockUiApp = {
      getAction: mock((_name: string) => {
        throw new Error(`Действие «${_name}» не найдено`);
      }),
    };

    const story = new ViewStreamStory();
    story.init(mockAppApi as never, mockUiApp as never);
    return { story, mockAppApi, mockUiApp };
  }

  // ── S02: Карточка потока ──

  test('view: показывает карточку потока', async () => {
    const { story } = makeStory({}, 0);

    const response = await story.handleCallback(
      `view:${SAMPLE_ID}`,
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Python Advanced');
    expect(response.sendMessage?.text).toContain('Продвинутый курс');
  });

  test('view: показывает имя ментора', async () => {
    const { story } = makeStory({}, 0);

    const response = await story.handleCallback(
      `view:${SAMPLE_ID}`,
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Алексей Смирнов');
  });

  test('view: показывает количество студентов', async () => {
    const { story } = makeStory({}, 5);

    const response = await story.handleCallback(
      `view:${SAMPLE_ID}`,
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('5');
  });

  test('view: строчка «📚 Курс: Fullstack JS»', async () => {
    const { story } = makeStory({}, 0);

    const response = await story.handleCallback(
      `view:${SAMPLE_ID}`,
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('📚 Курс: Fullstack JS');
  });

  test('S02: публичные кнопки — Программа, Студенты, Детали, Назад к списку', async () => {
    const { story } = makeStory({ status: 'enrollment' }, 0);

    const response = await story.handleCallback(
      `view:${SAMPLE_ID}`,
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Программа курса'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Студенты'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Детали'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Назад к списку'))).toBe(true);
  });

  test('handleStudentsList: кнопка студента ведёт в view-stream (не monitor)', async () => {
    const { story, mockAppApi } = makeStory({}, 1);
    // Переопределяем list-stream-students чтобы вернуть одного активного студента
    mockAppApi.execute = mock((name: string) => {
      if (name === 'get-stream') return { ...sampleStream };
      if (name === 'list-stream-students')
        return [
          {
            uuid: 'student-1',
            userId: 'user-id-1',
            status: 'active',
            joinedAt: '2026-01-01T00:00:00.000Z',
            streamId: SAMPLE_ID,
            currentStepId: null,
            steps: [],
          },
        ];
      if (name === 'get-user')
        return {
          uuid: 'user-id-1',
          name: 'Иван Петров',
          roles: [Role.STUDENT],
        };
      if (name === 'get-steps-by-lessons') return {};
      return undefined;
    });

    const response = await story.handleCallback(
      `students:${SAMPLE_ID}`,
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const allCodes =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.code) ?? [];

    // Кнопка студента должна вести в view-stream (публичный просмотр), НЕ в monitor
    const hasViewStreamDetail = allCodes.some((c) =>
      c.startsWith('view-stream:student-detail:'),
    );
    const hasMonitorDetail = allCodes.some((c) =>
      c.startsWith('monitor:detail:'),
    );
    expect(hasViewStreamDetail).toBe(true);
    expect(hasMonitorDetail).toBe(false);
  });

  test('handleStudentsList: НЕ содержит менторских кнопок (⛔✅🔄)', async () => {
    const { story, mockAppApi } = makeStory({}, 1);
    mockAppApi.execute = mock((name: string) => {
      if (name === 'get-stream') return { ...sampleStream };
      if (name === 'list-stream-students')
        return [
          {
            uuid: 'student-1',
            userId: 'user-id-1',
            status: 'active',
            joinedAt: '2026-01-01T00:00:00.000Z',
            streamId: SAMPLE_ID,
            currentStepId: null,
            steps: [],
          },
        ];
      if (name === 'get-user')
        return {
          uuid: 'user-id-1',
          name: 'Иван Петров',
          roles: [Role.STUDENT],
        };
      if (name === 'get-steps-by-lessons') return {};
      return undefined;
    });

    const response = await story.handleCallback(
      `students:${SAMPLE_ID}`,
      mentorActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const allTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    // Даже ментор в публичном режиме НЕ видит кнопок управления студентами
    expect(allTexts.some((t) => t === '⛔')).toBe(false);
    expect(allTexts.some((t) => t === '✅')).toBe(false);
    expect(allTexts.some((t) => t === '🔄')).toBe(false);
  });

  test('handleStudentsList: содержит кнопку «⬅️ Назад к потоку»', async () => {
    const { story, mockAppApi } = makeStory({}, 0);
    mockAppApi.execute = mock((name: string) => {
      if (name === 'get-stream') return { ...sampleStream };
      if (name === 'list-stream-students') return [];
      return undefined;
    });

    const response = await story.handleCallback(
      `students:${SAMPLE_ID}`,
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const lastRow =
      response.sendMessage?.keyboard?.rows[
        (response.sendMessage?.keyboard?.rows.length ?? 1) - 1
      ];
    const backBtn = lastRow?.[0];
    expect(backBtn?.text).toContain('Назад к потоку');
    expect(backBtn?.code).toBe(`view-stream:view:${SAMPLE_ID}`);
  });

  test('MENTOR на своём enrollment — НЕ видит lifecycle-кнопок', async () => {
    const { story } = makeStory({ status: 'enrollment' }, 5);

    const response = await story.handleCallback(
      `view:${SAMPLE_ID}`,
      mentorActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Запустить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Завершить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('В архив'))).toBe(false);

    expect(btnTexts.some((t) => t.includes('Детали'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Программа курса'))).toBe(true);
  });

  // ── S03: Программа курса ──

  test('program: показывает contentSnapshot', async () => {
    const streamWithContent = {
      ...sampleStream,
      contentSnapshot: [
        {
          projectTitle: 'Основы',
          lessons: [
            { lessonTitle: 'Введение', lessonId: 'l1', stepIds: ['s1', 's2'] },
            { lessonTitle: 'Переменные', lessonId: 'l2', stepIds: ['s3'] },
          ],
        },
        {
          projectTitle: 'Продвинутый',
          lessons: [
            { lessonTitle: 'Асинхронность', lessonId: 'l3', stepIds: ['s4'] },
          ],
        },
      ],
    };

    const mockAppApi = {
      execute: mock((name: string) => {
        if (name === 'get-stream') return streamWithContent;
        if (name === 'get-steps-by-lessons') return {};
        return undefined;
      }),
    };

    const mockUiApp = {
      getAction: mock((_name: string) => {
        throw new Error(`Действие «${_name}» не найдено`);
      }),
    };

    const story = new ViewStreamStory();
    story.init(mockAppApi as never, mockUiApp as never);

    const response = await story.handleCallback(
      `program:${SAMPLE_ID}`,
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('Программа курса');
    expect(response.sendMessage?.text).toContain('Основы');
    expect(response.sendMessage?.text).toContain('Введение');
    expect(response.sendMessage?.text).toContain('Переменные');
    expect(response.sendMessage?.text).toContain('Продвинутый');
    expect(response.sendMessage?.text).toContain('Асинхронность');
  });

  test('program: пустой contentSnapshot — заглушка', async () => {
    const streamNoContent = { ...sampleStream, contentSnapshot: [] };

    const mockAppApi = {
      execute: mock((name: string) => {
        if (name === 'get-stream') return streamNoContent;
        return undefined;
      }),
    };
    const mockUiApp = {
      getAction: mock((_name: string) => {
        throw new Error(`Действие «${_name}» не найдено`);
      }),
    };

    const story = new ViewStreamStory();
    story.init(mockAppApi as never, mockUiApp as never);

    const response = await story.handleCallback(
      `program:${SAMPLE_ID}`,
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Программа пока не загружена');
  });

  // ── S04: Детали ──

  test('details: показывает заполненные поля', async () => {
    const { story } = makeStory(
      {
        goal: 'Научиться программировать',
        result: 'Свой проект',
        rules: 'Без списывания',
        targetAudience: 'Новички',
        additional: 'Дополнительно',
      },
      1,
    );

    const response = await story.handleCallback(
      `details:${SAMPLE_ID}`,
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('Детали');
    expect(response.sendMessage?.text).toContain('Научиться программировать');
    expect(response.sendMessage?.text).toContain('Свой проект');
    expect(response.sendMessage?.text).toContain('Без списывания');
    expect(response.sendMessage?.text).toContain('Новички');
    expect(response.sendMessage?.text).toContain('Дополнительно');
  });

  test('details: без полей — заглушка', async () => {
    const { story } = makeStory({}, 1);

    const response = await story.handleCallback(
      `details:${SAMPLE_ID}`,
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Расширенная информация');
  });

  test('details: кнопка «Назад к потоку»', async () => {
    const { story } = makeStory({}, 1);

    const response = await story.handleCallback(
      `details:${SAMPLE_ID}`,
      guestActor,
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Назад к потоку'))).toBe(true);
  });

  // ── Краевые случаи ──

  test('неизвестная команда', async () => {
    const { story } = makeStory({}, 0);

    const response = await story.handleCallback(
      'unknown:cmd',
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Неизвестная');
  });

  test('view без streamId — ошибка', async () => {
    const { story } = makeStory({}, 0);

    const response = await story.handleCallback('view', guestActor, session);
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Неизвестная');
  });

  test('handleMessage без активного контекста — заглушка', async () => {
    const { story } = makeStory({}, 0);
    const response = await story.handleMessage(
      { type: 'message', text: 'тест', telegramId: 123 },
      guestActor,
      { activeHandler: null },
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Неизвестное');
  });

  test('handleStart возвращает null (нет кнопки в главном меню)', async () => {
    const { story } = makeStory({}, 0);
    const item = await story.handleStart(guestActor);
    expect(item).toBeNull();
  });

  // ── student-detail: полная карточка студента ──

  /** Создаёт story с мок-студентом, имеющим шаги для computeStudentCard */
  function makeStudentDetailStory(
    opts: {
      streamOverrides?: Record<string, unknown>;
      studentOverrides?: Record<string, unknown>;
      userError?: boolean;
      streamNotFound?: boolean;
    } = {},
  ) {
    const now = new Date();
    const h = (hoursAgo: number) =>
      new Date(now.getTime() - hoursAgo * 36e5).toISOString();

    const student = {
      uuid: 'student-1',
      streamId: SAMPLE_ID,
      userId: 'user-id-1',
      status: 'active',
      enrolledAt: '2026-01-01T00:00:00.000Z',
      currentStepId: 'step-3',
      steps: [
        {
          stepId: 'step-1',
          status: 'completed' as const,
          issuedAt: h(2),
          completedAt: h(1.5),
        },
        {
          stepId: 'step-2',
          status: 'completed' as const,
          issuedAt: h(1),
          completedAt: h(0.5),
        },
        { stepId: 'step-3', status: 'issued' as const, issuedAt: h(0.2) },
      ],
      createdAt: '2026-01-01T00:00:00.000Z',
      ...opts.studentOverrides,
    };

    const stream = {
      ...sampleStream,
      contentSnapshot: [
        {
          projectTitle: 'Основы',
          lessons: [
            {
              lessonTitle: 'Введение',
              lessonId: 'l1',
              stepIds: ['step-1', 'step-2'],
            },
            {
              lessonTitle: 'Переменные',
              lessonId: 'l2',
              stepIds: ['step-3', 'step-4'],
            },
          ],
        },
      ],
      ...opts.streamOverrides,
    };

    const mockAppApi = {
      execute: mock((name: string, params?: Record<string, unknown>) => {
        if (name === 'get-student-progress') {
          const sid = params?.studentId;
          return sid === 'student-1' ? student : null;
        }
        if (name === 'get-stream') {
          if (opts.streamNotFound) return null;
          return stream;
        }
        if (name === 'get-user') {
          if (opts.userError) throw new Error('User not found');
          return {
            uuid: 'user-id-1',
            name: 'Иван Петров',
            roles: [Role.STUDENT],
          };
        }
        return undefined;
      }),
    };

    const mockUiApp = {
      getAction: mock((_name: string) => {
        throw new Error(`Действие «${_name}» не найдено`);
      }),
    };

    const story = new ViewStreamStory();
    story.init(mockAppApi as never, mockUiApp as never);
    return { story, mockAppApi, mockUiApp };
  }

  test('student-detail: показывает полную карточку студента', async () => {
    const { story } = makeStudentDetailStory();

    const response = await story.handleCallback(
      'student-detail:student-1',
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Иван Петров');
    expect(text).toContain('Прогресс студента');
    expect(text).toContain('Прогресс по модулю');
    expect(text).toContain('Усидчивость студента');
    expect(text).toContain('Активность студента');
  });

  test('student-detail: показывает проект и урок из currentStepId', async () => {
    const { story } = makeStudentDetailStory();

    const response = await story.handleCallback(
      'student-detail:student-1',
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Основы');
    expect(text).toContain('Переменные');
    expect(text).toContain('Прогресс по проекту');
  });

  test('student-detail: показывает категории времени (усидчивость)', async () => {
    const { story } = makeStudentDetailStory();

    const response = await story.handleCallback(
      'student-detail:student-1',
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const text = response.sendMessage?.text ?? '';
    // В каждой категории есть эмодзи: 🏃 Бегун, ⚡ Спринтер, 🐢 Вдумчивый, 📚 Исследователь
    expect(text).toContain('Бегун');
    expect(text).toContain('Спринтер');
    expect(text).toContain('Вдумчивый');
    expect(text).toContain('Исследователь');
  });

  test('student-detail: показывает статус студента', async () => {
    const { story } = makeStudentDetailStory({
      studentOverrides: { status: 'advanced' },
    });

    const response = await story.handleCallback(
      'student-detail:student-1',
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Прошёл');
  });

  test('student-detail: кнопка «Назад к списку» ведёт в students', async () => {
    const { story } = makeStudentDetailStory();

    const response = await story.handleCallback(
      'student-detail:student-1',
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const allTexts = rows.flat().map((b) => b.text);
    expect(allTexts.some((t) => t.includes('Назад к списку'))).toBe(true);

    const allCodes = rows.flat().map((b) => b.code);
    expect(
      allCodes.some((c) => c === `view-stream:students:${SAMPLE_ID}`),
    ).toBe(true);
  });

  test('student-detail: поток не найден — ошибка', async () => {
    const { story } = makeStudentDetailStory({ streamNotFound: true });

    const response = await story.handleCallback(
      'student-detail:student-1',
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('Поток не найден');
  });

  test('student-detail: ошибка getUser — показывает обрезок userId', async () => {
    const { story } = makeStudentDetailStory({ userError: true });

    const response = await story.handleCallback(
      'student-detail:student-1',
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const text = response.sendMessage?.text ?? '';
    // Имя — первые 8 символов userId (user-id-1), но дефис экранирован в MarkdownV2
    expect(text).toContain('user\\-id\\-');
    // НЕ содержит настоящего имени (getUser упал)
    expect(text).not.toContain('Иван Петров');
  });

  test('student-detail: НЕ содержит менторских кнопок (⛔✅🔄)', async () => {
    const { story } = makeStudentDetailStory();

    const response = await story.handleCallback(
      'student-detail:student-1',
      mentorActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const allTexts = rows.flat().map((b) => b.text);
    expect(allTexts.some((t) => t === '⛔')).toBe(false);
    expect(allTexts.some((t) => t === '✅')).toBe(false);
    expect(allTexts.some((t) => t === '🔄')).toBe(false);
  });
});
