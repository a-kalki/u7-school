import { describe, expect, mock, test } from 'bun:test';
import type { ApiApp } from '@u7-scl/core/api';
import type { SessionData } from '@u7-scl/core/ui';
import type { StreamAppMeta } from '../../../domain/module';
import { LearningStory } from './learning.story';

describe('LearningStory', () => {
  const session: SessionData = { activeHandler: null };
  const actor = { uuid: 'user-1', roles: ['STUDENT'] };
  const guestActor = { uuid: 'user-2', roles: ['GUEST'] };

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
            lessonTitle: 'Введение',
            stepIds: ['step-1', 'step-2'],
          },
        ],
      },
    ],
  };

  test('handleCallback("my-study") показывает текущий шаг', async () => {
    const mockApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-by-user') return mockStudent;
        if (name === 'get-stream') return mockStream;
        return undefined;
      }),
    } as unknown as ApiApp<StreamAppMeta>;

    const story = new LearningStory();
    story.init(mockApi);
    const response = await story.handleCallback('my-study', actor, session);

    expect(response.sendMessage?.text).toContain('Python');
    expect(response.sendMessage?.text).toContain('Моя учёба');
    // Кнопка «Выполнено»
    const btnTexts = response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Выполнено'))).toBe(true);
  });

  test('handleCallback("my-study") — студент не записан', async () => {
    const mockApi = {
      execute: mock((_name: string) => undefined),
    } as unknown as ApiApp<StreamAppMeta>;

    const story = new LearningStory();
    story.init(mockApi);
    const response = await story.handleCallback('my-study', actor, session);

    expect(response.sendMessage?.text).toContain('не записаны');
  });

  test('handleCallback("complete:...") выполняет завершение шага', async () => {
    const mockApi = {
      execute: mock((_name: string) => ({ level: 'step', currentStepId: 'step-2' })),
    } as unknown as ApiApp<StreamAppMeta>;

    const story = new LearningStory();
    story.init(mockApi);
    const response = await story.handleCallback(
      'complete:stu1:s1:step1',
      actor,
      session,
    );

    expect(response.sendMessage?.text).toContain('Шаг выполнен');
  });

  test('handleStart — STUDENT видит кнопку «Моя учёба»', async () => {
    const story = new LearningStory();
    const item = await story.handleStart(actor);
    expect(item?.text).toContain('Моя учёба');
    expect(item?.priority).toBe(20);
  });

  test('handleStart — GUEST не видит кнопку (null)', async () => {
    const story = new LearningStory();
    const item = await story.handleStart(guestActor);
    expect(item).toBeNull();
  });
});
