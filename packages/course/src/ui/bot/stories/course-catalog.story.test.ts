import { describe, expect, mock, test } from 'bun:test';
import type { U7BotApp, User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import type { CourseApiModule } from 'packages/course/src/api';
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

  const emptyAppApi = {
    execute: mock(() => undefined),
  } as unknown as U7BotApp;

  function makeModuleApi(
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
    modules: Record<
      string,
      {
        uuid: string;
        title: string;
        description: string;
        projects: Array<{
          uuid: string;
          title: string;
          lessonIds: string[];
        }>;
      }
    > = {},
    snapshots: Record<
      string,
      Array<{
        projectId: string;
        projectTitle: string;
        lessons: Array<{
          lessonId: string;
          lessonTitle: string;
          stepIds: string[];
        }>;
      }>
    > = {},
    steps: Record<string, Array<{ uuid: string; description: string }>> = {},
  ): CourseApiModule {
    return {
      execute: mock(async (ucName: string, attrs: Record<string, unknown>) => {
        if (ucName === 'list-courses') return courses;
        if (ucName === 'get-course') {
          const found = courses.find((c) => c.uuid === attrs.uuid);
          if (!found) throw Object.assign(new Error('Курс не найден'), { name: 'COURSE_NOT_FOUND' });
          return found;
        }
        if (ucName === 'get-module') {
          const mod = modules[attrs.uuid as string];
          if (!mod) throw Object.assign(new Error('Модуль не найден'), { name: 'MODULE_NOT_FOUND' });
          return mod;
        }
        if (ucName === 'get-module-snapshot') {
          return snapshots[attrs.moduleId as string] ?? [];
        }
        if (ucName === 'get-steps-by-lessons') {
          const result: Record<string, Array<{ uuid: string; description: string }>> = {};
          for (const id of attrs.lessonIds as string[]) {
            if (steps[id]) result[id] = steps[id]!;
          }
          return result;
        }
        return undefined;
      }),
    } as unknown as CourseApiModule;
  }

  // ── Главное меню ──

  test('handleStart возвращает кнопку главного меню', async () => {
    const story = new CourseCatalogStory();
    const item = await story.handleStart(actor);
    expect(item?.kind).toBe('callback');
    expect(item?.text).toContain('Программы курсов');
    expect(item?.priority).toBe(10);
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

  // ── Уровень 0: Курсы + этапы inline ──

  test('list: показывает курсы с этапами inline, без описаний', async () => {
    const moduleApi = makeModuleApi([
      {
        uuid: 'c1',
        title: 'JS Basics',
        description: 'Описание курса — не должно быть видно',
        authorId: 'author-1',
        phases: [
          { title: 'Синтаксис', track: 'tech', moduleIds: ['m1', 'm2'] },
          { title: 'Практика', moduleIds: ['m3'] },
        ],
        status: 'published',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const story = new CourseCatalogStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback('list', actor, session);
    assertResponseMarkdownSafe(response);
    const text = response.sendMessage?.text ?? '';

    expect(text).toContain('Курсы');
    expect(text).toContain('JS Basics');
    expect(text).toContain('Синтаксис');
    expect(text).toContain('Практика');
    expect(text).toContain('модул');
    // Описание НЕ показывается
    expect(text).not.toContain('Описание курса');

    // Кнопка курса ведёт на phases:
    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const courseBtn = rows.find((r) => r[0]?.text?.includes('JS Basics'));
    expect(courseBtn).toBeDefined();
    expect(courseBtn![0]!.code).toBe('course-catalog:phases:c1');

    // Кнопка «Главное меню»
    const lastRow = rows[rows.length - 1]!;
    expect(lastRow[0]!.text).toBe('↩️ Главное меню');
  });

  test('list: пустой список', async () => {
    const moduleApi = makeModuleApi([]);
    const story = new CourseCatalogStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback('list', actor, session);
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Пока нет доступных курсов');
  });

  test('list: заголовок «📖 *Курсы*»', async () => {
    const moduleApi = makeModuleApi([
      {
        uuid: 'c1',
        title: 'Course',
        description: 'Desc',
        authorId: 'a',
        phases: [{ title: 'Phase', moduleIds: [] }],
        status: 'published',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    const story = new CourseCatalogStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback('list', actor, session);
    expect(response.sendMessage?.text).toContain('📖 *Курсы*');
  });

  // ── Уровень 1: Этапы + модули inline ──

  test('phases: этапы жирным, модули inline с числом проектов и уроков', async () => {
    const courseUuid = 'c2';
    const moduleApi = makeModuleApi(
      [
        {
          uuid: courseUuid,
          title: 'Fullstack JS',
          description: '...',
          authorId: 'a',
          phases: [
            { title: 'Синтаксис', track: 'tech', moduleIds: ['m-1'] },
            { title: 'Алгоритмика', track: 'tech', moduleIds: ['m-2'] },
          ],
          status: 'published',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      {
        'm-1': {
          uuid: 'm-1',
          title: 'Переменные',
          description: '...',
          projects: [
            { uuid: 'p1', title: 'Введение', lessonIds: ['l1', 'l2'] },
          ],
        },
        'm-2': {
          uuid: 'm-2',
          title: 'Алгоритмы',
          description: '...',
          projects: [
            { uuid: 'p2', title: 'Сортировка', lessonIds: ['l3'] },
          ],
        },
      },
    );

    const story = new CourseCatalogStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      `phases:${courseUuid}`,
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);
    const text = response.sendMessage?.text ?? '';

    expect(text).toContain('Курс: Fullstack JS');
    expect(text).toContain('Синтаксис');
    expect(text).toContain('Алгоритмика');
    expect(text).toContain('Переменные');
    expect(text).toContain('1 проект');
    expect(text).toContain('2 урока');

    // Кнопки-этапы
    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const syntaxBtn = rows.find((r) => r[0]?.text?.includes('Синтаксис'));
    expect(syntaxBtn).toBeDefined();
    expect(syntaxBtn![0]!.code).toBe(`course-catalog:modules:${courseUuid}:0`);

    // Кнопка «Назад к курсам»
    expect(rows.some((r) => r[0]?.text?.includes('Назад к курсам'))).toBe(true);
  });

  // ── Уровень 2: Модули + проекты inline ──

  test('modules: модули жирным, проекты inline', async () => {
    const courseUuid = 'c3';
    const moduleApi = makeModuleApi(
      [
        {
          uuid: courseUuid,
          title: 'Course',
          description: '...',
          authorId: 'a',
          phases: [
            {
              title: 'Синтаксис',
              track: 'tech',
              moduleIds: ['m-a', 'm-b'],
            },
          ],
          status: 'published',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      {
        'm-a': {
          uuid: 'm-a',
          title: 'Модуль A',
          description: '...',
          projects: [
            { uuid: 'pa', title: 'Проект 1', lessonIds: ['l1'] },
          ],
        },
        'm-b': {
          uuid: 'm-b',
          title: 'Модуль B',
          description: '...',
          projects: [
            { uuid: 'pb', title: 'Проект 2', lessonIds: ['l2', 'l3'] },
            { uuid: 'pc', title: 'Проект 3', lessonIds: ['l4'] },
          ],
        },
      },
    );

    const story = new CourseCatalogStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      `modules:${courseUuid}:0`,
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);
    const text = response.sendMessage?.text ?? '';

    expect(text).toContain('Этап: Синтаксис');
    expect(text).toContain('Модуль A');
    expect(text).toContain('Модуль B');
    expect(text).toContain('Проект 1');
    expect(text).toContain('Проект 2');
    expect(text).toContain('Проект 3');

    // Кнопки-модули
    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const modABtn = rows.find((r) => r[0]?.text?.includes('Модуль A'));
    expect(modABtn).toBeDefined();
    expect(modABtn![0]!.code).toBe(
      `course-catalog:projects:${courseUuid}:0:m-a`,
    );

    // Кнопка «Назад к этапам»
    expect(rows.some((r) => r[0]?.text?.includes('Назад к этапам'))).toBe(true);
  });

  // ── Уровень 3: Проекты + уроки inline ──

  test('projects: проекты жирным, уроки inline', async () => {
    const courseUuid = 'c4';
    const moduleApi = makeModuleApi(
      [
        {
          uuid: courseUuid,
          title: 'Course',
          description: '...',
          authorId: 'a',
          phases: [
            { title: 'Основы', track: 'tech', moduleIds: ['m-x'] },
          ],
          status: 'published',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      {
        'm-x': {
          uuid: 'm-x',
          title: 'Модуль X',
          description: '...',
          projects: [],
        },
      },
      {
        'm-x': [
          {
            projectId: 'proj-1',
            projectTitle: 'ToDo App',
            lessons: [
              { lessonId: 'les-a', lessonTitle: 'HTML разметка', stepIds: ['s1', 's2'] },
              { lessonId: 'les-b', lessonTitle: 'CSS стили', stepIds: ['s3'] },
            ],
          },
          {
            projectId: 'proj-2',
            projectTitle: 'Chat',
            lessons: [
              { lessonId: 'les-c', lessonTitle: 'WebSocket', stepIds: ['s4'] },
            ],
          },
        ],
      },
    );

    const story = new CourseCatalogStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      `projects:${courseUuid}:0:m-x`,
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);
    const text = response.sendMessage?.text ?? '';

    expect(text).toContain('Модуль: Модуль X');
    expect(text).toContain('ToDo App');
    expect(text).toContain('HTML разметка');
    expect(text).toContain('CSS стили');
    expect(text).toContain('Chat');
    expect(text).toContain('WebSocket');

    // Кнопки-проекты (не уроки!)
    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const projectBtn = rows.find((r) => r[0]?.text?.includes('ToDo App'));
    expect(projectBtn).toBeDefined();
    expect(projectBtn![0]!.code).toBe(
      `course-catalog:lessons:${courseUuid}:0:m-x:0`,
    );

    // Кнопка «Назад к модулям»
    expect(rows.some((r) => r[0]?.text?.includes('Назад к модулям'))).toBe(
      true,
    );
  });

  // ── Уровень 4: Уроки + заголовки шагов ──

  test('lessons: урок + шаги inline, тела скрыты', async () => {
    const courseUuid = 'c5';
    const moduleApi = makeModuleApi(
      [
        {
          uuid: courseUuid,
          title: 'Course',
          description: '...',
          authorId: 'a',
          phases: [{ title: 'Phase', moduleIds: ['m-z'] }],
          status: 'published',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      {},
      {
        'm-z': [
          {
            projectId: 'proj-1',
            projectTitle: 'App',
            lessons: [
              { lessonId: 'les-x', lessonTitle: 'Урок 1', stepIds: ['step-1', 'step-2'] },
              { lessonId: 'les-y', lessonTitle: 'Урок 2', stepIds: ['step-3'] },
            ],
          },
        ],
      },
      {
        'les-x': [
          { uuid: 'step-1', description: 'Что такое переменные' },
          { uuid: 'step-2', description: 'Типы данных' },
        ],
        'les-y': [
          { uuid: 'step-3', description: 'Область видимости' },
        ],
      },
    );

    const story = new CourseCatalogStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      `lessons:${courseUuid}:0:m-z:0`,
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);
    const text = response.sendMessage?.text ?? '';

    expect(text).toContain('Проект: App');
    expect(text).toContain('Урок 1');
    expect(text).toContain('Что такое переменные');
    expect(text).toContain('Типы данных');
    expect(text).toContain('Урок 2');
    expect(text).toContain('Область видимости');
    // Тела скрыты
    expect(text).not.toContain('content');
    expect(text).not.toContain('code');

    // Кнопка «Назад к проектам»
    const rows = response.sendMessage?.keyboard?.rows ?? [];
    expect(rows.some((r) => r[0]?.text?.includes('Назад к проектам'))).toBe(
      true,
    );
  });

  // ── Ошибки ──

  test('phases: несуществующий курс — ошибка', async () => {
    const moduleApi = makeModuleApi([]);
    const story = new CourseCatalogStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback('phases:bad-uuid', actor, session);
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('не найден');
  });

  test('modules: несуществующий курс — ошибка', async () => {
    const moduleApi = makeModuleApi([]);
    const story = new CourseCatalogStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback('modules:bad:0', actor, session);
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('не найден');
  });

  test('projects: несуществующий модуль — ошибка', async () => {
    // Мок, который выбрасывает ошибку для get-module-snapshot
    const moduleApi = {
      execute: mock(async (ucName: string, _attrs: Record<string, unknown>) => {
        if (ucName === 'get-module-snapshot') {
          throw Object.assign(new Error('Модуль не найден'), { name: 'MODULE_NOT_FOUND' });
        }
        return undefined;
      }),
    } as unknown as CourseApiModule;

    const story = new CourseCatalogStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      'projects:c1:0:bad',
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('не найден');
  });

  // ── Обрезка длинных сообщений ──

  test('длинные сообщения обрезаются на ~4000 символов', async () => {
    const courseUuid = 'c-big';
    const manySteps = Array.from({ length: 100 }, (_, i) => ({
      uuid: `step-${i}`,
      description: `Шаг номер ${i + 1} — очень подробное описание которое занимает много символов`,
    }));

    const moduleApi = makeModuleApi(
      [
        {
          uuid: courseUuid,
          title: 'Course',
          description: '...',
          authorId: 'a',
          phases: [{ title: 'Phase', moduleIds: ['m-w'] }],
          status: 'published',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      {},
      {
        'm-w': [
          {
            projectId: 'proj-1',
            projectTitle: 'App',
            lessons: [
              { lessonId: 'les-q', lessonTitle: 'Урок', stepIds: manySteps.map((s) => s.uuid) },
            ],
          },
        ],
      },
      { 'les-q': manySteps },
    );

    const story = new CourseCatalogStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      `lessons:${courseUuid}:0:m-w:0`,
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage!.text!.length).toBeLessThanOrEqual(4100);
    expect(response.sendMessage?.text?.endsWith('\\.\\.\\.') ?? false).toBe(true);
  });

  // ── Неизвестная команда ──

  test('неизвестная команда', async () => {
    const moduleApi = makeModuleApi([]);
    const story = new CourseCatalogStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback('unknown', actor, session);
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Неизвестная команда');
  });

  test('handleMessage возвращает заглушку', async () => {
    const story = new CourseCatalogStory();
    const response = await story.handleMessage(
      { type: 'message', text: 'текст', telegramId: 123 },
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Неизвестное');
  });
});
