import { describe, expect, mock, test } from 'bun:test';
import type { U7BotApp, User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModule } from 'packages/stream/src/api';
import { CourseCatalogStory } from './course-catalog.story';

describe('CourseCatalogStory', () => {
  const session: SessionData = { activeHandler: null };
  const actor: User = {
    uuid: 'user-1',
    name: 'Гость',
    telegramId: 123,
    roles: [Role.GUEST],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const emptyModuleApi = {
    execute: mock(() => undefined),
  } as unknown as StreamApiModule;

  // Вспомогательная функция для создания appApi с курсами
  function makeAppApi(
    courses: Array<{
      uuid: string;
      title: string;
      description: string;
      authorId: string;
      phases: Array<{
        title: string;
        track?: string;
        moduleIds: string[];
      }>;
      status: string;
      createdAt: string;
    }>,
  ): U7BotApp {
    return {
      execute: mock(async (ucName: string, attrs: Record<string, unknown>) => {
        if (ucName === 'list-courses') {
          return courses;
        }
        if (ucName === 'get-course') {
          const found = courses.find((c) => c.uuid === attrs.uuid);
          if (!found) {
            const err = new Error('Курс не найден');
            (err as unknown as Record<string, unknown>).kind = 'not-found';
            (err as unknown as Record<string, unknown>).message =
              'Курс не найден';
            (err as unknown as Record<string, unknown>).name =
              'COURSE_NOT_FOUND';
            throw err;
          }
          return found;
        }
        return undefined;
      }),
    } as unknown as U7BotApp;
  }

  test('handleStart возвращает кнопку главного меню', async () => {
    const story = new CourseCatalogStory();
    const item = await story.handleStart(actor);
    expect(item?.kind).toBe('callback');
    expect(item?.text).toContain('Программы курсов');
    expect(item?.priority).toBe(15);
    if (item?.kind === 'callback') {
      expect(item.action).toBe('course-catalog:list');
    }
  });

  test('handleHelpDescription возвращает описание', async () => {
    const story = new CourseCatalogStory();
    const desc = await story.handleHelpDescription(actor);
    expect(desc).toContain('Программы курсов');
    expect(desc).toContain('каталог');
  });

  test('handleCallback("list") показывает список курсов', async () => {
    const appApi = makeAppApi([
      {
        uuid: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        title: 'JavaScript Basics',
        description: 'Основы программирования на JavaScript',
        authorId: 'author-1',
        phases: [
          {
            title: 'Синтаксис',
            track: 'tech',
            moduleIds: ['mod-1', 'mod-2'],
          },
        ],
        status: 'published',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const story = new CourseCatalogStory();
    story.init(emptyModuleApi, appApi);

    const response = await story.handleCallback('list', actor, session);
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Программы курсов');
    expect(response.sendMessage?.text).toContain('JavaScript Basics');
    expect(response.sendMessage?.keyboard).toBeDefined();
  });

  test('handleCallback("list") с пустым списком курсов', async () => {
    const appApi = makeAppApi([]);

    const story = new CourseCatalogStory();
    story.init(emptyModuleApi, appApi);

    const response = await story.handleCallback('list', actor, session);
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Пока нет доступных курсов');
  });

  test('handleCallback("view", uuid) показывает карточку курса', async () => {
    const courseUuid = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const appApi = makeAppApi([
      {
        uuid: courseUuid,
        title: 'JavaScript Basics',
        description: 'Основы программирования на JavaScript',
        authorId: 'author-1',
        phases: [
          {
            title: 'Синтаксис',
            track: 'tech',
            moduleIds: ['mod-1'],
          },
          {
            title: 'Алгоритмика',
            track: 'tech',
            moduleIds: ['mod-2'],
          },
        ],
        status: 'published',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const story = new CourseCatalogStory();
    story.init(emptyModuleApi, appApi);

    const response = await story.handleCallback(
      `view:${courseUuid}`,
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('JavaScript Basics');
    expect(response.sendMessage?.text).toContain('Основы программирования');
    // Должны быть фазы
    expect(response.sendMessage?.text).toContain('Синтаксис');
    expect(response.sendMessage?.text).toContain('Алгоритмика');
    // Должна быть сводка объёма (N этапов)
    expect(response.sendMessage?.text).toContain('этап');
    // Должны быть кнопки навигации
    expect(response.sendMessage?.keyboard).toBeDefined();
  });

  test('handleCallback("view", uuid) с несуществующим курсом показывает ошибку', async () => {
    const appApi = makeAppApi([]);

    const story = new CourseCatalogStory();
    story.init(emptyModuleApi, appApi);

    const response = await story.handleCallback(
      'view:nonexistent-uuid',
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('не найден');
  });

  test('handleCallback с неизвестным действием', async () => {
    const appApi = makeAppApi([]);

    const story = new CourseCatalogStory();
    story.init(emptyModuleApi, appApi);

    const response = await story.handleCallback('unknown', actor, session);
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Неизвестная команда');
  });

  test('handleMessage возвращает заглушку', async () => {
    const story = new CourseCatalogStory();
    const response = await story.handleMessage(
      { type: 'message', text: 'что-то', telegramId: 123 },
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Неизвестное');
  });

  test('handleCallback("list") добавляет «↩️ Главное меню» последней строкой', async () => {
    const appApi = makeAppApi([
      {
        uuid: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        title: 'Course 1',
        description: 'Description 1',
        authorId: 'author-1',
        phases: [{ title: 'Phase 1', moduleIds: ['mod-1'] }],
        status: 'published',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const story = new CourseCatalogStory();
    story.init(emptyModuleApi, appApi);

    const response = await story.handleCallback('list', actor, session);
    assertResponseMarkdownSafe(response);

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    expect(rows.length).toBeGreaterThanOrEqual(1);
    const lastRow = rows[rows.length - 1]!;
    expect(lastRow).toHaveLength(1);
    expect(lastRow[0]!.text).toBe('↩️ Главное меню');
    expect(lastRow[0]!.code).toBe('app:main-menu');
  });

  test('handleCallback("view") показывает эмодзи направления для tech', async () => {
    const courseUuid = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    const appApi = makeAppApi([
      {
        uuid: courseUuid,
        title: 'Tech Course',
        description: 'Технический курс',
        authorId: 'author-1',
        phases: [{ title: 'Phase 1', track: 'tech', moduleIds: ['mod-1'] }],
        status: 'published',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const story = new CourseCatalogStory();
    story.init(emptyModuleApi, appApi);

    const response = await story.handleCallback(
      `view:${courseUuid}`,
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);
    // Должен быть эмодзи tech-направления
    expect(response.sendMessage?.text).toContain('💻');
  });

  test('handleCallback("view") показывает эмодзи направления для business', async () => {
    const courseUuid = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
    const appApi = makeAppApi([
      {
        uuid: courseUuid,
        title: 'Business Course',
        description: 'Бизнес-курс',
        authorId: 'author-1',
        phases: [{ title: 'Phase 1', track: 'business', moduleIds: ['mod-1'] }],
        status: 'published',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const story = new CourseCatalogStory();
    story.init(emptyModuleApi, appApi);

    const response = await story.handleCallback(
      `view:${courseUuid}`,
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);
    // Должен быть эмодзи business-направления
    expect(response.sendMessage?.text).toContain('💼');
  });
});
