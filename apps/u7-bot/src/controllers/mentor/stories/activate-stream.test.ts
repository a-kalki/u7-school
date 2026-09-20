import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { BotSession, DialogResponse } from '@u7-scl/core/ui';
import { assertDialogResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { ActivateStreamStory } from './activate-stream';

const actor: User = {
  uuid: 'mentor-1',
  name: 'Ментор',
  telegramId: 123,
  roles: [Role.MENTOR],
  createdAt: '2026-01-01T00:00:00.000Z',
};

const session: BotSession = {
  dialog: { path: 'mentor/activate-stream', seq: 2 },
};

function createStory() {
  const story = new ActivateStreamStory();
  const appApi = { execute: mock(async () => undefined) };
  story.init({ appApi } as never);
  return { story, appApi };
}

describe('ActivateStreamStory (US-7) — контракт «Диалог и Экран»', () => {
  test('menuButtons: пусто (запуск только из карточки потока)', async () => {
    const { story } = createStory();
    expect(await story.menuButtons(actor)).toEqual([]);
  });

  test('activate: экран «Поток запущен» с точной кнопкой назад', async () => {
    const { story, appApi } = createStory();
    const response: DialogResponse = await story.handleCallback(
      'activate:s1',
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);

    expect(String(response.screen?.text)).toContain('Поток запущен');
    expect(String(response.screen?.text)).toContain('Моя учёба');
    // Точная кнопка: назад в менторскую карточку потока (не в view-stream)
    expect(response.screen?.keyboard?.rows).toEqual([
      [{ text: '⬅️ Назад к потоку', code: 'view-stream-mentor:view:s1' }],
    ]);

    // UC вызван с параметрами потока
    const calls = appApi.execute.mock.calls as unknown[][];
    const call = calls.find((c) => c[0] === 'activate-stream');
    expect(call?.[1]).toEqual({ streamId: 's1' });
  });

  test('неизвестная команда — экран «Неизвестная команда»', async () => {
    const { story } = createStory();
    const response = await story.handleCallback('unknown', actor, session);
    expect(String(response.screen?.text)).toContain('Неизвестная');
  });

  test('activate без streamId — экран «Неизвестная команда»', async () => {
    const { story } = createStory();
    const response = await story.handleCallback('activate', actor, session);
    expect(String(response.screen?.text)).toContain('Неизвестная');
  });

  test('handleMessage: дефолт ядра — реплика-отказ + release', async () => {
    const { story } = createStory();
    const response = await story.handleMessage(
      { type: 'message', text: 'что-то', telegramId: 123 },
      actor,
      session,
    );
    expect(String(response.notify?.text)).toContain('не принимаются');
    expect(response.release).toBe(true);
  });
});
