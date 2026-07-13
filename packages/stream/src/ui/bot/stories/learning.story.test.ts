import { describe, expect, mock, test } from 'bun:test';
import type { U7BotApp, User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModule } from 'packages/stream/src/api';
import { LearningStory } from './learning.story';

describe('LearningStory', () => {
  const session: SessionData = { activeHandler: null };

  const studentActor: User = {
    uuid: 'user-1',
    name: 'Студент',
    telegramId: 123,
    roles: [Role.STUDENT],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const guestActor: User = {
    uuid: 'user-2',
    name: 'Гость',
    telegramId: 456,
    roles: [Role.GUEST],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const STREAM_ID = '11111111-1111-1111-1111-111111111111';
  const STEP1_ID = '22222222-2222-2222-2222-222222222222';
  const STEP2_ID = '33333333-3333-3333-3333-333333333333';
  const STEP3_ID = '44444444-4444-4444-4444-444444444444';
  const STEP4_ID = '55555555-5555-5555-5555-555555555555';
  const STEP5_ID = '66666666-6666-6666-6666-666666666666';
  const STEP6_ID = '77777777-7777-7777-7777-777777777777';
  const STEP7_ID = '88888888-8888-8888-8888-888888888888';
  const STEP8_ID = '99999999-9999-9999-9999-999999999999';

  const mockStudent = {
    uuid: 'student-uuid-student-uuid-student',
    streamId: STREAM_ID,
    userId: 'user-1',
    status: 'active',
    currentStepId: STEP1_ID,
    steps: [
      { stepId: STEP1_ID, status: 'completed' },
      { stepId: STEP2_ID, status: 'completed' },
    ],
  };

  const mockStream = {
    uuid: STREAM_ID,
    title: 'Python',
    description: 'Курс',
    status: 'active',
    startDate: '2026-06-01T00:00:00.000Z',
    contentSnapshot: [
      {
        projectTitle: 'Основы',
        lessons: [
          {
            lessonId: 'lesson-uuid-1',
            lessonTitle: 'Введение',
            stepIds: [STEP1_ID, STEP2_ID],
          },
          {
            lessonId: 'lesson-uuid-2',
            lessonTitle: 'Переменные',
            stepIds: [STEP3_ID, STEP4_ID],
          },
        ],
      },
    ],
  };

  function makeAppApi(customStep?: Record<string, unknown>): U7BotApp {
    return {
      execute: mock((name: string) => {
        if (name === 'get-step') {
          return (
            customStep ?? {
              uuid: STEP1_ID,
              moduleId: 'mod-1',
              kind: 'text',
              description: 'Изучите основы',
              content: 'Контент шага',
              status: 'published',
              createdAt: '2026-01-01T00:00:00.000Z',
            }
          );
        }
        return undefined;
      }),
    } as unknown as U7BotApp;
  }

  const defaultAppApi = makeAppApi();

  test('handleCallback("my-study:continue") показывает текущий шаг с телом', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-by-user') return mockStudent;
        if (name === 'get-stream') return mockStream;
        return undefined;
      }),
    } as unknown as StreamApiModule;

    const story = new LearningStory();
    story.init(moduleApi, defaultAppApi);

    const response = await story.handleCallback(
      'my-study:continue',
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Поток:');
    expect(text).toContain('Python');
    expect(text).toContain('Проект:');
    expect(text).toContain('Основы');
    expect(text).toContain('Урок:');
    expect(text).toContain('Введение');
    expect(text).toContain('p1\\-l1');
    expect(text).toContain('Шаг 1 из 2:');
    expect(text).toContain('Изучите основы');
    expect(text).toContain('Контент шага');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Выполнено'))).toBe(true);
  });

  test('handleCallback("my-study") — студент не записан (хаб → ошибка)', async () => {
    const moduleApi = {
      execute: mock(() => {
        throw new Error('not found');
      }),
    } as unknown as StreamApiModule;

    const story = new LearningStory();
    story.init(moduleApi, defaultAppApi);

    const response = await story.handleCallback(
      'my-study',
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('не записаны');
  });

  // ── Тесты хаба «Моя учёба» (S05) ──

  test('handleCallback("my-study") показывает хаб с 4 кнопками', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-by-user') return mockStudent;
        if (name === 'get-stream') return mockStream;
        return undefined;
      }),
    } as unknown as StreamApiModule;

    const story = new LearningStory();
    story.init(moduleApi, defaultAppApi);

    const response = await story.handleCallback(
      'my-study',
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Моя учёба');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Продолжить'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Уроки'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Мой прогресс'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Покинуть поток'))).toBe(true);
  });

  test('handleCallback("my-study") — хаб для завершившего (нет Продолжить и Уроки)', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-by-user')
          return { ...mockStudent, status: 'advanced' };
        if (name === 'get-stream') return mockStream;
        return undefined;
      }),
    } as unknown as StreamApiModule;

    const story = new LearningStory();
    story.init(moduleApi, defaultAppApi);

    const response = await story.handleCallback(
      'my-study',
      studentActor,
      session,
    );

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Продолжить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Уроки'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Покинуть поток'))).toBe(true);
  });

  test('handleCallback("my-study:leave-confirm") показывает confirm-диалог', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-by-user') return mockStudent;
        return undefined;
      }),
    } as unknown as StreamApiModule;

    const story = new LearningStory();
    story.init(moduleApi, defaultAppApi);

    const response = await story.handleCallback(
      'my-study:leave-confirm',
      studentActor,
      session,
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('уверены');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Да'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Отмена'))).toBe(true);
  });

  test('handleCallback("my-study:leave") вызывает drop-student', async () => {
    const executeSpy = mock((_name: string, ..._args: unknown[]) => {
      if (_name === 'get-student-by-user') return mockStudent;
      if (_name === 'drop-student') return undefined;
      return undefined;
    });

    const moduleApi = {
      execute: executeSpy,
    } as unknown as StreamApiModule;

    const story = new LearningStory();
    story.init(moduleApi, defaultAppApi);

    const response = await story.handleCallback(
      'my-study:leave',
      studentActor,
      session,
    );

    const dropCalls = executeSpy.mock.calls.filter(
      (c) => c[0] === 'drop-student',
    );
    expect(dropCalls.length).toBe(1);
    expect(dropCalls[0]![1]).toEqual({
      streamId: STREAM_ID,
      studentId: mockStudent.uuid,
    });

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('поток');
  });

  test('handleCallback("complete:...") level=step — показывает следующий шаг', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-by-user') return mockStudent;
        if (name === 'complete-step')
          return { level: 'step', currentStepId: STEP2_ID };
        if (name === 'get-stream') return mockStream;
        return undefined;
      }),
    } as unknown as StreamApiModule;

    const appApi = makeAppApi({
      uuid: STEP2_ID,
      moduleId: 'mod-1',
      kind: 'code',
      description: 'Напишите код',
      code: 'console.log(1)',
      status: 'published',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    const story = new LearningStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback(
      'complete:11111111-1111-1111-1111-111111111111:22222222-2222-2222-2222-222222222222',
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Шаг 2 из 2:');
    expect(text).toContain('Напишите код');
    expect(text).toContain('```');
    expect(text).toContain('console');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Выполнено'))).toBe(true);
    expect(response.sendMessage?.text).not.toContain('Шаг выполнен');
  });

  test('при завершении урока — поздравление и кнопка «Начать следующий урок»', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-by-user') return mockStudent;
        if (name === 'complete-step')
          return {
            level: 'lesson',
            completedLessonId: 'lesson-uuid-1',
            currentStepId: STEP3_ID,
          };
        if (name === 'get-stream') return mockStream;
        return undefined;
      }),
    } as unknown as StreamApiModule;

    const story = new LearningStory();
    story.init(moduleApi, defaultAppApi);

    const response = await story.handleCallback(
      'complete:11111111-1111-1111-1111-111111111111:33333333-3333-3333-3333-333333333333',
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('завершён');
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Начать следующий урок'))).toBe(
      true,
    );

    // Прогресс проекта на transition-экране
    expect(response.sendMessage?.text).toContain('📊');
    expect(response.sendMessage?.text).toContain('Осн');
  });

  test('при завершении проекта — поздравление и кнопка «Начать следующий проект»', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-by-user') return mockStudent;
        if (name === 'complete-step')
          return {
            level: 'project',
            completedProjectId: 'project-uuid-1',
            currentStepId: STEP5_ID,
          };
        if (name === 'get-stream') return mockStream;
        return undefined;
      }),
    } as unknown as StreamApiModule;

    const story = new LearningStory();
    story.init(moduleApi, defaultAppApi);

    const response = await story.handleCallback(
      'complete:11111111-1111-1111-1111-111111111111:55555555-5555-5555-5555-555555555555',
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('завершён');
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Начать следующий проект'))).toBe(
      true,
    );
  });

  test('при завершении потока — сообщение о полном завершении', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-by-user') return mockStudent;
        return { level: 'stream' };
      }),
    } as unknown as StreamApiModule;

    const story = new LearningStory();
    story.init(moduleApi, defaultAppApi);

    const response = await story.handleCallback(
      'complete:11111111-1111-1111-1111-111111111111:66666666-6666-6666-6666-666666666666',
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('Поток полностью завершён');
  });

  test('handleStart — STUDENT видит кнопку «Моя учёба»', async () => {
    const story = new LearningStory();
    const item = await story.handleStart(studentActor);
    expect(item?.text).toContain('Моя учёба');
    expect(item?.priority).toBe(20);
  });

  test('handleStart — GUEST не видит кнопку (null)', async () => {
    const story = new LearningStory();
    const item = await story.handleStart(guestActor);
    expect(item).toBeNull();
  });

  test('handleHelpDescription — STUDENT видит описание', async () => {
    const story = new LearningStory();
    const desc = await story.handleHelpDescription(studentActor);
    expect(desc).toContain('Моя учёба');
  });

  test('handleHelpDescription — GUEST не видит описание', async () => {
    const story = new LearningStory();
    const desc = await story.handleHelpDescription(guestActor);
    expect(desc).toBeNull();
  });

  // ── Тесты нового формата cb-data ──

  test('cb-data кнопки «Выполнено» НЕ содержит studentId', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-by-user') return mockStudent;
        if (name === 'get-stream') return mockStream;
        return undefined;
      }),
    } as unknown as StreamApiModule;

    const story = new LearningStory();
    story.init(moduleApi, defaultAppApi);

    const response = await story.handleCallback(
      'my-study:continue',
      studentActor,
      session,
    );

    const btnCodes =
      response.sendMessage?.keyboard?.rows
        .flat()
        .map((b: { code?: string }) => b.code) ?? [];
    const completeCode = btnCodes.find((c) =>
      c?.startsWith('learning:complete:'),
    );
    expect(completeCode).toBeDefined();

    const parts = completeCode!.split(':');
    expect(parts.length).toBe(4);
    expect(parts[2]).toBe('11111111-1111-1111-1111-111111111111');
    expect(parts[3]).toBe(STEP1_ID);
  });

  test('#handleComplete получает студента через get-student-by-user по actor.uuid', async () => {
    const getStudentSpy = mock((name: string) => {
      if (name === 'get-student-by-user') return mockStudent;
      if (name === 'complete-step')
        return { level: 'step', currentStepId: STEP2_ID };
      if (name === 'get-stream') return mockStream;
      return undefined;
    });

    const moduleApi = {
      execute: getStudentSpy,
    } as unknown as StreamApiModule;

    const story = new LearningStory();
    story.init(moduleApi, defaultAppApi);

    await story.handleCallback(
      'complete:11111111-1111-1111-1111-111111111111:22222222-2222-2222-2222-222222222222',
      studentActor,
      session,
    );

    const calls = getStudentSpy.mock.calls.filter(
      (c) => c[0] === 'get-student-by-user',
    );
    expect(calls.length).toBeGreaterThanOrEqual(1);
  });

  test('#handleComplete сверяет student.streamId с streamId из callback', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-by-user')
          return { ...mockStudent, streamId: 'other-stream' };
        return undefined;
      }),
    } as unknown as StreamApiModule;

    const story = new LearningStory();
    story.init(moduleApi, defaultAppApi);

    const response = await story.handleCallback(
      'complete:11111111-1111-1111-1111-111111111111:22222222-2222-2222-2222-222222222222',
      studentActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('не соответствует');
  });

  // ── Кнопка «↩️ Главное меню» ──

  test('my-study:continue содержит «↩️ Главное меню» последней строкой', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-by-user') return mockStudent;
        if (name === 'get-stream') return mockStream;
        return undefined;
      }),
    } as unknown as StreamApiModule;

    const story = new LearningStory();
    story.init(moduleApi, defaultAppApi);

    const response = await story.handleCallback(
      'my-study:continue',
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const lastRow = rows[rows.length - 1]!;
    expect(lastRow[0]!.text).toBe('↩️ Главное меню');
    expect(lastRow[0]!.code).toBe('app:main-menu');
  });

  test('complete (level=lesson) содержит «↩️ Главное меню»', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-by-user') return mockStudent;
        if (name === 'complete-step')
          return {
            level: 'lesson',
            completedLessonId: 'lesson-uuid-1',
            currentStepId: STEP3_ID,
          };
        if (name === 'get-stream') return mockStream;
        return undefined;
      }),
    } as unknown as StreamApiModule;

    const story = new LearningStory();
    story.init(moduleApi, defaultAppApi);

    const response = await story.handleCallback(
      'complete:11111111-1111-1111-1111-111111111111:33333333-3333-3333-3333-333333333333',
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const lastRow = rows[rows.length - 1]!;
    expect(lastRow[0]!.text).toBe('↩️ Главное меню');
    expect(lastRow[0]!.code).toBe('app:main-menu');
  });

  test('complete (level=stream) содержит «↩️ Главное меню»', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-by-user') return mockStudent;
        if (name === 'complete-step') return { level: 'stream' };
        return undefined;
      }),
    } as unknown as StreamApiModule;

    const story = new LearningStory();
    story.init(moduleApi, defaultAppApi);

    const response = await story.handleCallback(
      'complete:11111111-1111-1111-1111-111111111111:66666666-6666-6666-6666-666666666666',
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const lastRow = rows[rows.length - 1]!;
    expect(lastRow[0]!.text).toBe('↩️ Главное меню');
    expect(lastRow[0]!.code).toBe('app:main-menu');
  });

  test('complete (level=step) НЕ содержит «↩️ Главное меню» на предпоследней строке', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-by-user') return mockStudent;
        if (name === 'complete-step')
          return { level: 'step', currentStepId: STEP2_ID };
        if (name === 'get-stream') return mockStream;
        return undefined;
      }),
    } as unknown as StreamApiModule;

    const story = new LearningStory();
    story.init(moduleApi, defaultAppApi);

    const response = await story.handleCallback(
      'complete:11111111-1111-1111-1111-111111111111:22222222-2222-2222-2222-222222222222',
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const lastRow = rows[rows.length - 1]!;
    // В процессе обучения последняя строка — «↩️ Главное меню» (добавляется в showCurrentStep)
    expect(lastRow[0]!.text).toBe('↩️ Главное меню');
    // «✅ Выполнено» кнопка непосредственно перед «Главное меню»
    const secondLastRow = rows[rows.length - 2]!;
    expect(secondLastRow[0]!.text).toBe('✅ Выполнено');
  });

  // ── Тесты дерева навигации «📂 Уроки» (S05b) ──

  const LESSON1_ID = 'lesson-uuid-1';
  const LESSON2_ID = 'lesson-uuid-2';
  const LESSON3_ID = 'lesson-uuid-3';
  const LESSON4_ID = 'lesson-uuid-4';

  const richSnapshot = [
    {
      projectId: 'project-uuid-1',
      projectTitle: 'Основы',
      lessons: [
        {
          lessonId: LESSON1_ID,
          lessonTitle: 'Введение',
          stepIds: [STEP1_ID, STEP2_ID],
        },
        {
          lessonId: LESSON2_ID,
          lessonTitle: 'Переменные',
          stepIds: [STEP3_ID, STEP4_ID],
        },
      ],
    },
    {
      projectId: 'project-uuid-2',
      projectTitle: 'Продвинутый',
      lessons: [
        {
          lessonId: LESSON3_ID,
          lessonTitle: 'Функции',
          stepIds: [STEP5_ID, STEP6_ID],
        },
        {
          lessonId: LESSON4_ID,
          lessonTitle: 'Классы',
          stepIds: [STEP7_ID, STEP8_ID],
        },
      ],
    },
  ];

  const richStudent = {
    uuid: 'student-uuid',
    streamId: STREAM_ID,
    userId: 'user-1',
    status: 'active',
    currentStepId: STEP4_ID,
    steps: [
      {
        stepId: STEP1_ID,
        status: 'completed',
        issuedAt: '2026-01-01T00:00:00.000Z',
        completedAt: '2026-01-02T00:00:00.000Z',
      },
      {
        stepId: STEP2_ID,
        status: 'completed',
        issuedAt: '2026-01-02T00:00:00.000Z',
        completedAt: '2026-01-03T00:00:00.000Z',
      },
      {
        stepId: STEP3_ID,
        status: 'completed',
        issuedAt: '2026-01-03T00:00:00.000Z',
        completedAt: '2026-01-04T00:00:00.000Z',
      },
      {
        stepId: STEP4_ID,
        status: 'issued',
        issuedAt: '2026-01-04T00:00:00.000Z',
      },
    ],
  };

  const richStream = {
    ...mockStream,
    contentSnapshot: richSnapshot,
  };

  function makeRichModuleApi(overrides?: Record<string, unknown>) {
    return {
      execute: mock((name: string) => {
        if (name === 'get-student-by-user') return richStudent;
        if (name === 'get-stream') return richStream;
        if (overrides && name in overrides) return overrides[name];
        return undefined;
      }),
    } as unknown as StreamApiModule;
  }

  function makeRichAppApi() {
    return {
      execute: mock((name: string, params: { uuid: string }) => {
        if (name === 'get-step') {
          const steps: Record<string, Record<string, unknown>> = {
            [STEP1_ID]: {
              uuid: STEP1_ID,
              kind: 'text',
              description: 'Первый шаг',
              content: 'Контент 1',
              status: 'published',
              createdAt: '2026-01-01T00:00:00.000Z',
            },
            [STEP2_ID]: {
              uuid: STEP2_ID,
              kind: 'text',
              description: 'Второй шаг',
              content: 'Контент 2',
              status: 'published',
              createdAt: '2026-01-02T00:00:00.000Z',
            },
            [STEP3_ID]: {
              uuid: STEP3_ID,
              kind: 'code',
              description: 'Третий шаг',
              code: 'let x = 1',
              status: 'published',
              createdAt: '2026-01-03T00:00:00.000Z',
            },
            [STEP4_ID]: {
              uuid: STEP4_ID,
              kind: 'text',
              description: 'Четвёртый шаг',
              content: 'Контент 4',
              status: 'published',
              createdAt: '2026-01-04T00:00:00.000Z',
            },
            [STEP5_ID]: {
              uuid: STEP5_ID,
              kind: 'text',
              description: 'Пятый шаг',
              content: 'Контент 5',
              status: 'published',
              createdAt: '2026-01-05T00:00:00.000Z',
            },
            [STEP6_ID]: {
              uuid: STEP6_ID,
              kind: 'text',
              description: 'Шестой шаг',
              content: 'Контент 6',
              status: 'published',
              createdAt: '2026-01-06T00:00:00.000Z',
            },
            [STEP7_ID]: {
              uuid: STEP7_ID,
              kind: 'text',
              description: 'Седьмой шаг',
              content: 'Контент 7',
              status: 'published',
              createdAt: '2026-01-07T00:00:00.000Z',
            },
            [STEP8_ID]: {
              uuid: STEP8_ID,
              kind: 'text',
              description: 'Восьмой шаг',
              content: 'Контент 8',
              status: 'published',
              createdAt: '2026-01-08T00:00:00.000Z',
            },
          };
          return steps[params.uuid] as unknown;
        }
        return undefined;
      }),
    } as unknown as U7BotApp;
  }

  const richSession: SessionData = {
    activeHandler: null,
    lastBotMessage: {
      text: 'предыдущее',
      messageId: 42,
    },
  };

  // ── Уровень 1: список проектов ──

  test('my-study:lessons — показывает проекты с прогрессом (sendMessage)', async () => {
    const moduleApi = makeRichModuleApi();
    const story = new LearningStory();
    story.init(moduleApi, makeRichAppApi());

    const response = await story.handleCallback(
      'my-study:lessons',
      studentActor,
      session,
    );

    // Первый вход — новое сообщение
    expect(response.sendMessage).toBeDefined();
    expect(response.editMessage).toBeUndefined();

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('📂');
    expect(text).toContain('Уроки');
    expect(text).toContain('проект');

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    // Проект «Основы» с прогрессом (2/2 урока) и «Продвинутый» (0/2)
    const btnTexts = rows.flat().map((b) => b.text);
    expect(btnTexts.some((t) => t.includes('Основы'))).toBe(true);
    // Проект «Продвинутый» не показывается — нет пройденных/текущих уроков
    expect(btnTexts.some((t) => t.includes('Назад к учёбе'))).toBe(true);
  });

  // ── Уровень 2: уроки проекта ──

  test('my-study:project:{idx} — показывает уроки проекта (editMessage)', async () => {
    const moduleApi = makeRichModuleApi();
    const story = new LearningStory();
    story.init(moduleApi, makeRichAppApi());

    const response = await story.handleCallback(
      'my-study:project:1',
      studentActor,
      richSession,
    );

    // Переход внутри дерева — editMessage
    expect(response.editMessage).toBeDefined();
    expect(response.sendMessage).toBeUndefined();
    expect(response.editMessage?.messageId).toBe(42);

    const text = response.editMessage?.text ?? '';
    expect(text).toContain('Основы');
    expect(text).toContain('урок');

    const rows = response.editMessage?.keyboard?.rows ?? [];
    const btnTexts = rows.flat().map((b) => b.text);
    expect(btnTexts.some((t) => t.includes('Введение'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Переменные'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Назад к проектам'))).toBe(true);
  });

  // ── Уровень 3: шаги урока ──

  test('my-study:lesson:{id} — показывает шаги с маркерами (editMessage)', async () => {
    const moduleApi = makeRichModuleApi();
    const story = new LearningStory();
    story.init(moduleApi, makeRichAppApi());

    const response = await story.handleCallback(
      'my-study:lesson:lesson-uuid-1',
      studentActor,
      richSession,
    );

    const text = response.editMessage?.text ?? '';
    // Маркеры — в уроке 1 все шаги completed
    expect(text).toContain('✅');
    // 🔒 не показывается — в этом уроке нет будущих шагов
    // Шаги видны в тексте
    expect(text).toContain('Первый шаг');
    expect(text).toContain('Второй шаг');

    // Кнопки — только доступные шаги (✅ и ▶️, но не 🔒)
    const rows = response.editMessage?.keyboard?.rows ?? [];
    const btnTexts = rows.flat().map((b) => b.text);
    // STEP1 и STEP2 — completed, это урок 1, все completed → обе кнопки есть
    expect(btnTexts.some((t) => t.includes('Первый шаг'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Второй шаг'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Назад к урокам'))).toBe(true);
  });

  test('my-study:lesson:{id} — 🔒-шаги не показываются кнопками', async () => {
    const moduleApi = makeRichModuleApi();
    const story = new LearningStory();
    story.init(moduleApi, makeRichAppApi());

    // Урок «Функции» (lesson-uuid-3) — все шаги будущие (нет в steps)
    const response = await story.handleCallback(
      'my-study:lesson:lesson-uuid-3',
      studentActor,
      richSession,
    );

    const text = response.editMessage?.text ?? '';
    expect(text).toContain('🔒');

    // Кнопки: только «⬅️ Назад к урокам», без кнопок шагов
    const rows = response.editMessage?.keyboard?.rows ?? [];
    const btnTexts = rows.flat().map((b) => b.text);
    const stepButtons = btnTexts.filter((t) => !t.includes('Назад'));
    expect(stepButtons.length).toBe(0);
  });

  test('my-study:lesson:{id} — кнопка ▶️ для текущего шага', async () => {
    const moduleApi = makeRichModuleApi();
    const story = new LearningStory();
    story.init(moduleApi, makeRichAppApi());

    // Урок «Переменные»: STEP3 completed, STEP4 issued (текущий)
    const response = await story.handleCallback(
      'my-study:lesson:lesson-uuid-2',
      studentActor,
      richSession,
    );

    const text = response.editMessage?.text ?? '';
    expect(text).toContain('▶️');

    const rows = response.editMessage?.keyboard?.rows ?? [];
    const btnTexts = rows.flat().map((b) => b.text);
    expect(btnTexts.some((t) => t.includes('Третий шаг'))).toBe(true); // ✅ completed
    expect(btnTexts.some((t) => t.includes('Четвёртый шаг'))).toBe(true); // ▶️ текущий
  });

  // ── Уровень 4: просмотр шага ──

  test('my-study:view:{streamId}:{stepId} — просмотр completed шага (editMessage)', async () => {
    const moduleApi = makeRichModuleApi();
    const story = new LearningStory();
    story.init(moduleApi, makeRichAppApi());

    const response = await story.handleCallback(
      'my-study:view:11111111-1111-1111-1111-111111111111:33333333-3333-3333-3333-333333333333',
      studentActor,
      richSession,
    );

    const text = response.editMessage?.text ?? '';
    // Контент шага
    expect(text).toContain('Контент 2');
    // Список шагов урока
    expect(text).toContain('Шаги урока');
    expect(text).toContain('✅');
    expect(text).toContain('Первый шаг');
    expect(text).toContain('Второй шаг');

    // Нет кнопки «✅ Выполнено»
    const rows = response.editMessage?.keyboard?.rows ?? [];
    const btnTexts = rows.flat().map((b) => b.text);
    expect(btnTexts.some((t) => t.includes('Выполнено'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Назад к уроку'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Главное меню'))).toBe(true);

    // Прогресс-бар
    expect(text).toContain('2/2');
  });

  test('my-study:view:{streamId}:{stepId} — код stepId из другого потока → ошибка', async () => {
    const moduleApi = makeRichModuleApi();
    const story = new LearningStory();
    story.init(moduleApi, makeRichAppApi());

    const response = await story.handleCallback(
      'my-study:view:other-stream-id:22222222-2222-2222-2222-222222222222',
      studentActor,
      richSession,
    );

    expect(response.editMessage?.text).toContain('не соответствует');
  });

  test('my-study:view:{streamId}:{stepId} — несуществующий stepId → ошибка', async () => {
    const moduleApi = makeRichModuleApi();
    const story = new LearningStory();
    story.init(moduleApi, makeRichAppApi());

    const response = await story.handleCallback(
      'my-study:view:11111111-1111-1111-1111-111111111111:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      studentActor,
      richSession,
    );

    expect(response.editMessage?.text).toContain('не найден');
  });

  // ── Возвраты ──

  test('«⬅️ Назад к проектам» → editMessage с уровнем 1', async () => {
    const moduleApi = makeRichModuleApi();
    const story = new LearningStory();
    story.init(moduleApi, makeRichAppApi());

    // Нажимаем «⬅️ Назад к проектам» — это my-study:lessons с сессией
    const response = await story.handleCallback(
      'my-study:lessons',
      studentActor,
      richSession,
    );

    // Если есть lastBotMessage — editMessage
    expect(response.editMessage).toBeDefined();
    expect(response.sendMessage).toBeUndefined();

    const text = response.editMessage?.text ?? '';
    expect(text).toContain('Уроки');
    expect(text).toContain('проект');
  });

  // ── Тесты листания ◀️/▶️ (Фаза 3) ──

  test('◀️ Назад скрыта на первом completed шаге', async () => {
    const moduleApi = makeRichModuleApi();
    const story = new LearningStory();
    story.init(moduleApi, makeRichAppApi());

    // STEP1_ID — первый completed шаг в истории
    const response = await story.handleCallback(
      'my-study:view:11111111-1111-1111-1111-111111111111:22222222-2222-2222-2222-222222222222',
      studentActor,
      richSession,
    );

    const rows = response.editMessage?.keyboard?.rows ?? [];
    const allBtns = rows.flat().map((b) => b.text);
    expect(allBtns.some((t) => t.includes('◀️'))).toBe(false);
    expect(allBtns.some((t) => t.includes('▶️'))).toBe(true);
  });

  test('▶️ Вперёд скрыта на последнем completed шаге', async () => {
    const moduleApi = makeRichModuleApi();
    const story = new LearningStory();
    story.init(moduleApi, makeRichAppApi());

    // STEP3_ID — последний completed (STEP4_ID — issued)
    const response = await story.handleCallback(
      'my-study:view:11111111-1111-1111-1111-111111111111:44444444-4444-4444-4444-444444444444',
      studentActor,
      richSession,
    );

    const rows = response.editMessage?.keyboard?.rows ?? [];
    const allBtns = rows.flat().map((b) => b.text);
    expect(allBtns.some((t) => t.includes('◀️'))).toBe(true);
    expect(allBtns.some((t) => t.includes('▶️'))).toBe(false);
  });

  test('◀️/▶️ листание — editMessage (в одном сообщении)', async () => {
    const moduleApi = makeRichModuleApi();
    const story = new LearningStory();
    story.init(moduleApi, makeRichAppApi());

    // Нажимаем ▶️ Вперёд с STEP1 → должно открыть STEP2
    const response = await story.handleCallback(
      'my-study:view:11111111-1111-1111-1111-111111111111:33333333-3333-3333-3333-333333333333',
      studentActor,
      richSession,
    );

    // editMessage (одно сообщение, не новое)
    expect(response.editMessage).toBeDefined();
    expect(response.sendMessage).toBeUndefined();

    const text = response.editMessage?.text ?? '';
    expect(text).toContain('Контент 2');
    expect(text).toContain('Шаг 2 из 2');
  });

  // ── Тесты прогресс-бара (Фаза 4) ──

  test('my-study:continue — бар прогресса в шаге', async () => {
    const moduleApi = makeRichModuleApi();
    const story = new LearningStory();
    story.init(moduleApi, makeRichAppApi());

    const response = await story.handleCallback(
      'my-study:continue',
      studentActor,
      session,
    );

    const text = response.sendMessage?.text ?? '';
    // Прогресс-бар присутствует в сообщении
    expect(text).toContain('📊');
    const barMatch = /\\\[.*\\\] \d+\/\d+/.test(text);
    expect(barMatch).toBe(true);
  });

  test('#formatProgressBar — прогресс 3/5', () => {
    const story = new (LearningStory as any)();
    story.init(makeRichModuleApi(), makeRichAppApi());

    const bar = story.formatProgressBar(3, 5);
    expect(bar).toContain('\\[██████░░░░\\]');
    expect(bar).toContain('3/5');
  });

  test('#formatProgressBar — 0/10 (пустой)', () => {
    const story = new (LearningStory as any)();
    story.init(makeRichModuleApi(), makeRichAppApi());

    const bar = story.formatProgressBar(0, 10);
    expect(bar).toContain('\\[░░░░░░░░░░\\]');
    expect(bar).toContain('0/10');
  });

  test('#formatProgressBar — 10/10 (полный)', () => {
    const story = new (LearningStory as any)();
    story.init(makeRichModuleApi(), makeRichAppApi());

    const bar = story.formatProgressBar(10, 10);
    expect(bar).toContain('\\[██████████\\]');
    expect(bar).toContain('10/10');
  });

  test('#formatProgressBar — 7/12 (дробный)', () => {
    const story = new (LearningStory as any)();
    story.init(makeRichModuleApi(), makeRichAppApi());

    const bar = story.formatProgressBar(7, 12);
    // 7/12*10 ≈ 5.8 → 6 filled, 4 empty
    expect(bar).toContain('\\[██████░░░░\\]');
    expect(bar).toContain('7/12');
  });
});
