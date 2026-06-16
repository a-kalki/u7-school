import { describe, expect, mock, test } from 'bun:test';
import type { ApiApp } from '@u7-scl/core/api';
import type { SessionData } from '@u7-scl/core/ui';
import type { U7BotAppMeta } from '@u7-scl/app/domain';
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
    }) as unknown as ApiApp<U7BotAppMeta>;

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

  test('GUEST на enrollment — кнопки «Записаться», «Программа», «Назад»', async () => {
    const mockApi = {
      execute: mock((name: string) => {
        if (name === 'get-stream') return sampleStream;
        if (name === 'list-stream-students') return [];
        if (name === 'get-user')
          return { uuid: 'm1', name: 'Ментор', roles: ['MENTOR'] };
        return undefined;
      }),
    } as unknown as ApiApp<U7BotAppMeta>;

    const story = new ViewStreamStory();
    story.init(mockApi);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      { uuid: 'user-1', telegramId: 123, roles: ['GUEST'] },
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Записаться'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Программа'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Назад'))).toBe(true);
  });

  test('GUEST на active — кнопки «Уведомить», «Назад» без «Записаться»', async () => {
    const activeStream = { ...sampleStream, status: 'active' };
    const mockApi = {
      execute: mock((name: string) => {
        if (name === 'get-stream') return activeStream;
        if (name === 'list-stream-students') return [];
        if (name === 'get-user')
          return { uuid: 'm1', name: 'Ментор', roles: ['MENTOR'] };
        return undefined;
      }),
    } as unknown as ApiApp<U7BotAppMeta>;

    const story = new ViewStreamStory();
    story.init(mockApi);

    const response = await story.handleCallback(
      'view:a-a-a-a-a-a-a-a-a-a-a-a-a-a-a-a',
      { uuid: 'user-1', telegramId: 123, roles: ['GUEST'] },
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Записаться'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Уведомить'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Назад'))).toBe(true);
  });

  test('STUDENT на enrollment — НЕ видит «Записаться»', async () => {
    const mockApi = {
      execute: mock((name: string) => {
        if (name === 'get-stream') return sampleStream;
        if (name === 'list-stream-students') return [];
        if (name === 'get-user')
          return { uuid: 'm1', name: 'Ментор', roles: ['MENTOR'] };
        return undefined;
      }),
    } as unknown as ApiApp<U7BotAppMeta>;

    const story = new ViewStreamStory();
    story.init(mockApi);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      { uuid: 'user-1', telegramId: 123, roles: ['STUDENT'] },
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Записаться'))).toBe(false);
  });

  test('показывает имя ментора в карточке', async () => {
    const mockApi = {
      execute: mock((name: string) => {
        if (name === 'get-stream') return sampleStream;
        if (name === 'list-stream-students') return [];
        if (name === 'get-user')
          return { uuid: 'm1', name: 'Алексей Смирнов', roles: ['MENTOR'] };
        return undefined;
      }),
    } as unknown as ApiApp<U7BotAppMeta>;

    const story = new ViewStreamStory();
    story.init(mockApi);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      { uuid: 'user-1', telegramId: 123, roles: ['GUEST'] },
      session,
    );
    expect(response.sendMessage?.text).toContain('Алексей Смирнов');
  });

  test('кнопка «Программа курса» показывает contentSnapshot', async () => {
    const streamWithContent = {
      ...sampleStream,
      contentSnapshot: [
        {
          projectTitle: 'Основы',
          lessons: [
            { lessonTitle: 'Введение', stepIds: ['s1', 's2'] },
            { lessonTitle: 'Переменные', stepIds: ['s3'] },
          ],
        },
        {
          projectTitle: 'Продвинутый',
          lessons: [{ lessonTitle: 'Асинхронность', stepIds: ['s4'] }],
        },
      ],
    };
    const mockApi = {
      execute: mock((name: string) => {
        if (name === 'get-stream') return streamWithContent;
        return undefined;
      }),
    } as unknown as ApiApp<U7BotAppMeta>;

    const story = new ViewStreamStory();
    story.init(mockApi);

    const response = await story.handleCallback(
      'program:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      actor,
      session,
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Программа курса');
    expect(text).toContain('Основы');
    expect(text).toContain('Введение');
    expect(text).toContain('Переменные');
    expect(text).toContain('Продвинутый');
    expect(text).toContain('Асинхронность');

    // Кнопка назад
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Назад к потоку'))).toBe(true);
  });

  test('handleStart возвращает null (не в меню)', async () => {
    const story = new ViewStreamStory();
    const item = await story.handleStart(actor);
    expect(item).toBeNull();
  });
});
