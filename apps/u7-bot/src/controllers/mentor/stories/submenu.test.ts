import { describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { Role } from '@u7-scl/user/domain';
import { SubmenuStory } from './submenu';

/** Мок UiApp.getAction для unit-тестов */
function mockUiApp() {
  return {
    getAction: <T>(_name: string) => {
      return (() => ({
        text: '↩️ Главное меню',
        code: 'app:main-menu',
      })) as unknown as T;
    },
  };
}

describe('SubmenuStory', () => {
  const actor: User = {
    uuid: 'user-1',
    name: 'Тест',
    telegramId: 123,
    roles: [Role.MENTOR],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  function createStory(): SubmenuStory {
    const story = new SubmenuStory();
    // Имитируем init()
    (story as any).uiApp = mockUiApp();
    return story;
  }

  test('handleStart возвращает кнопку для MENTOR', async () => {
    const story = createStory();
    const item = await story.handleStart(actor);
    expect(item).not.toBeNull();
    expect(item!.kind).toBe('callback');
    expect(item!.text).toBe('🛠️ Инструменты ментора');
    expect(item!.priority).toBe(30);
    expect(item!.description).toContain('Инструменты ментора');
  });

  test('handleStart возвращает кнопку для ADMIN', async () => {
    const story = createStory();
    const admin: User = {
      ...actor,
      roles: [Role.ADMIN],
    };
    const item = await story.handleStart(admin);
    expect(item).not.toBeNull();
    expect(item!.text).toBe('🛠️ Инструменты ментора');
  });

  test('handleStart возвращает null для GUEST', async () => {
    const story = createStory();
    const guest: User = {
      ...actor,
      roles: [Role.GUEST],
    };
    const item = await story.handleStart(guest);
    expect(item).toBeNull();
  });

  test('handleStart возвращает null для STUDENT', async () => {
    const story = createStory();
    const student: User = {
      ...actor,
      roles: [Role.STUDENT],
    };
    const item = await story.handleStart(student);
    expect(item).toBeNull();
  });

  test('handleCallback "start" возвращает подменю с тремя кнопками', async () => {
    const story = createStory();
    const response = await story.handleCallback('start', actor, {
      activeHandler: null,
    });
    const text = response.sendMessage?.text ?? '';
    const parseMode = response.sendMessage?.parseMode ?? '';
    const rows = response.sendMessage?.keyboard?.rows ?? [];
    expect(text).toContain('Инструменты ментора');
    expect(parseMode).toBe('MarkdownV2');
    expect(rows.length).toBeGreaterThanOrEqual(3);

    // Первая кнопка — «Мои потоки»
    expect(rows[0]?.[0]?.text).toBe('📋 Мои потоки');
    // Вторая кнопка — «Создать поток»
    expect(rows[1]?.[0]?.text).toBe('➕ Создать поток');
    // Последняя кнопка — «Назад» (главное меню)
    const lastRow = rows[rows.length - 1]?.[0];
    expect(lastRow?.text).toBe('🔙 Назад');
  });

  test('handleCallback "start" отклоняет GUEST', async () => {
    const story = createStory();
    const guest: User = { ...actor, roles: [Role.GUEST] };
    const response = await story.handleCallback('start', guest, {
      activeHandler: null,
    });
    expect(response.sendMessage?.text).toContain('нет доступа');
  });

  test('handleCallback с неизвестной командой возвращает ошибку', async () => {
    const story = createStory();
    const response = await story.handleCallback('unknown', actor, {
      activeHandler: null,
    });
    expect(response.sendMessage?.text).toContain('Неизвестная команда');
  });

  test('handleMessage возвращает заглушку', async () => {
    const story = createStory();
    const response = await story.handleMessage(
      { type: 'message', text: 'что-то', telegramId: 123 },
      actor,
      { activeHandler: null },
    );
    expect(response.sendMessage?.text).toContain('Используйте кнопки');
  });
});
