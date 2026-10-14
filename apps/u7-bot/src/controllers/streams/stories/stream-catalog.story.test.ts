import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { BotSession } from '@u7-scl/core/ui';
import { assertDialogResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { CatalogStory } from './stream-catalog.story';

describe('CatalogStory (S01)', () => {
  const session: BotSession = { dialog: { path: 'stream/catalog', seq: 1 } };
  const guestActor: User = {
    uuid: 'user-1',
    name: 'Гость',
    telegramId: 123,
    roles: [Role.GUEST],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  /** Создаёт сторис с мокнутым appApi */
  function makeStory(streams: unknown[]) {
    const mockAppApi = {
      execute: mock(async (name: string) => {
        if (name === 'list-streams') return streams;
        return undefined;
      }),
    };

    const story = new CatalogStory();
    story.init({ appApi: mockAppApi } as never);
    return { story, mockAppApi };
  }

  test('menuButtons возвращает пустой массив (вход из главного меню убран)', async () => {
    const { story } = makeStory([]);
    const buttons = await story.menuButtons(guestActor);
    expect(buttons).toHaveLength(0);
  });

  test('list: показывает enrollment и active потоки', async () => {
    const { story } = makeStory([
      {
        uuid: 'e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e',
        title: 'Поток Набора',
        status: 'enrollment',
      },
      {
        uuid: 'a-a-a-a-a-a-a-a-a-a-a-a-a-a-a-a',
        title: 'Активный Поток',
        status: 'active',
      },
    ]);

    const response = await story.handleCallback('list', guestActor, session);
    assertDialogResponseMarkdownSafe(response);
    expect(String(response.screen?.text)).toContain('Потоки курсов');
    const rows = response.screen?.keyboard?.rows ?? [];
    const btnTexts = rows.flat().map((b) => b.text);
    expect(btnTexts.some((t) => t.includes('Поток Набора'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Активный Поток'))).toBe(true);

    // Кнопки потока — мосты в view-stream (кросс-стори колбэк)
    const btnCodes = rows.flat().map((b) => b.code);
    expect(btnCodes).toContain(
      'view-stream:view:e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e',
    );
    expect(btnCodes).toContain(
      'view-stream:view:a-a-a-a-a-a-a-a-a-a-a-a-a-a-a-a',
    );
  });

  test('list: скрывает completed и archived по умолчанию', async () => {
    const { story } = makeStory([
      {
        uuid: 'e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e',
        title: 'Поток Набора',
        status: 'enrollment',
      },
      {
        uuid: 'a-a-a-a-a-a-a-a-a-a-a-a-a-a-a-a',
        title: 'Активный Поток',
        status: 'active',
      },
      {
        uuid: 'c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c',
        title: 'Завершённый',
        status: 'completed',
      },
      {
        uuid: 'r-r-r-r-r-r-r-r-r-r-r-r-r-r-r-r',
        title: 'Архивный',
        status: 'archived',
      },
    ]);

    const response = await story.handleCallback('list', guestActor, session);
    assertDialogResponseMarkdownSafe(response);
    const btnTexts =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Поток Набора'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Активный Поток'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Завершённый'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Архивный'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Вкл. завершённые'))).toBe(true);
  });

  test('list-with-completed: показывает completed', async () => {
    const { story } = makeStory([
      {
        uuid: 'e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e',
        title: 'Поток Набора',
        status: 'enrollment',
      },
      {
        uuid: 'c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c',
        title: 'Завершённый',
        status: 'completed',
      },
      {
        uuid: 'r-r-r-r-r-r-r-r-r-r-r-r-r-r-r-r',
        title: 'Архивный',
        status: 'archived',
      },
    ]);

    const response = await story.handleCallback(
      'list-with-completed',
      guestActor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);
    const btnTexts =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Завершённый'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Архивный'))).toBe(false);
  });

  test('list-with-all: показывает и completed, и archived', async () => {
    const { story } = makeStory([
      {
        uuid: 'c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c',
        title: 'Завершённый',
        status: 'completed',
      },
      {
        uuid: 'r-r-r-r-r-r-r-r-r-r-r-r-r-r-r-r',
        title: 'Архивный',
        status: 'archived',
      },
    ]);

    const response = await story.handleCallback(
      'list-with-all',
      guestActor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);
    const btnTexts =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Завершённый'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Архивный'))).toBe(true);
  });

  test('list: нет потоков и нет скрытых — заглушка с кнопкой «⬅️ Назад в школу»', async () => {
    const { story } = makeStory([]);

    const response = await story.handleCallback('list', guestActor, session);
    assertDialogResponseMarkdownSafe(response);
    expect(String(response.screen?.text)).toContain('Нет доступных потоков');
    const rows = response.screen?.keyboard?.rows ?? [];
    expect(rows.length).toBeGreaterThan(0);
    const lastRow = rows[rows.length - 1];
    expect(lastRow?.[0]?.text).toContain('Назад в школу');
    expect(lastRow?.[0]?.code).toBe('school:hub:open');
  });

  test('list: нет активных, но есть завершённые — заглушка с переключателем и кнопкой назад', async () => {
    const { story } = makeStory([
      {
        uuid: 'c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c',
        title: 'Завершённый',
        status: 'completed',
      },
    ]);

    const response = await story.handleCallback('list', guestActor, session);
    assertDialogResponseMarkdownSafe(response);
    expect(String(response.screen?.text)).toContain('Нет активных потоков');
    const btnTexts =
      response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Вкл. завершённые'))).toBe(true);
    // Кнопка возврата в школу
    expect(btnTexts.some((t) => t.includes('Назад в школу'))).toBe(true);
    const lastRow = response.screen?.keyboard?.rows.slice(-1)[0];
    expect(lastRow?.[0]?.code).toBe('school:hub:open');
  });

  test('кнопка «⬅️ Назад в школу» — последняя строка каталога', async () => {
    const { story } = makeStory([
      {
        uuid: 'e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e',
        title: 'Поток Набора',
        status: 'enrollment',
      },
    ]);

    const response = await story.handleCallback('list', guestActor, session);
    const rows = response.screen?.keyboard?.rows ?? [];
    expect(rows.length).toBeGreaterThan(0);
    const lastRow = rows[rows.length - 1];
    expect(lastRow?.[0]?.text).toContain('Назад в школу');
    expect(lastRow?.[0]?.code).toBe('school:hub:open');
  });

  test('неизвестная команда каталога — экран «Неизвестная команда»', async () => {
    const { story } = makeStory([]);

    const response = await story.handleCallback('bogus', guestActor, session);
    expect(String(response.screen?.text)).toContain('Неизвестная');
  });

  test('handleMessage — дефолт ядра (ввод без ожидания до стори не доходит)', async () => {
    const { story } = makeStory([]);
    const msg = await story.handleMessage(
      { type: 'message', text: 'x', telegramId: 1 },
      guestActor,
      session,
    );
    expect(String(msg.notify?.text)).toContain('не принимаются');
    expect(msg.release).toBe(true);
  });

  test('тексты экрана: заголовок и легенда статусов', async () => {
    const { story } = makeStory([
      {
        uuid: 'e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e',
        title: 'Поток «JS_Core» (набор!)',
        status: 'enrollment',
      },
    ]);

    const response = await story.handleCallback('list', guestActor, session);
    const text = String(response.screen?.text);
    expect(text).toContain('📚 *Потоки курсов*');
    expect(text).toContain('🟡 — идёт набор');
    expect(text).toContain('⚫ — в архиве');
    // Текст кнопки — plain (без экранирования по контракту)
    const btn = response.screen?.keyboard?.rows[0]?.[0];
    expect(btn?.text).toBe('🟡 Поток «JS_Core» (набор!)');
  });
});
