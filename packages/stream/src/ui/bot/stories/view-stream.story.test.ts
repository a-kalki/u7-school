import { describe, expect, mock, test } from 'bun:test';
import type { ApiApp } from '@u7-scl/core/api';
import type { SessionData } from '@u7-scl/core/ui';
import type { StreamAppMeta } from '../../../domain/module';
import { ViewStreamStory } from './view-stream.story';

describe('ViewStreamStory', () => {
  const session: SessionData = { activeHandler: null };
  const actor = { uuid: 'user-1', telegramId: 123, roles: ['GUEST'] };

  const sampleStream = {
    uuid: 's-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
    title: 'Python Advanced',
    description: 'Продвинутый курс',
    status: 'enrollment',
    startDate: '2026-06-01T00:00:00.000Z',
  };

  const makeMockApi = (stream: Record<string, unknown>, studentCount: number) =>
    ({
      execute: mock((name: string) => {
        if (name === 'get-stream') return stream;
        if (name === 'list-stream-students')
          return Array.from({ length: studentCount }, (_, i) => ({
            uuid: `student-${i}`,
          }));
        return undefined;
      }),
    }) as unknown as ApiApp<StreamAppMeta>;

  test('handleCallback("view:<id>") показывает карточку потока', async () => {
    const story = new ViewStreamStory();
    story.init(makeMockApi(sampleStream, 0));

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      actor,
      session,
    );
    expect(response.sendMessage?.text).toContain('Python Advanced');
    expect(response.sendMessage?.text).toContain('Продвинутый курс');
  });

  test('на enrollment — кнопка «Записаться»', async () => {
    const story = new ViewStreamStory();
    story.init(makeMockApi(sampleStream, 0));

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      actor,
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Записаться'))).toBe(true);
  });

  test('на active — кнопка «Записаться» скрыта', async () => {
    const activeStream = { ...sampleStream, status: 'active' };
    const story = new ViewStreamStory();
    story.init(makeMockApi(activeStream, 5));

    const response = await story.handleCallback(
      'view:a-a-a-a-a-a-a-a-a-a-a-a-a-a-a-a',
      actor,
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Записаться'))).toBe(false);
  });

  test('handleStart возвращает null (не в меню)', async () => {
    const story = new ViewStreamStory();
    const item = await story.handleStart(actor);
    expect(item).toBeNull();
  });
});
