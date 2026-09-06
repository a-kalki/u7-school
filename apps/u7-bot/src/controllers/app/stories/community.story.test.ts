import { describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { CommunityStory } from '@u7-scl/bot/app/stories/community.story';
import { Role } from '@u7-scl/user/domain';

describe('CommunityStory', () => {
  const actor: User = {
    uuid: 'user-1',
    name: 'Гость',
    telegramId: 123,
    roles: [Role.GUEST],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  test('menuButtons возвращает кнопку «Сообщество школы» с URL и описанием', () => {
    const story = new CommunityStory('https://t.me/u7_school_group');
    const buttons = story.menuButtons(actor);
    expect(buttons).toHaveLength(1);
    expect(buttons[0]!.text).toBe('💬 Сообщество школы');
    expect(buttons[0]!.kind).toBe('url');
    expect((buttons[0] as { url?: string }).url).toBe(
      'https://t.me/u7_school_group',
    );
    expect(buttons[0]!.priority).toBe(90);
    expect(buttons[0]!.description).toBeDefined();
  });

  test('menuButtons возвращает кнопку для всех ролей', () => {
    const story = new CommunityStory('https://t.me/u7_school_group');
    const roles = [
      Role.GUEST,
      Role.SUBSCRIBER,
      Role.STUDENT,
      Role.MENTOR,
      Role.ADMIN,
    ];
    for (const role of roles) {
      const user: User = {
        uuid: `user-${role}`,
        name: role,
        telegramId: 100,
        roles: [role],
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      const buttons = story.menuButtons(user);
      expect(buttons[0]!.text).toBe('💬 Сообщество школы');
    }
  });

  test('handleCallback возвращает заглушку', async () => {
    const story = new CommunityStory('https://t.me/u7_school_group');
    const response = await story.handleCallback('any', actor, {
      dialog: { path: 'app/community', seq: 1 },
    });
    expect(String(response.screen?.text)).toContain('Неизвестная');
  });

  test('handleMessage возвращает заглушку', async () => {
    const story = new CommunityStory('https://t.me/u7_school_group');
    const response = await story.handleMessage(
      { type: 'message', text: 'что-то', telegramId: 123 },
      actor,
      { dialog: { path: 'app/community', seq: 1 } },
    );
    expect(String(response?.screen?.text)).toContain('Неизвестное');
  });
});
