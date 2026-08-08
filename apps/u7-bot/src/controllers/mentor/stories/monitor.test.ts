import { describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { Role } from '@u7-scl/user/domain';
import { MonitorStory } from './monitor';

function createStory(): MonitorStory {
  const story = new MonitorStory();
  Object.assign(story, {
    appApi: {
      execute: async (name: string) => {
        if (name === 'list-stream-students') return [];
        if (name === 'get-stream')
          return {
            uuid: 's1',
            title: 'Поток',
            status: 'active',
            contentSnapshot: [],
          };
        return undefined;
      },
    },
    uiApp: {
      getAction: () => () => ({ text: '↩️', code: 'app:main-menu' }),
    },
  } as any);
  return story;
}

describe('MonitorStory', () => {
  const actor: User = {
    uuid: 'mentor-1',
    name: 'Ментор',
    telegramId: 123,
    roles: [Role.MENTOR],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  test('handleCallback students показывает список', async () => {
    const story = createStory();
    const response = await story.handleCallback('students:s1', actor, {
      activeHandler: null,
    });
    expect(response.sendMessage?.text).toContain('Студенты потока');
  });

  test('handleStart возвращает null', async () => {
    const story = createStory();
    expect(await story.handleStart(actor)).toBeNull();
  });
});
