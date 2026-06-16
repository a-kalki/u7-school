import { describe, expect, mock, test } from 'bun:test';
import type { ApiApp } from '@u7-scl/core/api';
import type { SessionData } from '@u7-scl/core/ui';
import type { U7BotAppMeta, User } from '@u7-scl/app/domain';
import { ProgressStory } from './progress.story';

describe('ProgressStory', () => {
  const session: SessionData = { activeHandler: null };
  const actor: User = {
    uuid: 'user-1',
    name: 'Студент',
    telegramId: 123,
    roles: ['STUDENT'],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const mockStudent = {
    uuid: 'st1',
    streamId: 's1',
    userId: 'user-1',
    status: 'active',
    currentStepId: 'step-3',
    steps: [
      { stepId: 'step-1', status: 'completed' },
      { stepId: 'step-2', status: 'completed' },
      { stepId: 'step-3', status: 'issued' },
    ],
  };

  const mockStream = {
    uuid: 's1',
    title: 'Python',
    status: 'active',
    startDate: '2026-07-01T00:00:00.000Z',
    mentorId: 'm-m-m-m-m-m-m-m-m-m-m-m-m-m-m-m',
    telegramGroupInvite: 'https://t.me/chat123',
    contentSnapshot: [
      {
        projectTitle: 'Основы',
        lessons: [
          { lessonTitle: 'Введение', stepIds: ['step-1', 'step-2'] },
          { lessonTitle: 'Продвинутый', stepIds: ['step-3', 'step-4'] },
        ],
      },
    ],
  };

  test('показывает ментора, дату, чат, проект/урок и прогресс', async () => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-student-by-user') return mockStudent;
        if (name === 'get-stream') return mockStream;
        return undefined;
      }),
    };
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'get-user')
          return {
            uuid: 'm1',
            name: 'Алексей Смирнов',
            roles: ['MENTOR'],
          };
        return undefined;
      }),
    };

    const story = new ProgressStory();
    story.init(moduleApi as any, appApi as any);
    const response = await story.handleCallback('progress:s1', actor, session);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Прогресс');
    expect(text).toContain('Python');
    expect(text).toContain('Алексей Смирнов');
    expect(text).toContain('chat123');
    expect(text).toContain('Основы');
    expect(text).toContain('Продвинутый');
    expect(text).toContain('50');
  });

  test('handleStart возвращает null', async () => {
    const story = new ProgressStory();
    const item = await story.handleStart(actor);
    expect(item).toBeNull();
  });
});
