import { describe, expect, mock, test } from 'bun:test';
import type { ApiApp } from '@u7-scl/core/api';
import type { SessionData } from '@u7-scl/core/ui';
import type { StreamAppMeta } from '../../../domain/module';
import { EnrollStory } from './enroll.story';

describe('EnrollStory', () => {
  const actor = { uuid: 'user-1', roles: ['GUEST'] };
  const session: SessionData = { activeHandler: null };

  test('handleCallback("enroll:<id>") выполняет зачисление', async () => {
    const mockApi = {
      execute: mock(async (name: string, attrs: unknown) => {
        if (name === 'get-stream')
          return {
            uuid: 's1',
            title: 'Поток',
            description: '',
            status: 'enrollment',
            startDate: '',
          };
        if (name === 'enroll-student') return undefined;
        return undefined;
      }),
    } as unknown as ApiApp<StreamAppMeta>;

    const story = new EnrollStory();
    story.init(mockApi);
    const response = await story.handleCallback('enroll:s1', actor, session);

    expect(response.sendMessage?.text).toContain('записаны');
    expect(response.delegate?.path).toBe('learning:my-study');
  });

  test('handleStart возвращает null', async () => {
    const story = new EnrollStory();
    const item = await story.handleStart(actor);
    expect(item).toBeNull();
  });
});
