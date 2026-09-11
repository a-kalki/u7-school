import { describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { BotSession, DialogResponse } from '@u7-scl/core/ui';
import { assertDialogResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { SubmenuStory } from './submenu';

function actor(roles: Role[]): User {
  return {
    uuid: 'user-1',
    name: 'Тест',
    telegramId: 123,
    roles,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

const mentor = actor([Role.MENTOR]);
const session: BotSession = {
  dialog: { path: 'mentor/submenu', seq: 2 },
};

function createStory(): SubmenuStory {
  return new SubmenuStory();
}

describe('SubmenuStory (S02m) — контракт «Диалог и Экран»', () => {
  // ── menuButtons: вход в подменю из главного меню ──

  test('menuButtons: MENTOR — кнопка «🛠️ Инструменты ментора» (priority 30)', () => {
    const story = createStory();
    const buttons = story.menuButtons(mentor);
    expect(buttons).toHaveLength(1);
    const btn = buttons[0]!;
    expect(btn.kind).toBe('callback');
    expect(btn.text).toBe('🛠️ Инструменты ментора');
    expect(btn.priority).toBe(30);
    if (btn.kind === 'callback') {
      expect(btn.action).toBe('submenu:start');
      expect(btn.description).toContain('Инструменты ментора');
    }
  });

  test('menuButtons: ADMIN видит кнопку', () => {
    const story = createStory();
    expect(story.menuButtons(actor([Role.ADMIN]))).toHaveLength(1);
  });

  test('menuButtons: GUEST и STUDENT — нет кнопки', () => {
    const story = createStory();
    expect(story.menuButtons(actor([Role.GUEST]))).toEqual([]);
    expect(story.menuButtons(actor([Role.STUDENT]))).toEqual([]);
  });

  // ── handleCallback "start": экран подменю с точной клавиатурой ──

  test('start: экран «Инструменты ментора» с тремя кнопками', async () => {
    const story = createStory();
    const response: DialogResponse = await story.handleCallback(
      'start',
      mentor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    expect(String(response.screen?.text)).toContain('Инструменты ментора');
    const rows = response.screen?.keyboard?.rows ?? [];
    expect(rows).toHaveLength(3);
    // Точные кнопки и коды (инвентаризация S02m)
    expect(rows[0]).toEqual([
      { text: '📋 Мои потоки', code: 'my-streams:list' },
    ]);
    expect(rows[1]).toEqual([
      { text: '➕ Создать поток', code: 'create-stream:start' },
    ]);
    expect(rows[2]).toEqual([{ text: '🔙 Назад', code: 'app:main-menu' }]);
    // Экран диалога, не реплика
    expect(response.notify).toBeUndefined();
  });

  test('start: не-ментор — экран «нет доступа»', async () => {
    const story = createStory();
    const response = await story.handleCallback(
      'start',
      actor([Role.GUEST]),
      session,
    );
    assertDialogResponseMarkdownSafe(response);
    expect(String(response.screen?.text)).toContain('нет доступа');
    expect(response.screen?.keyboard).toBeUndefined();
  });

  test('неизвестный action — экран «Неизвестная команда»', async () => {
    const story = createStory();
    const response = await story.handleCallback('bogus', mentor, session);
    expect(String(response.screen?.text)).toContain('Неизвестная');
  });

  // ── Текстовый ввод — дефолт ядра (реплика-отказ + release) ──

  test('handleMessage: реплика-отказ без захвата экрана + release', async () => {
    const story = createStory();
    const response = await story.handleMessage(
      { type: 'message', text: 'что-то', telegramId: 123 },
      mentor,
      session,
    );
    expect(String(response.notify?.text)).toContain('не принимаются');
    expect(response.release).toBe(true);
    expect(response.screen).toBeUndefined();
  });
});
