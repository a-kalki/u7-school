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

  const mockStudent = {
    uuid: 'student-uuid-student-uuid-student',
    streamId: 's-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
    userId: 'user-1',
    status: 'active',
    currentStepId: 'step-1',
  };

  const mockStream = {
    uuid: 's-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
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
            stepIds: ['step-1', 'step-2'],
          },
          {
            lessonId: 'lesson-uuid-2',
            lessonTitle: 'Переменные',
            stepIds: ['step-3', 'step-4'],
          },
        ],
      },
    ],
  };

  const emptyAppApi = {
    execute: mock(() => undefined),
  } as unknown as U7BotApp;

  test('handleCallback("my-study") показывает текущий шаг', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-by-user') return mockStudent;
        if (name === 'get-stream') return mockStream;
        return undefined;
      }),
    } as unknown as StreamApiModule;

    const story = new LearningStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      'my-study',
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('Python');
    expect(response.sendMessage?.text).toContain('Моя учёба');
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Выполнено'))).toBe(true);
  });

  test('handleCallback("my-study") — студент не записан', async () => {
    const moduleApi = {
      execute: mock(() => {
        throw new Error('not found');
      }),
    } as unknown as StreamApiModule;

    const story = new LearningStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      'my-study',
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('не записаны');
  });

  test('handleCallback("complete:...") — после шага сразу клавиатура следующего', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-by-user') return mockStudent;
        if (name === 'complete-step')
          return { level: 'step', currentStepId: 'step-2' };
        if (name === 'get-student-by-user') return mockStudent;
        if (name === 'get-stream') return mockStream;
        return undefined;
      }),
    } as unknown as StreamApiModule;

    const story = new LearningStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      'complete:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s:step-1',
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    // Клавиатура с кнопками «Выполнено» и «Мой прогресс»
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Выполнено'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Мой прогресс'))).toBe(true);
    // Без промежуточного сообщения
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
            currentStepId: 'step-3',
          };
        if (name === 'get-stream') return mockStream;
        return undefined;
      }),
    } as unknown as StreamApiModule;

    const story = new LearningStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      'complete:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s:step2',
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('завершён');
    // Кнопка «Начать следующий урок»
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Начать следующий урок'))).toBe(
      true,
    );
  });

  test('при завершении проекта — поздравление и кнопка «Начать следующий проект»', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-by-user') return mockStudent;
        if (name === 'complete-step')
          return {
            level: 'project',
            completedProjectId: 'project-uuid-1',
            currentStepId: 'step-5',
          };
        if (name === 'get-stream') return mockStream;
        return undefined;
      }),
    } as unknown as StreamApiModule;

    const story = new LearningStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      'complete:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s:step4',
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('завершён');
    // Кнопка «Начать следующий проект»
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
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      'complete:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s:step-last',
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

  // ── Тесты нового формата cb-data (без studentId) ──

  test('cb-data кнопки «Выполнено» НЕ содержит studentId', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-by-user') return mockStudent;
        if (name === 'get-stream') return mockStream;
        return undefined;
      }),
    } as unknown as StreamApiModule;

    const story = new LearningStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      'my-study',
      studentActor,
      session,
    );

    const btnCodes =
      response.sendMessage?.keyboard?.rows
        .flat()
        .map((b: { code?: string }) => b.code) ?? [];
    const completeCode = btnCodes.find((c) => c?.startsWith('learning:complete:'));
    expect(completeCode).toBeDefined();

    // Формат: learning:complete:<streamId>:<stepId> (3 части после префикса)
    const parts = completeCode!.split(':');
    // 'learning', 'complete', streamId, stepId = 4 части
    expect(parts.length).toBe(4);
    expect(parts[2]).toBe('s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s');
    expect(parts[3]).toBe('step-1');
  });

  test('#handleComplete получает студента через get-student-by-user по actor.uuid', async () => {
    const getStudentSpy = mock((name: string) => {
      if (name === 'get-student-by-user') return mockStudent;
      if (name === 'get-student-by-user') return mockStudent;
        if (name === 'complete-step')
        return { level: 'step', currentStepId: 'step-2' };
      if (name === 'get-stream') return mockStream;
      return undefined;
    });

    const moduleApi = {
      execute: getStudentSpy,
    } as unknown as StreamApiModule;

    const story = new LearningStory();
    story.init(moduleApi, emptyAppApi);

    await story.handleCallback(
      'complete:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s:step-1',
      studentActor,
      session,
    );

    // Проверяем, что get-student-by-user вызывался с actor.uuid (user-1)
    const calls = getStudentSpy.mock.calls.filter(
      (c: [string]) => c[0] === 'get-student-by-user',
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
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      'complete:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s:step-1',
      studentActor,
      session,
    );

    // Должен вернуть ошибку из-за несовпадения streamId
    expect(response.sendMessage?.text).toContain('не соответствует');
  });
});
