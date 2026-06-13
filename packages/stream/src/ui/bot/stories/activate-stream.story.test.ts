import { describe, expect, mock, test } from 'bun:test';
import type { ApiApp } from '@u7-scl/core/api';
import type { SessionData } from '@u7-scl/core/ui';
import type { StreamAppMeta } from '../../../domain/module';
import { ActivateStreamStory } from './activate-stream.story';

describe('ActivateStreamStory', () => {
  const actor = { uuid: 'mentor-1', roles: ['MENTOR'] };
  const session: SessionData = { activeHandler: null };

  test('handleCallback("activate:<id>") запускает поток', async () => {
    const mockApi = {
      execute: mock((_name: string) => undefined),
    } as unknown as ApiApp<StreamAppMeta>;

    const story = new ActivateStreamStory();
    story.init(mockApi);
    const response = await story.handleCallback('activate:s1', actor, session);

    expect(response.sendMessage?.text).toContain('запущен');
  });

  test('handleStart возвращает null', async () => {
    const story = new ActivateStreamStory();
    expect(await story.handleStart(actor)).toBeNull();
  });
});
