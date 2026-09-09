import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { BotSession } from '@u7-scl/core/ui';
import { assertDialogResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { StepViewStory } from './step-view';

describe('StepViewStory', () => {
  const session: BotSession = {
    dialog: { path: 'learning/step-view', seq: 1 },
  };

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

  /** Создаёт StepViewStory с замоканным appApi. */
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

    const story = new StepViewStory();
    story.init({ appApi: { execute: appApiSpy } } as never);
    return { story, appApiSpy };
  }

  test('my-study:continue — экран текущего шага с телом', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      'my-study:continue',
      studentActor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text);
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
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Выполнено'))).toBe(true);
  });

  test('my-study:continue — «↩️ Главное меню» последней строкой', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      'my-study:continue',
      studentActor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    const rows = response.screen?.keyboard?.rows ?? [];
    const lastRow = rows[rows.length - 1]!;
    expect(lastRow[0]!.text).toBe('↩️ Главное меню');
    expect(lastRow[0]!.code).toBe('app:main-menu');
  });

  test('complete level=step — экран следующего шага', async () => {
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
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text);
    expect(text).toContain('Шаг 2 из 2:');
    expect(text).toContain('Напишите код');

    const btnTexts =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Выполнено'))).toBe(true);
  });

  test('complete — already_completed — показывает актуальный текущий шаг (идемпотентность)', async () => {
    const { story } = makeStory({
      'complete-step': {
        level: 'already_completed',
        currentStepId: STEP1_ID,
      },
    });

    const response = await story.handleCallback(
      `complete:${STREAM_ID}:${STEP1_ID}`,
      studentActor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    // Повторное нажатие «Выполнено» не должно показывать «поток завершён»
    expect(String(response.screen?.text)).not.toContain(
      'Поток полностью завершён',
    );
    expect(String(response.screen?.text)).toContain('Шаг 1 из 2:');

    const btnTexts =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
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

    expect(String(response.screen?.text)).toContain('не соответствует');
  });

  test('complete — код кнопки содержит streamId и stepId (без studentId)', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      'my-study:continue',
      studentActor,
      session,
    );

    const btnCodes =
      response.screen?.keyboard?.rows.flat().map((b) => b.code) ?? [];
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
    assertDialogResponseMarkdownSafe(response);

    expect(String(response.screen?.text)).toContain('завершён');
    const btnTexts =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Начать следующий урок'))).toBe(
      true,
    );

    expect(String(response.screen?.text)).toContain('📊');
    expect(String(response.screen?.text)).toContain('Прогресс по модулю');
    expect(String(response.screen?.text)).toContain('Прогресс по проекту');
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
    assertDialogResponseMarkdownSafe(response);

    expect(String(response.screen?.text)).toContain('завершён');
    const btnTexts =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Начать следующий проект'))).toBe(
      true,
    );
  });

  test('при завершении потока — сообщение о полном завершении', async () => {
    const { story } = makeStory({
      'complete-step': { level: 'stream' },
    });

    const response = await story.handleCallback(
      `complete:${STREAM_ID}:${STEP1_ID}`,
      studentActor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    expect(String(response.screen?.text)).toContain('Поток полностью завершён');
  });

  test('complete (level=lesson) — «↩️ Главное меню» в конце', async () => {
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

    const rows = response.screen?.keyboard?.rows ?? [];
    const lastRow = rows[rows.length - 1]!;
    expect(lastRow[0]!.text).toBe('↩️ Главное меню');
    expect(lastRow[0]!.code).toBe('app:main-menu');
  });

  test('complete (level=stream) — «↩️ Главное меню» в конце', async () => {
    const { story } = makeStory({
      'complete-step': { level: 'stream' },
    });

    const response = await story.handleCallback(
      `complete:${STREAM_ID}:999`,
      studentActor,
      session,
    );

    const rows = response.screen?.keyboard?.rows ?? [];
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
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text);
    expect(text).toContain('Контент 2');
    expect(text).toContain('Шаги урока');

    // Нет кнопки «✅ Выполнено» для completed шага
    const btnTexts =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Выполнено'))).toBe(false);
  });

  test('my-study:view — ◀️/▶️ навигация по завершённым шагам', async () => {
    const { story } = makeStory();

    // STEP1, STEP2 completed → просмотр STEP1: есть «Вперёд», нет «Назад»
    const resp1 = await story.handleCallback(
      `my-study:view:${STREAM_ID}:${STEP1_ID}`,
      studentActor,
      session,
    );
    const btns1 = resp1.screen?.keyboard?.rows.flat() ?? [];
    expect(btns1.some((b) => b.text.includes('Вперёд'))).toBe(true);
    expect(btns1.some((b) => b.text.includes('Назад к уроку'))).toBe(true);

    // Просмотр STEP2 (последний): есть «Назад», нет «Вперёд»
    const resp2 = await story.handleCallback(
      `my-study:view:${STREAM_ID}:${STEP2_ID}`,
      studentActor,
      session,
    );
    const btns2 = resp2.screen?.keyboard?.rows.flat() ?? [];
    expect(btns2.some((b) => b.text.includes('◀️ Назад'))).toBe(true);
    expect(btns2.some((b) => b.text.includes('Вперёд'))).toBe(false);
  });

  test('my-study:view — другой streamId → ошибка', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      `my-study:view:other-stream:${STEP2_ID}`,
      studentActor,
      session,
    );

    expect(String(response.screen?.text)).toContain('не соответствует');
  });

  test('my-study:view — несуществующий stepId → шаг не найден', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      `my-study:view:${STREAM_ID}:aaaa-aaaa`,
      studentActor,
      session,
    );

    expect(String(response.screen?.text)).toContain('не найден');
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

    expect(String(response.screen?.text)).toContain('завершили');
  });

  test('студент не записан — экран «не записаны»', async () => {
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

    expect(String(response.screen?.text)).toContain('не записаны');
  });

  test('неизвестная команда — экран unknownCommand', async () => {
    const { story } = makeStory();

    const response = await story.handleCallback(
      'unknown',
      studentActor,
      session,
    );
    expect(String(response.screen?.text)).toContain('Неизвестная');
  });
});
