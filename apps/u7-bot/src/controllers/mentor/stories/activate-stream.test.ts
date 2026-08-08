import { describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { Role } from '@u7-scl/user/domain';
import { ActivateStreamStory } from './activate-stream';

function createStory(): ActivateStreamStory {
  const story = new ActivateStreamStory();
  Object.assign(story, {
    appApi: {
      execute: async () => undefined,
    },
  } as any);
  return story;
}

const actor: User = {
  uuid: 'mentor-1',
  name: 'Ментор',
  telegramId: 123,
  roles: [Role.MENTOR],
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('ActivateStreamStory', () => {
  test('handleCallback activate запускает поток', async () => {
    const story = createStory();
    const response = await story.handleCallback('activate:s1', actor, {
      activeHandler: null,
    });
    expect(response.sendMessage?.text).toContain('Поток запущен');
  });

  test('кнопка «Назад» ведёт в view-stream-mentor (исправление бага)', async () => {
    const story = createStory();
    const response = await story.handleCallback('activate:s1', actor, {
      activeHandler: null,
    });
    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const backCode = rows[0]?.[0]?.code ?? '';
    // Должен вести в view-stream-mentor, а не в view-stream
    expect(backCode).toContain('view-stream-mentor');
    expect(backCode).not.toContain('view-stream:');
  });

  test('handleStart возвращает null', async () => {
    const story = createStory();
    expect(await story.handleStart(actor)).toBeNull();
  });

  test('неизвестная команда — ошибка', async () => {
    const story = createStory();
    const response = await story.handleCallback('unknown', actor, {
      activeHandler: null,
    });
    expect(response.sendMessage?.text).toContain('Неизвестная команда');
  });
});
