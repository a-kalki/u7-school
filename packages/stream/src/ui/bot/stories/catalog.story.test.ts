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
