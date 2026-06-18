import { describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { Role } from '@u7-scl/user/domain';
import { CommunityStory } from './community.story';

describe('CommunityStory', () => {
  const actor: User = {
    uuid: 'user-1',
    name: 'Гость',
    telegramId: 123,
    roles: [Role.GUEST],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  test('handleStart возвращает кнопку «Сообщество школы» с URL', async () => {
    const story = new CommunityStory('https://t.me/u7_school_group');
    const item = await story.handleStart(actor);
    expect(item).not.toBeNull();
    expect(item!.text).toBe('💬 Сообщество школы');
    expect(item!.url).toBe('https://t.me/u7_school_group');
    expect(item!.priority).toBe(100);
  });

  test('handleStart возвращает кнопку для всех ролей', async () => {
    const story = new CommunityStory('https://t.me/u7_school_group');
    const roles = [Role.GUEST, Role.SUBSCRIBER, Role.CANDIDATE, Role.STUDENT, Role.MENTOR, Role.ADMIN];
    for (const role of roles) {
      const user: User = {
        uuid: `user-${role}`,
        name: role,
        telegramId: 100,
        roles: [role],
        createdAt: '2026-01-01T00:00:00.000Z',
      };
      const item = await story.handleStart(user);
      expect(item).not.toBeNull();
      expect(item!.text).toBe('💬 Сообщество школы');
    }
  });

  test('handleCallback возвращает заглушку', async () => {
    const story = new CommunityStory('https://t.me/u7_school_group');
    const response = await story.handleCallback('any', actor, { activeHandler: null });
    expect(response.sendMessage?.text).toContain('Неизвестная');
  });

  test('handleMessage возвращает заглушку', async () => {
    const story = new CommunityStory('https://t.me/u7_school_group');
    const response = await story.handleMessage(
      { type: 'message', text: 'что-то', telegramId: 123 },
      actor,
      { activeHandler: null },
    );
    expect(response.sendMessage?.text).toContain('Неизвестное');
  });
});
