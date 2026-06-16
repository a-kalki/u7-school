import { describe, expect, mock, test } from 'bun:test';
import type { U7BotAppMeta, User } from '@u7-scl/app/domain';
import type { ApiApp } from '@u7-scl/core/api';
import type { SessionData } from '@u7-scl/core/ui';
import { ViewStreamStory } from './view-stream.story';

describe('ViewStreamStory', () => {
  const session: SessionData = { activeHandler: null };
  const guestActor: User = {
    uuid: 'user-1',
    name: 'Гость',
    telegramId: 123,
    roles: ['GUEST'],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const studentActor: User = {
    uuid: 'user-2',
    name: 'Студент',
    telegramId: 456,
    roles: ['STUDENT'],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const sampleStream = {
    uuid: 's-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
    title: 'Python Advanced',
    description: 'Продвинутый курс',
    status: 'enrollment',
    startDate: '2026-06-01T00:00:00.000Z',
    mentorId: 'm-m-m-m-m-m-m-m-m-m-m-m-m-m-m-m',
  };

  const makeMockApi = (
    stream: Record<string, unknown>,
    studentCount: number,
    mentorName = 'Алексей Смирнов',
  ) => {
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-stream') return stream;
        if (name === 'list-stream-students')
          return Array.from({ length: studentCount }, (_, i) => ({
            uuid: `student-${i}`,
          }));
        return undefined;
      }),
    };
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'get-user')
          return { uuid: 'm1', name: mentorName, roles: ['MENTOR'] };
        return undefined;
      }),
    };
    return { moduleApi, appApi };
  };

  test('handleCallback("view:<id>") показывает карточку потока', async () => {
    const { moduleApi, appApi } = makeMockApi(sampleStream, 0);
    const story = new ViewStreamStory();
    story.init(moduleApi as any, appApi as any);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      guestActor,
      session,
    );
    expect(response.sendMessage?.text).toContain('Python Advanced');
    expect(response.sendMessage?.text).toContain('Продвинутый курс');
  });

  test('на enrollment — кнопка «Записаться»', async () => {
    const { moduleApi, appApi } = makeMockApi(sampleStream, 0);
    const story = new ViewStreamStory();
    story.init(moduleApi as any, appApi as any);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      guestActor,
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Записаться'))).toBe(true);
  });

  test('на active — кнопка «Записаться» скрыта', async () => {
    const activeStream = { ...sampleStream, status: 'active' };
    const { moduleApi, appApi } = makeMockApi(activeStream, 5);
    const story = new ViewStreamStory();
    story.init(moduleApi as any, appApi as any);

    const response = await story.handleCallback(
      'view:a-a-a-a-a-a-a-a-a-a-a-a-a-a-a-a',
      guestActor,
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Записаться'))).toBe(false);
  });

  test('GUEST на enrollment — кнопки «Записаться», «Программа», «Назад»', async () => {
    const { moduleApi, appApi } = makeMockApi(sampleStream, 0);
    const story = new ViewStreamStory();
    story.init(moduleApi as any, appApi as any);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      guestActor,
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
    const { moduleApi, appApi } = makeMockApi(activeStream, 0);
    const story = new ViewStreamStory();
    story.init(moduleApi as any, appApi as any);

    const response = await story.handleCallback(
      'view:a-a-a-a-a-a-a-a-a-a-a-a-a-a-a-a',
      guestActor,
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Записаться'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Уведомить'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Назад'))).toBe(true);
  });

  test('STUDENT на enrollment — НЕ видит «Записаться»', async () => {
    const { moduleApi, appApi } = makeMockApi(sampleStream, 0);
    const story = new ViewStreamStory();
    story.init(moduleApi as any, appApi as any);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      studentActor,
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Записаться'))).toBe(false);
  });

  test('показывает имя ментора в карточке', async () => {
    const { moduleApi, appApi } = makeMockApi(sampleStream, 0);
    const story = new ViewStreamStory();
    story.init(moduleApi as any, appApi as any);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      guestActor,
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
    const moduleApi = {
      execute: mock((name: string) => {
        if (name === 'get-stream') return streamWithContent;
        return undefined;
      }),
    };
    const appApi = {
      execute: mock(() => undefined),
    };

    const story = new ViewStreamStory();
    story.init(moduleApi as any, appApi as any);

    const response = await story.handleCallback(
      'program:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      guestActor,
      session,
    );

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Программа курса');
    expect(text).toContain('Основы');
    expect(text).toContain('Введение');
    expect(text).toContain('Переменные');
    expect(text).toContain('Продвинутый');
    expect(text).toContain('Асинхронность');

    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Назад к потоку'))).toBe(true);
  });

  test('handleStart возвращает null (не в меню)', async () => {
    const story = new ViewStreamStory();
    const item = await story.handleStart(guestActor);
    expect(item).toBeNull();
  });

  // ── US-7: Менторские кнопки ──

  const mentorActor: User = {
    uuid: 'm-m-m-m-m-m-m-m-m-m-m-m-m-m-m-m',
    name: 'Алексей Смирнов',
    telegramId: 999,
    roles: ['MENTOR'],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const otherMentorActor: User = {
    uuid: 'o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o',
    name: 'Другой Ментор',
    telegramId: 888,
    roles: ['MENTOR'],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  test('MENTOR на своём enrollment — кнопки «Запустить», «Студенты», «В архив»', async () => {
    const { moduleApi, appApi } = makeMockApi(sampleStream, 5);
    const story = new ViewStreamStory();
    story.init(moduleApi as any, appApi as any);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Запустить'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Студенты'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('В архив'))).toBe(true);
    // Ментор не видит «Записаться» на своём потоке
    expect(btnTexts.some((t) => t.includes('Записаться'))).toBe(false);
  });

  test('MENTOR на своём active — кнопки «Завершить», «Студенты», «В архив»', async () => {
    const activeStream = { ...sampleStream, status: 'active' };
    const { moduleApi, appApi } = makeMockApi(activeStream, 8);
    const story = new ViewStreamStory();
    story.init(moduleApi as any, appApi as any);

    const response = await story.handleCallback(
      'view:a-a-a-a-a-a-a-a-a-a-a-a-a-a-a-a',
      mentorActor,
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Завершить'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Студенты'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('В архив'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Запустить'))).toBe(false);
  });

  test('MENTOR на чужом потоке — НЕ видит менторских кнопок', async () => {
    const { moduleApi, appApi } = makeMockApi(sampleStream, 3);
    const story = new ViewStreamStory();
    story.init(moduleApi as any, appApi as any);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      otherMentorActor,
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Запустить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Завершить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Студенты'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('В архив'))).toBe(false);
  });

  test('кнопка «Завершить» вызывает complete-stream', async () => {
    const { moduleApi, appApi } = makeMockApi(
      { ...sampleStream, status: 'active' },
      0,
    );
    const story = new ViewStreamStory();
    story.init(moduleApi as any, appApi as any);

    await story.handleCallback(
      'complete:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );

    expect(moduleApi.execute).toHaveBeenCalledWith('complete-stream', {
      streamId: 's-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
    });
  });

  test('кнопка «В архив» вызывает archive-stream', async () => {
    const { moduleApi, appApi } = makeMockApi(sampleStream, 0);
    const story = new ViewStreamStory();
    story.init(moduleApi as any, appApi as any);

    await story.handleCallback(
      'archive:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );

    expect(moduleApi.execute).toHaveBeenCalledWith('archive-stream', {
      streamId: 's-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
    });
  });

  test('GUEST на потоке ментора — НЕ видит менторских кнопок', async () => {
    const { moduleApi, appApi } = makeMockApi(sampleStream, 3);
    const story = new ViewStreamStory();
    story.init(moduleApi as any, appApi as any);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      guestActor,
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Запустить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Завершить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Студенты'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('В архив'))).toBe(false);
  });
});
