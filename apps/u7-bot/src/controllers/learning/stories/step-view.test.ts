import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { StepViewStory } from './step-view';

describe('StepViewStory', () => {
  const session: SessionData = { activeHandler: null };

  const studentActor: User = {
    uuid: 'user-1',
    name: 'Студент',
    telegramId: 123,
    roles: [Role.STUDENT],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const STREAM_ID = '11111111-1111-1111-1111-111111111111';
  const STEP1_ID = '22222222-2222-2222-2222-222222222222';
  const STEP2_ID = '33333333-3333-3333-3333-333333333333';
  const STEP3_ID = '44444444-4444-4444-4444-444444444444';
  const STEP5_ID = '66666666-6666-6666-6666-666666666666';

  const mockStudent = {
    uuid: 'student-uuid',
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
        projectId: 'project-uuid-1',
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
            stepIds: [STEP3_ID, 'step-4'],
          },
        ],
      },
    ],
  };

  /** Создаёт StepViewStory с замоканными appApi и uiApp. */
  function makeStory(
    appApiOverrides?: Record<string, unknown>,
    customStep?: Record<string, unknown>,
  ) {
    const appApiSpy = mock(
      (name: string, _params?: Record<string, unknown>) => {
        if (appApiOverrides && name in appApiOverrides) {
          const val = appApiOverrides[name];
          if (typeof val === 'function') return (val as () => unknown)();
          if (val instanceof Error) throw val;
          return val;
        }
        if (name === 'get-student-by-user') return mockStudent;
        if (name === 'get-stream') return mockStream;
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
        if (name === 'complete-step') {
          return { level: 'step', currentStepId: STEP2_ID };
        }
        if (name === 'get-student-progress') return mockStudent;
        return undefined;
      },
    );

    const mockUiApp = {
      getAction: mock(() => {
        throw new Error('not found');
      }),
      getController: mock(() => undefined),
    };

    const story = new StepViewStory();
    story.init({ appApi: { execute: appApiSpy }, uiApp: mockUiApp } as never);
    return { story, appApiSpy, mockUiApp };
  }

  test('handleCallback("my-study:continue") показывает текущий шаг с телом', async () => {
    const { story } = makeStory();

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

  test('my-study:continue — содержит «↩️ Главное меню» последней строкой', async () => {
    const { story } = makeStory();

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

  test('handleCallback("complete:...") level=step — показывает следующий шаг', async () => {
    const customStep = {
      uuid: STEP2_ID,
      moduleId: 'mod-1',
      kind: 'code',
      description: 'Напишите код',
      code: 'console.log(1)',
      status: 'published',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const { story } = makeStory({}, customStep);

    const response = await story.handleCallback(
      `complete:${STREAM_ID}:${STEP1_ID}`,
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Шаг 2 из 2:');
    expect(text).toContain('Напишите код');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Выполнено'))).toBe(true);
  });

  test('complete — сверяет student.streamId с streamId из callback', async () => {
    const { story } = makeStory({
      'get-student-by-user': { ...mockStudent, streamId: 'other-stream' },
    });

    const response = await story.handleCallback(
      `complete:${STREAM_ID}:${STEP1_ID}`,
      studentActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('не соответствует');
  });

  test('complete — studentId в cb-data НЕ содержит studentId', async () => {
    const { story } = makeStory();

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
      c?.startsWith('step-view:complete:'),
    );
    expect(completeCode).toBeDefined();

    const parts = completeCode!.split(':');
    expect(parts.length).toBe(4);
    expect(parts[2]).toBe(STREAM_ID);
    expect(parts[3]).toBe(STEP1_ID);
  });

  test('при завершении урока — поздравление и кнопка «Начать следующий урок»', async () => {
    const { story } = makeStory({
      'complete-step': {
        level: 'lesson',
        completedLessonId: 'lesson-uuid-1',
        currentStepId: STEP3_ID,
      },
    });

    const response = await story.handleCallback(
      `complete:${STREAM_ID}:${STEP1_ID}`,
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

    expect(response.sendMessage?.text).toContain('📊');
    expect(response.sendMessage?.text).toContain('Прогресс по модулю');
    expect(response.sendMessage?.text).toContain('Прогресс по проекту');
  });

  test('при завершении проекта — поздравление и кнопка «Начать следующий проект»', async () => {
    const { story } = makeStory({
      'complete-step': {
        level: 'project',
        completedProjectId: 'project-uuid-1',
        currentStepId: STEP5_ID,
      },
    });

    const response = await story.handleCallback(
      `complete:${STREAM_ID}:${STEP1_ID}`,
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
    const { story } = makeStory({
      'complete-step': { level: 'stream' },
      'get-student-by-user': mockStudent,
    });

    const response = await story.handleCallback(
      `complete:${STREAM_ID}:${STEP1_ID}`,
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('Поток полностью завершён');
  });

  test('complete (level=lesson) содержит «↩️ Главное меню»', async () => {
    const { story } = makeStory({
      'complete-step': {
        level: 'lesson',
        completedLessonId: 'lesson-uuid-1',
        currentStepId: STEP3_ID,
      },
    });

    const response = await story.handleCallback(
      `complete:${STREAM_ID}:${STEP1_ID}`,
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
    const { story } = makeStory({
      'complete-step': { level: 'stream' },
    });

    const response = await story.handleCallback(
      `complete:${STREAM_ID}:999`,
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const lastRow = rows[rows.length - 1]!;
    expect(lastRow[0]!.text).toBe('↩️ Главное меню');
    expect(lastRow[0]!.code).toBe('app:main-menu');
  });

  // ── my-study:view (просмотр завершённого шага) ──

  test('my-study:view — просмотр completed шага с шагами урока', async () => {
    const customStep2 = {
      uuid: STEP2_ID,
      moduleId: 'mod-1',
      kind: 'text',
      description: 'Второй шаг',
      content: 'Контент 2',
      status: 'published',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    const { story } = makeStory({}, customStep2);

    const response = await story.handleCallback(
      `my-study:view:${STREAM_ID}:${STEP2_ID}`,
      studentActor,
      session,
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Контент 2');
    expect(text).toContain('Шаги урока');

    // Нет кнопки «✅ Выполнено» для completed шага
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Выполнено'))).toBe(false);
  });

  test('my-study:view — другой streamId → ошибка', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      `my-study:view:other-stream:${STEP2_ID}`,
      studentActor,
      session,
    );

    // Без lastBotMessage — sendMessage, не editMessage
    expect(response.sendMessage?.text).toContain('не соответствует');
  });

  test('my-study:view — несуществующий stepId → ошибка', async () => {
    const { story } = makeStory({
      'get-step': (() => {
        throw new Error('not found');
      }) as unknown,
    });

    // Сначала нужно дать getStudentAndStream отработать
    const { story: story2 } = makeStory();

    const response = await story2.handleCallback(
      `my-study:view:${STREAM_ID}:aaaa-aaaa`,
      studentActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('не найден');
  });

  // ── my-study:continue для завершившего ──

  test('my-study:continue для завершившего студента — поздравление', async () => {
    const { story } = makeStory({
      'get-student-by-user': { ...mockStudent, status: 'advanced' },
    });

    const response = await story.handleCallback(
      'my-study:continue',
      studentActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('завершили');
  });

  test('студент не записан — ошибка', async () => {
    const { story } = makeStory({
      'get-student-by-user': (() => {
        throw new Error('not found');
      }) as unknown,
    });

    const response = await story.handleCallback(
      'my-study:continue',
      studentActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('не записаны');
  });

  test('неизвестная команда', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      'unknown',
      studentActor,
      session,
    );
    expect(response.sendMessage?.text).toContain('Неизвестная');
  });

  test('handleMessage возвращает заглушку', async () => {
    const { story } = makeStory();
    const response = await story.handleMessage(
      { type: 'message', text: 'test', telegramId: 123 },
      studentActor,
      session,
    );
    expect(response.sendMessage?.text).toContain('Неизвестное');
  });
});
