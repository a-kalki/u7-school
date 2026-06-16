import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { ActivateStreamStory } from './activate-stream.story';

describe('ActivateStreamStory', () => {
  const actor: User = {
    uuid: 'mentor-1',
    name: 'Ментор',
    telegramId: 123,
    roles: ['MENTOR'],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const session: SessionData = { activeHandler: null };

  test('handleCallback("activate:<id>") запускает поток', async () => {
    const moduleApi = {
      execute: mock((_name: string) => undefined),
    };
    const appApi = {
      execute: mock(() => undefined),
    };

    const story = new ActivateStreamStory();
    story.init(moduleApi as any, appApi as any);
    const response = await story.handleCallback('activate:s1', actor, session);

    expect(response.sendMessage?.text).toContain('запущен');
    expect(response.sendMessage?.text).toContain('Моя учёба');
  });

  test('handleStart возвращает null', async () => {
    const story = new ActivateStreamStory();
    expect(await story.handleStart(actor)).toBeNull();
  });
});
