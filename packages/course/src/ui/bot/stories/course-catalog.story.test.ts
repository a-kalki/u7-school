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

  // Вспомогательная функция для создания moduleApi с курсами
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
  ): CourseApiModule {
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
    } as unknown as CourseApiModule;
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
    const moduleApi = makeModuleApi([
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
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback('list', actor, session);
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Программы курсов');
    expect(response.sendMessage?.text).toContain('JavaScript Basics');
    expect(response.sendMessage?.keyboard).toBeDefined();
  });

  test('handleCallback("list") с пустым списком курсов', async () => {
    const moduleApi = makeModuleApi([]);

    const story = new CourseCatalogStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback('list', actor, session);
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Пока нет доступных курсов');
  });

  test('handleCallback("view", uuid) показывает карточку курса', async () => {
    const courseUuid = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
    const moduleApi = makeModuleApi([
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
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      `view:${courseUuid}`,
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('JavaScript Basics');
    expect(response.sendMessage?.text).toContain('Основы программирования');
    expect(response.sendMessage?.text).toContain('Синтаксис');
    expect(response.sendMessage?.text).toContain('Алгоритмика');
    expect(response.sendMessage?.text).toContain('этап');
    expect(response.sendMessage?.keyboard).toBeDefined();
  });

  test('handleCallback("view", uuid) с несуществующим курсом показывает ошибку', async () => {
    const moduleApi = makeModuleApi([]);

    const story = new CourseCatalogStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      'view:nonexistent-uuid',
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('не найден');
  });

  test('handleCallback с неизвестным действием', async () => {
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
      { type: 'message', text: 'что-то', telegramId: 123 },
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Неизвестное');
  });

  test('handleCallback("list") добавляет «↩️ Главное меню» последней строкой', async () => {
    const moduleApi = makeModuleApi([
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
    story.init(moduleApi, emptyAppApi);

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
    const moduleApi = makeModuleApi([
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
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      `view:${courseUuid}`,
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('💻');
  });

  test('handleCallback("view") показывает эмодзи направления для business', async () => {
    const courseUuid = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
    const moduleApi = makeModuleApi([
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
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      `view:${courseUuid}`,
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('💼');
  });

  // ── S00b тесты: программа курса (drill-down) ──

  /** Расширенная фабрика: курсы + модули + снимки + шаги */
  function makeModuleApiFull(
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
          description: string;
          lessonIds: string[];
        }>;
      }
    >,
    moduleSnapshots: Record<
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
    >,
    stepsByLesson: Record<string, Array<{ uuid: string; description: string }>>,
  ): CourseApiModule {
    return {
      execute: mock(async (ucName: string, attrs: Record<string, unknown>) => {
        if (ucName === 'list-courses') return courses;
        if (ucName === 'get-course') {
          const found = courses.find((c) => c.uuid === attrs.uuid);
          if (!found)
            throw Object.assign(new Error('Курс не найден'), {
              name: 'COURSE_NOT_FOUND',
            });
          return found;
        }
        if (ucName === 'get-module') {
          const mod = modules[attrs.uuid as string];
          if (!mod)
            throw Object.assign(new Error('Модуль не найден'), {
              name: 'MODULE_NOT_FOUND',
            });
          return mod;
        }
        if (ucName === 'get-module-snapshot') {
          return moduleSnapshots[attrs.moduleId as string] ?? [];
        }
        if (ucName === 'get-steps-by-lessons') {
          const result: Record<
            string,
            Array<{ uuid: string; description: string }>
          > = {};
          for (const id of attrs.lessonIds as string[]) {
            if (stepsByLesson[id]) result[id] = stepsByLesson[id]!;
          }
          return result;
        }
        return undefined;
      }),
    } as unknown as CourseApiModule;
  }

  test('S00b: program:<courseId> показывает этапы с кнопками drill-down', async () => {
    const courseUuid = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    const moduleApi = makeModuleApiFull(
      [
        {
          uuid: courseUuid,
          title: 'JavaScript Basics',
          description: 'Основы JS',
          authorId: 'author-1',
          phases: [
            {
              title: 'Синтаксис',
              track: 'tech',
              moduleIds: ['mod-1', 'mod-2'],
            },
            { title: 'Алгоритмика', track: 'tech', moduleIds: ['mod-3'] },
          ],
          status: 'published',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      {},
      {},
      {},
    );

    const story = new CourseCatalogStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      `program:${courseUuid}`,
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('Программа');
    expect(response.sendMessage?.text).toContain('Синтаксис');
    expect(response.sendMessage?.text).toContain('Алгоритмика');
    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const phaseButtons = rows.filter((r) =>
      r[0]?.code?.startsWith('course-catalog:program:phase:'),
    );
    expect(phaseButtons.length).toBe(2);
  });

  test('S00b: program:phase:<id>:<idx> показывает модули этапа', async () => {
    const courseUuid = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
    const moduleApi = makeModuleApiFull(
      [
        {
          uuid: courseUuid,
          title: 'JS Course',
          description: '...',
          authorId: 'author-1',
          phases: [
            { title: 'Основы', track: 'tech', moduleIds: ['mod-a', 'mod-b'] },
          ],
          status: 'published',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      {
        'mod-a': {
          uuid: 'mod-a',
          title: 'Переменные',
          description: 'Типы',
          projects: [],
        },
        'mod-b': {
          uuid: 'mod-b',
          title: 'Функции',
          description: 'Вызов',
          projects: [],
        },
      },
      {},
      {},
    );

    const story = new CourseCatalogStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      `program:phase:${courseUuid}:0`,
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('Основы');
    expect(response.sendMessage?.text).toContain('Переменные');
    expect(response.sendMessage?.text).toContain('Функции');
    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const moduleButtons = rows.filter((r) =>
      r[0]?.code?.startsWith('course-catalog:program:module:'),
    );
    expect(moduleButtons.length).toBe(2);
  });

  test('S00b: program:module:<id> показывает проекты модуля', async () => {
    const moduleApi = makeModuleApiFull(
      [],
      {},
      {
        'mod-x': [
          {
            projectId: 'proj-1',
            projectTitle: 'Калькулятор',
            lessons: [
              { lessonId: 'les-1', lessonTitle: 'Введение', stepIds: ['st-1'] },
            ],
          },
        ],
      },
      {},
    );

    const story = new CourseCatalogStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      'program:module:mod-x',
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('Проекты');
    expect(response.sendMessage?.text).toContain('Калькулятор');
    expect(response.sendMessage?.text).toContain('1 урок');

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const projectButtons = rows.filter((r) =>
      r[0]?.code?.startsWith('course-catalog:program:project:'),
    );
    expect(projectButtons.length).toBe(1);
  });

  test('S00b: program:project:<id>:<pIdx> показывает уроки проекта', async () => {
    const moduleApi = makeModuleApiFull(
      [],
      {},
      {
        'mod-y': [
          {
            projectId: 'proj-1',
            projectTitle: 'ToDo App',
            lessons: [
              {
                lessonId: 'les-a',
                lessonTitle: 'HTML разметка',
                stepIds: ['s1', 's2'],
              },
              { lessonId: 'les-b', lessonTitle: 'CSS стили', stepIds: ['s3'] },
            ],
          },
        ],
      },
      {},
    );

    const story = new CourseCatalogStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      'program:project:mod-y:0',
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('ToDo App');
    expect(response.sendMessage?.text).toContain('HTML разметка');
    expect(response.sendMessage?.text).toContain('CSS стили');
    expect(response.sendMessage?.text).toContain('2 шага');
    expect(response.sendMessage?.text).toContain('1 шаг');

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const lessonButtons = rows.filter((r) =>
      r[0]?.code?.startsWith('course-catalog:program:lesson:'),
    );
    expect(lessonButtons.length).toBe(2);
  });

  test('S00b: program:lesson:<id>:<pIdx>:<lIdx> показывает заголовки шагов', async () => {
    const moduleApi = makeModuleApiFull(
      [],
      {},
      {
        'mod-z': [
          {
            projectId: 'proj-1',
            projectTitle: 'App',
            lessons: [
              {
                lessonId: 'les-x',
                lessonTitle: 'Урок 1',
                stepIds: ['step-1', 'step-2'],
              },
            ],
          },
        ],
      },
      {
        'les-x': [
          { uuid: 'step-1', description: 'Что такое переменные' },
          { uuid: 'step-2', description: 'Типы данных' },
        ],
      },
    );

    const story = new CourseCatalogStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      'program:lesson:mod-z:0:0',
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).toContain('Урок 1');
    expect(response.sendMessage?.text).toContain('Что такое переменные');
    expect(response.sendMessage?.text).toContain('Типы данных');
    expect(
      response.sendMessage?.keyboard?.rows?.some((r) =>
        r[0]?.text?.includes('Назад'),
      ),
    ).toBe(true);
  });

  test('S00b: тела шагов скрыты — только заголовки', async () => {
    const moduleApi = makeModuleApiFull(
      [],
      {},
      {
        'mod-w': [
          {
            projectId: 'proj-1',
            projectTitle: 'App',
            lessons: [
              { lessonId: 'les-q', lessonTitle: 'Урок', stepIds: ['step-1'] },
            ],
          },
        ],
      },
      { 'les-q': [{ uuid: 'step-1', description: 'Заголовок шага' }] },
    );

    const story = new CourseCatalogStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      'program:lesson:mod-w:0:0',
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);

    expect(response.sendMessage?.text).not.toContain('content');
    expect(response.sendMessage?.text).not.toContain('code');
    expect(response.sendMessage?.text).toContain('Заголовок шага');
  });

  test('S00b: несуществующий курс возвращает ошибку', async () => {
    const moduleApi = makeModuleApiFull([], {}, {}, {});
    const story = new CourseCatalogStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      'program:bad-uuid',
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('не найден');
  });

  test('S00b: phase с выходом за границы возвращает ошибку', async () => {
    const courseUuid = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
    const moduleApi = makeModuleApiFull(
      [
        {
          uuid: courseUuid,
          title: 'Course',
          description: '...',
          authorId: 'author-1',
          phases: [{ title: 'Phase', moduleIds: [] }],
          status: 'published',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
      {},
      {},
      {},
    );

    const story = new CourseCatalogStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      `program:phase:${courseUuid}:99`,
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('не найден');
  });

  test('S00b: кнопка «Развернуть программу» в S00a ведёт на program', async () => {
    const courseUuid = 'ffffffff-ffff-ffff-ffff-ffffffffffff';
    const moduleApi = makeModuleApi([
      {
        uuid: courseUuid,
        title: 'Курс',
        description: 'Описание',
        authorId: 'author-1',
        phases: [{ title: 'Phase 1', moduleIds: [] }],
        status: 'published',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);

    const story = new CourseCatalogStory();
    story.init(moduleApi, emptyAppApi);

    const response = await story.handleCallback(
      `view:${courseUuid}`,
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const programBtn = rows.find(
      (r) => r[0]?.text === '📖 Развернуть программу',
    );
    expect(programBtn).toBeDefined();
    expect(programBtn![0]!.code).toBe(`course-catalog:program:${courseUuid}`);
  });
});
