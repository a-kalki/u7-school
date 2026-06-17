import { describe, expect, mock, test } from 'bun:test';
import type { U7BotApp, User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModule } from 'packages/stream/src/api';
import { EnrollStory } from './enroll.story';

describe('EnrollStory', () => {
  const actor: User = {
    uuid: 'user-1',
    name: 'Гость',
    telegramId: 123,
    roles: [Role.GUEST],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const session: SessionData = { activeHandler: null };

  const mockStream = {
    uuid: 's1',
    title: 'Поток',
    description: '',
    status: 'enrollment',
    startDate: '2026-07-01T00:00:00.000Z',
  };

  test('handleCallback("enroll:<id>") выполняет зачисление и показывает startDate', async () => {
    const moduleApi = {
      execute: mock(async (name: string) => {
        if (name === 'get-stream') return mockStream;
        if (name === 'enroll-student') return undefined;
        return undefined;
      }),
    } as unknown as StreamApiModule;
    const appApi = {
      execute: mock(() => undefined),
    } as unknown as U7BotApp;

    const story = new EnrollStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback('enroll:s1', actor, session);
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('записаны');
    expect(response.sendMessage?.text).toContain('Обучение начнётся');
    expect(response.delegate?.path).toBe('learning:my-study');
  });

  test('handleStart возвращает null', async () => {
    const story = new EnrollStory();
    const item = await story.handleStart(actor);
    expect(item).toBeNull();
  });
});
