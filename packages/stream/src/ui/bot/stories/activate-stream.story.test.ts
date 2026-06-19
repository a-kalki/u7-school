import { describe, expect, mock, test } from 'bun:test';
import type { U7BotApp, User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModule } from 'packages/stream/src/api';
import { ActivateStreamStory } from './activate-stream.story';

describe('ActivateStreamStory', () => {
  const actor: User = {
    uuid: 'mentor-1',
    name: 'Ментор',
    telegramId: 123,
    roles: [Role.MENTOR],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const session: SessionData = { activeHandler: null };

  test('handleCallback("activate:<id>") запускает поток', async () => {
    const moduleApi = {
      execute: mock((_name: string) => undefined),
    } as unknown as StreamApiModule;
    const appApi = {
      execute: mock(() => undefined),
    } as unknown as U7BotApp;

    const story = new ActivateStreamStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback('activate:s1', actor, session);
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('запущен');
    expect(response.sendMessage?.text).toContain('Моя учёба');

    // Кнопка «⬅️ Назад к потоку»
    const rows = response.sendMessage?.keyboard?.rows ?? [];
    expect(rows.length).toBe(1);
    expect(rows[0]![0]!.text).toContain('⬅️ Назад к потоку');
    expect(rows[0]![0]!.code).toContain('view-stream:view:s1');
  });

  test('handleStart возвращает null', async () => {
    const story = new ActivateStreamStory();
    expect(await story.handleStart(actor)).toBeNull();
  });
});
