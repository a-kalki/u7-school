import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { CatalogStory } from './stream-catalog.story';

describe('CatalogStory (S01)', () => {
  const session: SessionData = { activeHandler: null };
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

    const mockUiApp = {
      getAction: mock((name: string) => {
        if (name === 'mainMenu') {
          return () => ({ text: '↩️ Главное меню', code: 'app:main-menu' });
        }
        throw new Error(`Действие «${name}» не найдено`);
      }),
    };

    const story = new CatalogStory();
    story.init({ appApi: mockAppApi, uiApp: mockUiApp } as never);
    return { story, mockAppApi, mockUiApp };
  }

  test('handleStart возвращает кнопку «📚 Потоки курсов»', async () => {
    const { story } = makeStory([]);
    const item = await story.handleStart(guestActor);
    expect(item?.kind).toBe('callback');
    expect(item?.text).toContain('Потоки курсов');
    expect(item?.priority).toBe(15);
    if (item?.kind === 'callback') {
      expect(item.action).toBe('catalog:list');
    }
  });

  test('handleStart содержит описание для help', async () => {
    const { story } = makeStory([]);
    const item = await story.handleStart(guestActor);
    expect(item?.description).toContain('Потоки курсов');
    expect(item?.description).toContain('каталога');
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
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Потоки курсов');
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Поток Набора'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Активный Поток'))).toBe(true);
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
    assertResponseMarkdownSafe(response);
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

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
        uuid: 'a-a-a-a-a-a-a-a-a-a-a-a-a-a-a-a',
        title: 'Активный Поток',
        status: 'active',
      },
      {
        uuid: 'c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c',
        title: 'Завершённый',
        status: 'completed',
      },
    ]);

    const response = await story.handleCallback(
      'list-with-completed',
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Поток Набора'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Активный Поток'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Завершённый'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Только активные'))).toBe(true);
  });

  test('list: пустой список — сообщение «Нет доступных потоков»', async () => {
    const { story } = makeStory([]);

    const response = await story.handleCallback('list', guestActor, session);
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Нет доступных потоков');
  });

  test('list: без активных, с completed — кнопка «Вкл. завершённые»', async () => {
    const { story } = makeStory([
      {
        uuid: 'c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c',
        title: 'Завершённый',
        status: 'completed',
      },
    ]);

    const response = await story.handleCallback('list', guestActor, session);
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Нет активных потоков');
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Вкл. завершённые'))).toBe(true);
  });

  test('list: легенда цветных кружков в тексте', async () => {
    const { story } = makeStory([
      {
        uuid: 'e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e',
        title: 'Поток Набора',
        status: 'enrollment',
      },
    ]);

    const response = await story.handleCallback('list', guestActor, session);
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('🟡');
    expect(response.sendMessage?.text).toContain('🔵');
    expect(response.sendMessage?.text).toContain('🟢');
    expect(response.sendMessage?.text).toContain('⚫');
  });

  test('list: кнопка «↩️ Главное меню» последней строкой', async () => {
    const { story } = makeStory([
      {
        uuid: 'e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e',
        title: 'Поток Набора',
        status: 'enrollment',
      },
    ]);

    const response = await story.handleCallback('list', guestActor, session);
    assertResponseMarkdownSafe(response);
    const rows = response.sendMessage?.keyboard?.rows ?? [];
    expect(rows.length).toBeGreaterThanOrEqual(1);
    const lastRow = rows[rows.length - 1]!;
    expect(lastRow).toHaveLength(1);
    expect(lastRow[0]!.text).toBe('↩️ Главное меню');
    expect(lastRow[0]!.code).toBe('app:main-menu');
  });

  test('handleMessage возвращает заглушку', async () => {
    const { story } = makeStory([]);
    const response = await story.handleMessage(
      { type: 'message', text: 'что-то', telegramId: 123 },
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Неизвестное');
  });

  test('list: неизвестная команда каталога', async () => {
    const { story } = makeStory([]);
    const response = await story.handleCallback(
      'unknown-cmd',
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Неизвестная');
  });
});
