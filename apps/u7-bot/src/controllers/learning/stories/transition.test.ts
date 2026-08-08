import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { TransitionStory } from './transition';

describe('TransitionStory', () => {
  const actor: User = {
    uuid: 'user-1',
    name: 'Студент',
    telegramId: 123,
    roles: [Role.STUDENT],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const session: SessionData = { activeHandler: null };

  function makeStory() {
    const mockAppApi = {
      execute: mock(() => undefined),
    };
    const mockUiApp = {
      getAction: mock(() => {
        throw new Error('not found');
      }),
      getController: mock(() => undefined),
    };

    const story = new TransitionStory();
    story.init(mockAppApi as never, mockUiApp as never);
    return { story };
  }

  test('неизвестная команда', async () => {
    const { story } = makeStory();
    const response = await story.handleCallback('unknown', actor, session);
    expect(response.sendMessage?.text).toContain('Неизвестная');
  });

  test('handleMessage возвращает заглушку', async () => {
    const { story } = makeStory();
    const response = await story.handleMessage(
      { type: 'message', text: 'test', telegramId: 123 },
      actor,
      session,
    );
    expect(response.sendMessage?.text).toContain('Неизвестное');
  });
});
