import { describe, expect, mock, test } from 'bun:test';
import type { U7BotApp, User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
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
          { lessonId: 'lesson-uuid-1', lessonTitle: 'Введение', stepIds: ['step-1', 'step-2'] },
          { lessonId: 'lesson-uuid-2', lessonTitle: 'Переменные', stepIds: ['step-3', 'step-4'] },
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

    expect(response.sendMessage?.text).toContain('не записаны');
  });

  test('handleCallback("complete:...") выполняет завершение шага', async () => {
    const moduleApi = {
      execute: mock((_name: string) => ({
        level: 'step',
        currentStepId: 'step-2',
      })),
    } as unknown as StreamApiModule;

    const story = new LearningStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      'complete:stu1:s1:step1',
      studentActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('Шаг выполнен');
  });

  test('при переходе на новый урок показывает названия', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
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
      'complete:stu1:s1:step2',
      studentActor,
      session,
    );

    expect(response.sendMessage?.text).toContain('Введение');
    expect(response.sendMessage?.text).toContain('Переменные');
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
});
