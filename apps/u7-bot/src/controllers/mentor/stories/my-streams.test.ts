import { describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { BotSession, DialogResponse } from '@u7-scl/core/ui';
import { assertDialogResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { MyStreamsStory } from './my-streams';

function mentorActor(): User {
  return {
    uuid: 'mentor-1',
    name: 'Ментор',
    telegramId: 123,
    roles: [Role.MENTOR],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}

const session: BotSession = {
  dialog: { path: 'mentor/my-streams', seq: 2 },
};

const mockStreams = [
  { uuid: 's1', title: 'Поток 1', status: 'enrollment', mentorId: 'mentor-1' },
  { uuid: 's2', title: 'Поток 2', status: 'active', mentorId: 'mentor-1' },
  { uuid: 's3', title: 'Поток 3', status: 'completed', mentorId: 'mentor-1' },
  { uuid: 's4', title: 'Поток 4', status: 'archived', mentorId: 'mentor-1' },
  {
    uuid: 's5',
    title: 'Чужой поток',
    status: 'active',
    mentorId: 'other-mentor',
  },
];

function setupStory(appApi?: {
  execute: (cmd: string) => Promise<unknown>;
}): MyStreamsStory {
  const story = new MyStreamsStory();
  story.init({
    appApi: appApi ?? { execute: async () => mockStreams },
  } as never);
  return story;
}

function flat(response: DialogResponse) {
  return {
    texts: (response.screen?.keyboard?.rows ?? []).flat().map((b) => b.text),
    codes: (response.screen?.keyboard?.rows ?? []).flat().map((b) => b.code),
  };
}

describe('MyStreamsStory — контракт «Диалог и Экран»', () => {
  // ── menuButtons: своей кнопки в главном меню нет ──

  test('menuButtons: пусто (вход только через подменю ментора)', async () => {
    const story = new MyStreamsStory();
    expect(await story.menuButtons(mentorActor())).toEqual([]);
  });

  // ── list: дефолт (только enrollment + active) ──

  test('list: показывает enrollment + active с точными кодами кнопок', async () => {
    const story = setupStory();
    const response = await story.handleCallback('list', mentorActor(), session);
    assertDialogResponseMarkdownSafe(response);

    const text = String(response.screen?.text);
    expect(text).toContain('Мои потоки');
    expect(text).toContain('идёт набор');

    const { texts, codes } = flat(response);
    expect(texts).toContain('🟡 Поток 1');
    expect(texts).toContain('🔵 Поток 2');
    expect(texts).not.toContain('🟢 Поток 3');
    expect(texts).not.toContain('⚫ Поток 4');
    // Чужой поток не показывается
    expect(texts).not.toContain('Чужой поток');

    // Кнопки потоков ведут в view-stream-mentor
    expect(codes).toContain('view-stream-mentor:view:s1');
    expect(codes).toContain('view-stream-mentor:view:s2');

    // Переключатели фильтров (инвентаризация)
    expect(codes).toContain('my-streams:list:archived:1');
    expect(codes).toContain('my-streams:list:completed:1');
    expect(texts).toContain('⚫ Вкл. архивированные');
    expect(texts).toContain('🟢 Вкл. завершённые');

    // «Назад» — в подменю ментора
    expect(codes).toContain('submenu:start');
    expect(texts).toContain('🔙 Назад');
  });

  test('list:completed:1 — завершённые видны, переключатель парный', async () => {
    const story = setupStory();
    const response = await story.handleCallback(
      'list:completed:1',
      mentorActor(),
      session,
    );
    const { texts, codes } = flat(response);
    expect(texts).toContain('🟢 Поток 3');
    expect(texts).not.toContain('⚫ Поток 4');
    expect(codes).toContain('my-streams:list:completed:1:archived:1');
    expect(texts).toContain('⚫ Вкл. архивированные');
  });

  test('list:archived:1 — архив виден, переключатель парный', async () => {
    const story = setupStory();
    const response = await story.handleCallback(
      'list:archived:1',
      mentorActor(),
      session,
    );
    const { texts, codes } = flat(response);
    expect(texts).toContain('⚫ Поток 4');
    expect(texts).not.toContain('🟢 Поток 3');
    expect(codes).toContain('my-streams:list:completed:1:archived:1');
    expect(texts).toContain('🟢 Вкл. завершённые');
  });

  test('list:completed:1:archived:1 — оба включены, переключателей нет', async () => {
    const story = setupStory();
    const response = await story.handleCallback(
      'list:completed:1:archived:1',
      mentorActor(),
      session,
    );
    const { texts } = flat(response);
    expect(texts).toContain('🟢 Поток 3');
    expect(texts).toContain('⚫ Поток 4');
    expect(texts.some((t) => t.includes('Вкл.'))).toBe(false);
  });

  // ── Пустой список ──

  test('пустой список — «У вас пока нет потоков» + Назад', async () => {
    const story = setupStory({ execute: async () => [] });
    const response = await story.handleCallback('list', mentorActor(), session);
    expect(String(response.screen?.text)).toContain('У вас пока нет потоков');
    const { texts, codes } = flat(response);
    expect(texts).toContain('🔙 Назад');
    expect(codes).toContain('submenu:start');
  });

  // ── Ошибка API ──

  test('ошибка API — экран «Не удалось загрузить список потоков.»', async () => {
    const story = setupStory({
      execute: async () => {
        throw new Error('API error');
      },
    });
    const response = await story.handleCallback('list', mentorActor(), session);
    expect(String(response.screen?.text)).toContain('Не удалось загрузить');
  });

  // ── Неизвестный action / текстовый ввод ──

  test('неизвестный action — экран «Неизвестная команда»', async () => {
    const story = setupStory();
    const response = await story.handleCallback(
      'bogus',
      mentorActor(),
      session,
    );
    expect(String(response.screen?.text)).toContain('Неизвестная');
  });

  test('handleMessage: дефолт ядра — реплика-отказ + release', async () => {
    const story = setupStory();
    const response = await story.handleMessage(
      { type: 'message', text: 'что-то', telegramId: 123 },
      mentorActor(),
      session,
    );
    expect(String(response.notify?.text)).toContain('не принимаются');
    expect(response.release).toBe(true);
  });
});
