import { describe, expect, mock, test } from 'bun:test';
import type { U7BotApp, User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModule } from 'packages/stream/src/api';
import { ViewStreamStory } from './view-stream.story';

describe('ViewStreamStory', () => {
  const session: SessionData = { activeHandler: null };
  const guestActor: User = {
    uuid: 'user-1',
    name: 'Гость',
    telegramId: 123,
    roles: [Role.GUEST],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const studentActor: User = {
    uuid: 'user-2',
    name: 'Студент',
    telegramId: 456,
    roles: [Role.STUDENT],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const mentorActor: User = {
    uuid: 'm-m-m-m-m-m-m-m-m-m-m-m-m-m-m-m',
    name: 'Алексей Смирнов',
    telegramId: 999,
    roles: [Role.MENTOR],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const otherMentorActor: User = {
    uuid: 'o-o-o-o-o-o-o-o-o-o-o-o-o-o-o-o',
    name: 'Другой Ментор',
    telegramId: 888,
    roles: [Role.MENTOR],
    createdAt: '2026-01-01T00:00:00.000Z',
  };
  const adminActor: User = {
    uuid: 'admin-1',
    name: 'Админ',
    telegramId: 777,
    roles: [Role.ADMIN],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const sampleStream = {
    uuid: 's-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
    title: 'Python Advanced',
    description: 'Продвинутый курс',
    moduleId: 'mod-1',
    status: 'enrollment',
    startDate: '2026-06-01T00:00:00.000Z',
    mentorId: 'm-m-m-m-m-m-m-m-m-m-m-m-m-m-m-m',
  };

  /**
   * Создаёт моки и сторис одним вызовом.
   */
  const makeViewStory = (
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
    } as unknown as StreamApiModule;
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'get-user')
          return { uuid: 'm1', name: mentorName, roles: [Role.MENTOR] };
        if (name === 'list-courses')
          return [{ uuid: 'course-1', title: 'Python', moduleIds: ['mod-1'] }];
        return undefined;
      }),
    } as unknown as U7BotApp;
    const story = new ViewStreamStory();
    story.init(moduleApi, appApi);
    return { story, moduleApi, appApi };
  };

  // ── Базовое отображение ──

  test('handleCallback("view:<id>") показывает карточку потока', async () => {
    const { story } = makeViewStory(sampleStream, 0);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Python Advanced');
    expect(response.sendMessage?.text).toContain('Продвинутый курс');
  });

  test('на enrollment — кнопка «Записаться»', async () => {
    const { story } = makeViewStory(sampleStream, 0);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Записаться'))).toBe(true);
  });

  test('на active — кнопка «Записаться» скрыта', async () => {
    const activeStream = { ...sampleStream, status: 'active' };
    const { story } = makeViewStory(activeStream, 5);

    const response = await story.handleCallback(
      'view:a-a-a-a-a-a-a-a-a-a-a-a-a-a-a-a',
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Записаться'))).toBe(false);
  });

  test('GUEST на enrollment — кнопки «Записаться», «Программа», «Детали», «Студенты», «Назад»', async () => {
    const { story } = makeViewStory(sampleStream, 0);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Записаться'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Программа курса'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Детали'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Студенты'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Назад'))).toBe(true);
  });

  test('GUEST на active — кнопки «Программа курса» и «Детали» видны', async () => {
    const activeStream = { ...sampleStream, status: 'active' };
    const { story } = makeViewStory(activeStream, 0);

    const response = await story.handleCallback(
      'view:a-a-a-a-a-a-a-a-a-a-a-a-a-a-a-a',
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Программа курса'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Детали'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Уведомить'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Записаться'))).toBe(false);
  });

  test('STUDENT на enrollment — НЕ видит «Записаться»', async () => {
    const { story } = makeViewStory(sampleStream, 0);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      studentActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Записаться'))).toBe(false);
  });

  test('показывает имя ментора в карточке', async () => {
    const { story } = makeViewStory(sampleStream, 0);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Алексей Смирнов');
  });

  // ── Программа курса (видна на любом статусе) ──

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
    } as unknown as StreamApiModule;
    const appApi = {
      execute: mock((name: string) => {
        if (name === 'get-steps-by-lessons') return {};
        return undefined;
      }),
    } as unknown as U7BotApp;

    const story = new ViewStreamStory();
    story.init(moduleApi, appApi);

    const response = await story.handleCallback(
      'program:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Программа курса');
    expect(text).toContain('Основы');
    expect(text).toContain('Введение');
    expect(text).toContain('Переменные');
    expect(text).toContain('Продвинутый');
    expect(text).toContain('Асинхронность');
  });

  test('handleStart возвращает null (не в меню)', async () => {
    const story = new ViewStreamStory();
    const item = await story.handleStart(guestActor);
    expect(item).toBeNull();
  });

  // ── НЕТ менторских lifecycle-кнопок (curious-режим) ──

  test('MENTOR на своём enrollment — НЕ видит «Запустить» / «В архив»', async () => {
    const { story } = makeViewStory(sampleStream, 5);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    // Менторские lifecycle-кнопки убраны из curious-режима
    expect(btnTexts.some((t) => t.includes('Запустить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Завершить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('В архив'))).toBe(false);

    // Публичные кнопки видны всем
    expect(btnTexts.some((t) => t.includes('Студенты'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Детали'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Программа курса'))).toBe(true);
  });

  test('MENTOR на своём active — НЕ видит менторских кнопок', async () => {
    const activeStream = { ...sampleStream, status: 'active' };
    const { story } = makeViewStory(activeStream, 8);

    const response = await story.handleCallback(
      'view:a-a-a-a-a-a-a-a-a-a-a-a-a-a-a-a',
      mentorActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Завершить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('В архив'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Запустить'))).toBe(false);
  });

  test('MENTOR на чужом потоке — видит только публичные кнопки', async () => {
    const { story } = makeViewStory(sampleStream, 3);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      otherMentorActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Запустить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Завершить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('В архив'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Студенты'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Детали'))).toBe(true);
    expect(btnTexts.some((t) => t.includes('Программа курса'))).toBe(true);
  });

  test('ADMIN на чужом потоке — НЕ видит менторских lifecycle-кнопок', async () => {
    const { story } = makeViewStory(sampleStream, 5);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      adminActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];

    expect(btnTexts.some((t) => t.includes('Запустить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('Завершить'))).toBe(false);
    expect(btnTexts.some((t) => t.includes('В архив'))).toBe(false);
  });

  // ── Строчка «📚 Курс: Fullstack JS» ──

  test('карточка потока содержит строчку «📚 Курс: Fullstack JS» (техдолг)', async () => {
    const { story } = makeViewStory(sampleStream, 0);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      guestActor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('📚 Курс: Fullstack JS');
  });

  // ── Детали ──

  test('кнопка «📋 Детали» есть в карточке потока', async () => {
    const { story } = makeViewStory(sampleStream, 1);

    const response = await story.handleCallback(
      'view:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Детали'))).toBe(true);
  });

  test('нажатие «📋 Детали» — показывает заполненные поля', async () => {
    const { story } = makeViewStory(
      {
        ...sampleStream,
        goal: 'Научиться программировать',
        result: 'Свой проект',
        rules: 'Без списывания',
        targetAudience: 'Новички',
        additional: 'Дополнительно',
      },
      1,
    );

    const response = await story.handleCallback(
      'details:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Детали');
    expect(text).toContain('Научиться программировать');
    expect(text).toContain('Свой проект');
    expect(text).toContain('Без списывания');
    expect(text).toContain('Новички');
    expect(text).toContain('Дополнительно');
  });

  test('нажатие «Детали» на потоке без полей — заглушка', async () => {
    const { story } = makeViewStory(sampleStream, 1);

    const response = await story.handleCallback(
      'details:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const text = response.sendMessage?.text ?? '';
    expect(text).toContain('Расширенная информация');
  });

  test('кнопка «Назад к потоку» в деталях → возврат', async () => {
    const { story } = makeViewStory(sampleStream, 1);

    const response = await story.handleCallback(
      'details:s-s-s-s-s-s-s-s-s-s-s-s-s-s-s-s',
      mentorActor,
      session,
    );
    const btnTexts =
      response.sendMessage?.keyboard?.rows.flat().map((b) => b.text) ?? [];
    expect(btnTexts.some((t) => t.includes('Назад к потоку'))).toBe(true);
  });
});
