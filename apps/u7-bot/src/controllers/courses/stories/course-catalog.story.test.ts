import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { Routes } from '../../shared/routes';
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
  ) {
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
          return snapshots[attrs.moduleId as string] ?? [];
        }
        if (ucName === 'get-steps-by-lessons') {
          const result: Record<
            string,
            Array<{ uuid: string; description: string }>
          > = {};
          for (const id of attrs.lessonIds as string[]) {
            if (steps[id]) result[id] = steps[id]!;
          }
          return result;
        }
        return undefined;
      }),
    };
  }

  const mockUiApp = {
    getAction: mock(() => () => ({
      text: '↩️ Главное меню',
      code: 'app:main-menu',
    })),
    collectAllMenuItems: mock(() => []),
    collectAllHelpDescriptions: mock(() => []),
  } as never;

  function initStory(
    story: CourseCatalogStory,
    api: ReturnType<typeof makeAppApi>,
  ) {
    story.init({ appApi: api, uiApp: mockUiApp } as never);
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

  test('handleStart содержит описание для help', async () => {
    const story = new CourseCatalogStory();
    const item = await story.handleStart(actor);
    expect(item?.description).toContain('Программы курсов');
    expect(item?.description).toContain('каталог');
  });

  // ── Уровень 0: Курсы + этапы inline ──

  test('list: показывает курсы с этапами inline, без описаний', async () => {
    const appApi = makeAppApi([
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
    initStory(story, appApi);

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
    const appApi = makeAppApi([]);
    const story = new CourseCatalogStory();
    initStory(story, appApi);

    const response = await story.handleCallback('list', actor, session);
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('Пока нет доступных курсов');
  });

  test('list: заголовок «📖 *Курсы*»', async () => {
    const appApi = makeAppApi([
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
    initStory(story, appApi);

    const response = await story.handleCallback('list', actor, session);
    expect(response.sendMessage?.text).toContain('📖 *Курсы*');
  });

  // ── Уровень 1: Этапы + модули inline ──

  test('phases: этапы жирным, модули inline с числом проектов и уроков', async () => {
    const courseUuid = 'c2';
    const appApi = makeAppApi(
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
          projects: [{ uuid: 'p2', title: 'Сортировка', lessonIds: ['l3'] }],
        },
      },
    );

    const story = new CourseCatalogStory();
    initStory(story, appApi);

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
    const appApi = makeAppApi(
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
          projects: [{ uuid: 'pa', title: 'Проект 1', lessonIds: ['l1'] }],
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
    initStory(story, appApi);

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

    // Кнопка «Назад к курсу»
    expect(rows.some((r) => r[0]?.text?.includes('Назад к курсу'))).toBe(true);
  });

  // ── Уровень 3: Проекты + уроки inline (tree-renderer) ──

  test('projects: проекты жирным, уроки inline через tree-renderer', async () => {
    const courseUuid = 'c4';
    const appApi = makeAppApi(
      [
        {
          uuid: courseUuid,
          title: 'Course',
          description: '...',
          authorId: 'a',
          phases: [{ title: 'Основы', track: 'tech', moduleIds: ['m-x'] }],
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
              {
                lessonId: 'les-a',
                lessonTitle: 'HTML разметка',
                stepIds: ['s1', 's2'],
              },
              {
                lessonId: 'les-b',
                lessonTitle: 'CSS стили',
                stepIds: ['s3'],
              },
            ],
          },
          {
            projectId: 'proj-2',
            projectTitle: 'Chat',
            lessons: [
              {
                lessonId: 'les-c',
                lessonTitle: 'WebSocket',
                stepIds: ['s4'],
              },
            ],
          },
        ],
      },
    );

    const story = new CourseCatalogStory();
    initStory(story, appApi);

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

    // Кнопка «Назад к этапу»
    expect(rows.some((r) => r[0]?.text?.includes('Назад к этапу'))).toBe(true);
  });

  // ── Уровень 4: Уроки + заголовки шагов ──

  test('lessons: урок + шаги inline, тела скрыты', async () => {
    const courseUuid = 'c5';
    const appApi = makeAppApi(
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
              {
                lessonId: 'les-x',
                lessonTitle: 'Урок 1',
                stepIds: ['step-1', 'step-2'],
              },
              {
                lessonId: 'les-y',
                lessonTitle: 'Урок 2',
                stepIds: ['step-3'],
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
        'les-y': [{ uuid: 'step-3', description: 'Область видимости' }],
      },
    );

    const story = new CourseCatalogStory();
    initStory(story, appApi);

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

    // Кнопка «Назад к модулю»
    const rows = response.sendMessage?.keyboard?.rows ?? [];
    expect(rows.some((r) => r[0]?.text?.includes('Назад к модулю'))).toBe(true);
  });

  // ── Ошибки ──

  test('phases: несуществующий курс — ошибка', async () => {
    const appApi = makeAppApi([]);
    const story = new CourseCatalogStory();
    initStory(story, appApi);

    const response = await story.handleCallback(
      'phases:bad-uuid',
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('не найден');
  });

  test('modules: несуществующий курс — ошибка', async () => {
    const appApi = makeAppApi([]);
    const story = new CourseCatalogStory();
    initStory(story, appApi);

    const response = await story.handleCallback(
      'modules:bad:0',
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage?.text).toContain('не найден');
  });

  test('projects: несуществующий модуль — ошибка', async () => {
    const appApi = {
      execute: mock(async (ucName: string, _attrs: Record<string, unknown>) => {
        if (ucName === 'get-module-snapshot') {
          throw Object.assign(new Error('Модуль не найден'), {
            name: 'MODULE_NOT_FOUND',
          });
        }
        return undefined;
      }),
    };

    const story = new CourseCatalogStory();
    initStory(story, appApi as never);

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

    const appApi = makeAppApi(
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
              {
                lessonId: 'les-q',
                lessonTitle: 'Урок',
                stepIds: manySteps.map((s) => s.uuid),
              },
            ],
          },
        ],
      },
      { 'les-q': manySteps },
    );

    const story = new CourseCatalogStory();
    initStory(story, appApi);

    const response = await story.handleCallback(
      `lessons:${courseUuid}:0:m-w:0`,
      actor,
      session,
    );
    assertResponseMarkdownSafe(response);
    expect(response.sendMessage!.text!.length).toBeLessThanOrEqual(4100);
    expect(response.sendMessage?.text?.endsWith('\\.\\.\\.') ?? false).toBe(
      true,
    );
  });

  // ── Неизвестная команда ──

  test('неизвестная команда', async () => {
    const appApi = makeAppApi([]);
    const story = new CourseCatalogStory();
    initStory(story, appApi);

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

  // ── Запись на модуль (кнопка из уведомления о завершении) ──

  describe('wish — запись на модуль', () => {
    const moduleId = '33333333-3333-4333-8333-333333333333';

    function makeWishApi(error?: unknown) {
      return {
        execute: mock(
          async (ucName: string, _attrs: Record<string, unknown>) => {
            if (ucName === 'create-module-wish') {
              if (error) throw error;
              return undefined;
            }
            return undefined;
          },
        ),
      };
    }

    test('успех: вызывает create-module-wish и подтверждает', async () => {
      const api = makeWishApi();
      const story = new CourseCatalogStory();
      initStory(story, api as never);

      const response = await story.handleCallback(
        `wish:${moduleId}`,
        actor,
        session,
      );
      assertResponseMarkdownSafe(response);

      const call = (api.execute as ReturnType<typeof mock>).mock.calls.find(
        (c) => c[0] === 'create-module-wish',
      );
      expect(call).toBeDefined();
      expect(call![1]).toEqual({ moduleId });
      expect(call![2]).toBe(actor.uuid);

      expect(response.sendMessage?.text).toContain('Записали');
    });

    test('желание уже есть: дружелюбное сообщение, не ошибка', async () => {
      const { errConflict, AppException } = await import('@u7-scl/core/domain');
      const error = new AppException(
        errConflict('WISH_ALREADY_EXISTS', 'Желание уже выражено', undefined),
      );
      const api = makeWishApi(error);
      const story = new CourseCatalogStory();
      initStory(story, api as never);

      const response = await story.handleCallback(
        `wish:${moduleId}`,
        actor,
        session,
      );
      assertResponseMarkdownSafe(response);

      expect(response.sendMessage?.text).toContain('уже');
      expect(response.sendMessage?.text).not.toContain('⚠️');
    });

    test('другая ошибка: уходит в handleError', async () => {
      const { errNotFound, AppException } = await import('@u7-scl/core/domain');
      const error = new AppException(
        errNotFound('MODULE_NOT_FOUND', 'Модуль не найден', undefined),
      );
      const api = makeWishApi(error);
      const story = new CourseCatalogStory();
      initStory(story, api as never);

      const response = await story.handleCallback(
        `wish:${moduleId}`,
        actor,
        session,
      );
      assertResponseMarkdownSafe(response);

      expect(response.sendMessage?.text).toContain('⚠️');
    });
  });

  // ── Желание пройти курс (кнопка apply на карточке курса) ──

  describe('apply — желание пройти курс', () => {
    const courseId = 'c1';

    function makeApplyApi(result?: { outcome: string }, error?: unknown) {
      return {
        execute: mock(
          async (ucName: string, _attrs: Record<string, unknown>) => {
            if (ucName === 'create-course-wish') {
              if (error) throw error;
              return result;
            }
            return undefined;
          },
        ),
      };
    }

    function makeCatalogApi() {
      return makeAppApi([
        {
          uuid: courseId,
          title: 'JS Basics',
          description: '...',
          authorId: 'a',
          phases: [{ title: 'Синтаксис', track: 'tech', moduleIds: [] }],
          status: 'published',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ]);
    }

    test('list: кнопка «🎓 Хочу пройти курс» на карточке курса', async () => {
      const appApi = makeCatalogApi();
      const story = new CourseCatalogStory();
      initStory(story, appApi);

      const response = await story.handleCallback('list', actor, session);
      assertResponseMarkdownSafe(response);

      const rows = response.sendMessage?.keyboard?.rows ?? [];
      const applyBtn = rows
        .flat()
        .find((b) => b.text.includes('Хочу пройти курс'));
      expect(applyBtn).toBeDefined();
      expect(applyBtn!.code).toBe(`course-catalog:apply:${courseId}`);
    });

    test('apply instant: вызывает create-course-wish и рендерит W03', async () => {
      const appApi = makeApplyApi({ outcome: 'instant' });
      const story = new CourseCatalogStory();
      initStory(story, appApi as never);

      const response = await story.handleCallback(
        `apply:${courseId}`,
        actor,
        session,
      );
      assertResponseMarkdownSafe(response);

      const call = (appApi.execute as ReturnType<typeof mock>).mock.calls.find(
        (c) => c[0] === 'create-course-wish',
      );
      expect(call).toBeDefined();
      expect(call![1]).toEqual({ courseId });
      expect(call![2]).toBe(actor.uuid);

      const text = response.sendMessage?.text ?? '';
      expect(text).toContain('зафиксировано');
      expect(text).toContain('когда откроется набор');
      const rows = response.sendMessage?.keyboard?.rows ?? [];
      const menuBtn = rows.flat().find((b) => b.text.includes('Главное меню'));
      expect(menuBtn?.code).toBe(Routes.app.mainMenu);
    });

    test('apply questionnaire: пустой ответ — анкету рендерит FillStory', async () => {
      const appApi = makeApplyApi({ outcome: 'questionnaire' });
      const story = new CourseCatalogStory();
      initStory(story, appApi as never);

      const response = await story.handleCallback(
        `apply:${courseId}`,
        actor,
        session,
      );

      const call = (appApi.execute as ReturnType<typeof mock>).mock.calls.find(
        (c) => c[0] === 'create-course-wish',
      );
      expect(call).toBeDefined();
      // Стори ничего не отправляет — анкету проактивно рендерит FillStory
      expect(response.sendMessage).toBeUndefined();
      expect(response.sendMessages).toBeUndefined();
    });

    test.each([
      'expressed',
      'confirmed',
    ] as const)('apply конфликт %s: W04 с кнопкой отмены и меню', async (status) => {
      const { errConflict, AppException } = await import('@u7-scl/core/domain');
      const error = new AppException(
        errConflict('WISH_ALREADY_EXISTS', 'Желание уже выражено', {
          userId: actor.uuid,
          courseId,
          status,
        }),
      );
      const appApi = makeApplyApi(undefined, error);
      const story = new CourseCatalogStory();
      initStory(story, appApi as never);

      const response = await story.handleCallback(
        `apply:${courseId}`,
        actor,
        session,
      );
      assertResponseMarkdownSafe(response);

      const text = response.sendMessage?.text ?? '';
      expect(text).not.toContain('⚠️');
      const rows = response.sendMessage?.keyboard?.rows ?? [];
      const flat = rows.flat();
      expect(flat.some((b) => b.text.includes('Отменить желание'))).toBe(true);
      expect(
        flat.some((b) => b.code === `course-catalog:cancel:${courseId}`),
      ).toBe(true);
      expect(flat.some((b) => b.code === Routes.app.mainMenu)).toBe(true);
    });

    test.each([
      'expressed',
      'confirmed',
    ] as const)('apply конфликт %s: текст ветвится', async (status) => {
      const { errConflict, AppException } = await import('@u7-scl/core/domain');
      const error = new AppException(
        errConflict('WISH_ALREADY_EXISTS', 'Желание уже выражено', {
          userId: actor.uuid,
          courseId,
          status,
        }),
      );
      const appApi = makeApplyApi(undefined, error);
      const story = new CourseCatalogStory();
      initStory(story, appApi as never);

      const response = await story.handleCallback(
        `apply:${courseId}`,
        actor,
        session,
      );

      const text = response.sendMessage?.text ?? '';
      if (status === 'confirmed') {
        expect(text).toContain('обучаешься');
      } else {
        expect(text).toContain('выразил желание');
      }
    });

    test('apply конфликт pending: W04 — продолжить анкету', async () => {
      const { errConflict, AppException } = await import('@u7-scl/core/domain');
      const error = new AppException(
        errConflict('WISH_ALREADY_EXISTS', 'Желание уже выражено', {
          userId: actor.uuid,
          courseId,
          status: 'pending',
        }),
      );
      const appApi = makeApplyApi(undefined, error);
      const story = new CourseCatalogStory();
      initStory(story, appApi as never);

      const response = await story.handleCallback(
        `apply:${courseId}`,
        actor,
        session,
      );
      assertResponseMarkdownSafe(response);

      const text = response.sendMessage?.text ?? '';
      expect(text).toContain('начал заполнять анкету');
      expect(text).toContain('не закончил');
      const rows = response.sendMessage?.keyboard?.rows ?? [];
      const flat = rows.flat();
      const resumeBtn = flat.find((b) => b.text.includes('Продолжить анкету'));
      expect(resumeBtn?.code).toBe(`questionnaire:fill:resume:${courseId}`);
      expect(flat.some((b) => b.code === Routes.app.mainMenu)).toBe(true);
    });

    test('apply: другая ошибка (курс не найден) — уходит в handleError', async () => {
      const { errNotFound, AppException } = await import('@u7-scl/core/domain');
      const error = new AppException(
        errNotFound('COURSE_NOT_FOUND', 'Курс не найден', { courseId }),
      );
      const appApi = makeApplyApi(undefined, error);
      const story = new CourseCatalogStory();
      initStory(story, appApi as never);

      const response = await story.handleCallback(
        `apply:${courseId}`,
        actor,
        session,
      );
      assertResponseMarkdownSafe(response);

      expect(response.sendMessage?.text).toContain('⚠️');
    });
  });

  describe('cancel — отмена желания (W05)', () => {
    const courseId = 'c1';

    function makeCancelApi(error?: unknown) {
      return {
        execute: mock(
          async (ucName: string, _attrs: Record<string, unknown>) => {
            if (ucName === 'cancel-wish') {
              if (error) throw error;
              return undefined;
            }
            return undefined;
          },
        ),
      };
    }

    test('cancel: рендерит подтверждение W05 с кнопками Да/Отмена', async () => {
      const appApi = makeCancelApi();
      const story = new CourseCatalogStory();
      initStory(story, appApi as never);

      const response = await story.handleCallback(
        `cancel:${courseId}`,
        actor,
        session,
      );
      assertResponseMarkdownSafe(response);

      const text = response.sendMessage?.text ?? '';
      expect(text).toContain('Отменить желание пройти курс?');
      const rows = response.sendMessage?.keyboard?.rows ?? [];
      const flat = rows.flat();
      const yes = flat.find((b) => b.text.includes('Да'));
      expect(yes?.code).toBe(`course-catalog:cancel-confirm:${courseId}`);
      const no = flat.find((b) => b.text.includes('Отмена'));
      expect(no?.code).toBe(`course-catalog:phases:${courseId}`);
    });

    test('cancel-confirm: вызывает cancel-wish и сообщает об отмене', async () => {
      const appApi = makeCancelApi();
      const story = new CourseCatalogStory();
      initStory(story, appApi as never);

      const response = await story.handleCallback(
        `cancel-confirm:${courseId}`,
        actor,
        session,
      );
      assertResponseMarkdownSafe(response);

      const call = (appApi.execute as ReturnType<typeof mock>).mock.calls.find(
        (c) => c[0] === 'cancel-wish',
      );
      expect(call).toBeDefined();
      expect(call![1]).toEqual({ courseId });
      expect(call![2]).toBe(actor.uuid);

      const text = response.sendMessage?.text ?? '';
      expect(text).toContain('отменено');
      const rows = response.sendMessage?.keyboard?.rows ?? [];
      const menuBtn = rows.flat().find((b) => b.text.includes('Главное меню'));
      expect(menuBtn?.code).toBe(Routes.app.mainMenu);
    });

    test('cancel-confirm: WISH_NOT_FOUND — мягкое сообщение без ошибки', async () => {
      const { errNotFound, AppException } = await import('@u7-scl/core/domain');
      const error = new AppException(
        errNotFound('WISH_NOT_FOUND', 'Желание не найдено', {
          userId: actor.uuid,
          courseId,
        }),
      );
      const appApi = makeCancelApi(error);
      const story = new CourseCatalogStory();
      initStory(story, appApi as never);

      const response = await story.handleCallback(
        `cancel-confirm:${courseId}`,
        actor,
        session,
      );
      assertResponseMarkdownSafe(response);

      const text = response.sendMessage?.text ?? '';
      expect(text).not.toContain('⚠️');
      expect(text).toContain('уже нет');
    });
  });
});
