import { describe, expect, mock, test } from 'bun:test';
import type { ApiApp } from '@u7-scl/core/api';
import type { BotResponse, SessionData } from '@u7-scl/core/ui';
import type { U7BotAppMeta } from '@u7-scl/app/domain';
import { CatalogStory } from './catalog.story';

describe('CatalogStory', () => {
  const makeMockApi = (streams: unknown[]) =>
    ({
      execute: mock(async (_name: string) => streams),
    }) as unknown as ApiApp<U7BotAppMeta>;

  const session: SessionData = { activeHandler: null };
  const actor = { uuid: 'user-1', telegramId: 123, roles: ['GUEST'] };

  test('handleCallback("list") показывает список потоков', async () => {
    const streams = [
      {
        uuid: '11111111-1111-1111-1111-111111111111',
        title: 'Поток Набора',
        status: 'enrollment',
      },
    ];
    const story = new CatalogStory();
    story.init(makeMockApi(streams));

    const response = await story.handleCallback('list', actor, session);
    expect(response.sendMessage?.text).toContain('Потоки школы');
    expect(response.sendMessage?.keyboard).toBeDefined();
  });

  test('handleCallback("list") с пустым списком', async () => {
    const story = new CatalogStory();
    story.init(makeMockApi([]));

    const response = await story.handleCallback('list', actor, session);
    expect(response.sendMessage?.text).toContain('Нет доступных потоков');
    expect(response.sendMessage?.keyboard).toBeUndefined();
  });

  test('handleStart возвращает кнопку главного меню', async () => {
    const story = new CatalogStory();
    const item = await story.handleStart(actor);
    expect(item?.text).toContain('Наши потоки');
    expect(item?.priority).toBe(10);
    expect(item?.action).toBe('catalog:list');
  });

  test('handleCallback("list") фильтрует только enrollment и active', async () => {
    const allStreams: Record<string, unknown[]> = {
      enrollment: [
        {
          uuid: 'e-e-e-e-e-e-e-e-e-e-e-e-e-e-e-e',
          title: 'Поток Набора',
          status: 'enrollment',
        },
      ],
      active: [
        {
          uuid: 'a-a-a-a-a-a-a-a-a-a-a-a-a-a-a-a',
          title: 'Активный Поток',
          status: 'active',
        },
      ],
      completed: [
        {
          uuid: 'c-c-c-c-c-c-c-c-c-c-c-c-c-c-c-c',
          title: 'Завершённый',
          status: 'completed',
        },
      ],
      archived: [
        {
          uuid: 'r-r-r-r-r-r-r-r-r-r-r-r-r-r-r-r',
          title: 'Архивный',
          status: 'archived',
        },
      ],
    };

    const mockApi = {
      execute: mock(async (_name: string, attrs: unknown) => {
        const cmd = attrs as { status?: string };
        if (cmd?.status) {
          return allStreams[cmd.status] ?? [];
        }
        return Object.values(allStreams).flat();
      }),
    } as unknown as ApiApp<U7BotAppMeta>;

    const story = new CatalogStory();
    story.init(mockApi);

    const response = await story.handleCallback('list', actor, session);
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    // Должны быть только enrollment и active
    expect(btnTexts.some((t) => t.includes('Поток Набора'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Активный Поток'))).toBe(true);

    // Не должно быть completed и archived
    expect(btnTexts.some((t) => t.includes('Завершённый'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Архивный'))).toBe(false);
  });

  test('handleMessage возвращает заглушку', async () => {
    const story = new CatalogStory();
    const response = await story.handleMessage(
      { type: 'message', text: 'что-то', telegramId: 123 },
      actor,
      session,
    );
    expect(response.sendMessage?.text).toContain('Неизвестное');
  });
});
