import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { BotSession } from '@u7-scl/core/ui';
import { assertDialogResponseMarkdownSafe } from '@u7-scl/core/ui';
import { Role } from '@u7-scl/user/domain';
import { Routes } from '../../shared/routes';
import { CourseCatalogStory } from './course-catalog.story';

describe('CourseCatalogStory', () => {
  const session: BotSession = {
    dialog: { path: 'course/course-catalog', seq: 1 },
  };
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
    wishes: Array<{
      userId: string;
      target:
        | { kind: 'course'; courseId: string }
        | { kind: 'module'; moduleId: string };
      status: string;
    }> = [],
  ) {
    return {
      execute: mock(
        async (
          ucName: string,
          attrs: Record<string, unknown>,
          actor?: User,
        ) => {
          if (ucName === 'list-courses') return courses;
          if (ucName === 'list-user-wishes') {
            return wishes.filter((w) => w.userId === actor?.uuid);
          }
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
        },
      ),
    };
  }

  function initStory(
    story: CourseCatalogStory,
    api: ReturnType<typeof makeAppApi>,
  ) {
    story.init({ appApi: api } as never);
  }

  // ── Главное меню (декларативные menuButtons) ──

  test('menuButtons возвращает кнопку главного меню (приоритет 10)', () => {
    const story = new CourseCatalogStory();
    const items = story.menuButtons(actor);
    expect(items).toHaveLength(1);
    const item = items[0];
    expect(item?.kind).toBe('callback');
    expect(item?.text).toContain('Программы курсов');
    expect(item?.priority).toBe(10);
    if (item?.kind === 'callback') {
      expect(item.action).toBe('course-catalog:list');
    }
  });

  test('menuButtons содержит описание для help', () => {
    const story = new CourseCatalogStory();
    const items = story.menuButtons(actor);
    expect(items[0]?.description).toContain('Программы курсов');
    expect(items[0]?.description).toContain('каталог');
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
    assertDialogResponseMarkdownSafe(response);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('Курсы');
    expect(text).toContain('JS Basics');
    expect(text).toContain('Синтаксис');
    expect(text).toContain('Практика');
    expect(text).toContain('модул');
    // Описание НЕ показывается
    expect(text).not.toContain('Описание курса');

    // Кнопка курса ведёт на phases:
    const rows = response.screen?.keyboard?.rows ?? [];
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
    assertDialogResponseMarkdownSafe(response);
    expect(String(response.screen?.text)).toContain(
      'Пока нет доступных курсов',
    );
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
    expect(String(response.screen?.text)).toContain('📖 *Курсы*');
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
    assertDialogResponseMarkdownSafe(response);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('Курс: Fullstack JS');
    expect(text).toContain('Синтаксис');
    expect(text).toContain('Алгоритмика');
    expect(text).toContain('Переменные');
    expect(text).toContain('1 проект');
    expect(text).toContain('2 урока');

    // Кнопки-этапы
    const rows = response.screen?.keyboard?.rows ?? [];
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
    assertDialogResponseMarkdownSafe(response);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('Этап: Синтаксис');
    expect(text).toContain('Модуль A');
    expect(text).toContain('Модуль B');
    expect(text).toContain('Проект 1');
    expect(text).toContain('Проект 2');
    expect(text).toContain('Проект 3');

    // Кнопки-модули
    const rows = response.screen?.keyboard?.rows ?? [];
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
    assertDialogResponseMarkdownSafe(response);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('Модуль: Модуль X');
    expect(text).toContain('Проект: ToDo App');
    expect(text).toContain('Урок: HTML разметка');
    expect(text).toContain('Урок: CSS стили');
    expect(text).toContain('Проект: Chat');
    expect(text).toContain('Урок: WebSocket');
    expect(text).toContain('ToDo App');
    expect(text).toContain('HTML разметка');
    expect(text).toContain('CSS стили');
    expect(text).toContain('Chat');
    expect(text).toContain('WebSocket');

    // Кнопки-проекты (не уроки!)
    const rows = response.screen?.keyboard?.rows ?? [];
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
    assertDialogResponseMarkdownSafe(response);
    const text = String(response.screen?.text ?? '');

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
    const rows = response.screen?.keyboard?.rows ?? [];
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
    assertDialogResponseMarkdownSafe(response);
    expect(String(response.screen?.text)).toContain('не найден');
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
    assertDialogResponseMarkdownSafe(response);
    expect(String(response.screen?.text)).toContain('не найден');
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
    assertDialogResponseMarkdownSafe(response);
    expect(String(response.screen?.text)).toContain('не найден');
  });

  // ── Обрезка длинных сообщений ──

  // Трек pagination ФР-5: обрезка #truncate удалена — экран остаётся
  // компактным за счёт лимита шагов урока (максимум 3 + многоточие)
  test('lessons: длинный урок — максимум 3 шага + многоточие, экран не раздувается', async () => {
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
    assertDialogResponseMarkdownSafe(response);
    const text = String(response.screen?.text ?? '');
    expect(text.length).toBeLessThanOrEqual(4100);
    expect(text.endsWith('\\.\\.\\.')).toBe(true);
  });

  // ── Неизвестная команда ──

  test('неизвестная команда', async () => {
    const appApi = makeAppApi([]);
    const story = new CourseCatalogStory();
    initStory(story, appApi);

    const response = await story.handleCallback('unknown', actor, session);
    assertDialogResponseMarkdownSafe(response);
    expect(String(response.screen?.text)).toContain('Неизвестная команда');
  });

  test('handleMessage — дефолт ядра (ввод без ожидания до стори не доходит)', async () => {
    const story = new CourseCatalogStory();
    const response = await story.handleMessage(
      { type: 'message', text: 'текст', telegramId: 123 },
      actor,
      session,
    );
    expect(String(response.notify?.text)).toContain('не принимаются');
    expect(response.release).toBe(true);
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
      assertDialogResponseMarkdownSafe(response);

      const call = (api.execute as ReturnType<typeof mock>).mock.calls.find(
        (c) => c[0] === 'create-module-wish',
      );
      expect(call).toBeDefined();
      expect(call![1]).toEqual({ moduleId });
      expect(call![2]).toBe(actor);

      expect(String(response.screen?.text)).toContain('Записали');
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
      assertDialogResponseMarkdownSafe(response);

      expect(String(response.screen?.text)).toContain('уже');
      expect(String(response.screen?.text)).not.toContain('⚠️');
    });

    test('другая ошибка: errorNotify — warn-реплика без захвата экрана', async () => {
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

      expect(response.notify?.kind).toBe('warn');
      expect(String(response.notify?.text)).toContain('не найден');
      expect(response.screen).toBeUndefined();
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

    function makeCatalogApi(
      wishes: Array<{
        userId: string;
        target:
          | { kind: 'course'; courseId: string }
          | { kind: 'module'; moduleId: string };
        status: string;
      }> = [],
    ) {
      return makeAppApi(
        [
          {
            uuid: courseId,
            title: 'JS Basics',
            description: '...',
            authorId: 'a',
            phases: [{ title: 'Синтаксис', track: 'tech', moduleIds: [] }],
            status: 'published',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
        {},
        {},
        {},
        wishes,
      );
    }

    test('list: кнопка «🎓 Хочу пройти курс» на карточке курса (желания нет)', async () => {
      const appApi = makeCatalogApi();
      const story = new CourseCatalogStory();
      initStory(story, appApi);

      const response = await story.handleCallback('list', actor, session);
      assertDialogResponseMarkdownSafe(response);

      const rows = response.screen?.keyboard?.rows ?? [];
      const applyBtn = rows
        .flat()
        .find((b) => b.text.includes('Хочу пройти курс'));
      expect(applyBtn).toBeDefined();
      expect(applyBtn!.code).toBe(`course-catalog:apply:${courseId}`);
    });

    test('list: expressed-желание → кнопка «🗑️ Отменить желание» (W05)', async () => {
      const appApi = makeCatalogApi([
        {
          userId: actor.uuid,
          target: { kind: 'course', courseId },
          status: 'expressed',
        },
      ]);
      const story = new CourseCatalogStory();
      initStory(story, appApi);

      const response = await story.handleCallback('list', actor, session);
      const buttons = (response.screen?.keyboard?.rows ?? []).flat();

      expect(
        buttons.some(
          (b) =>
            b.text.includes('Отменить желание') &&
            b.code === `course-catalog:cancel:${courseId}`,
        ),
      ).toBe(true);
      expect(buttons.some((b) => b.text.includes('Хочу пройти курс'))).toBe(
        false,
      );
    });

    test('list: confirmed-желание → кнопка «🗑️ Отменить желание»', async () => {
      const appApi = makeCatalogApi([
        {
          userId: actor.uuid,
          target: { kind: 'course', courseId },
          status: 'confirmed',
        },
      ]);
      const story = new CourseCatalogStory();
      initStory(story, appApi);

      const response = await story.handleCallback('list', actor, session);
      const buttons = (response.screen?.keyboard?.rows ?? []).flat();

      expect(buttons.some((b) => b.text.includes('Отменить желание'))).toBe(
        true,
      );
    });

    test('list: pending-желание → кнопка «📝 Продолжить анкету»', async () => {
      const appApi = makeCatalogApi([
        {
          userId: actor.uuid,
          target: { kind: 'course', courseId },
          status: 'pending',
        },
      ]);
      const story = new CourseCatalogStory();
      initStory(story, appApi);

      const response = await story.handleCallback('list', actor, session);
      const buttons = (response.screen?.keyboard?.rows ?? []).flat();

      const resumeBtn = buttons.find((b) =>
        b.text.includes('Продолжить анкету'),
      );
      expect(resumeBtn).toBeDefined();
      expect(resumeBtn!.code).toBe(`questionnaire:fill:resume:${courseId}`);
    });

    test('list: fulfilled-желание (обучение) → обычная кнопка «Хочу пройти курс»', async () => {
      const appApi = makeCatalogApi([
        {
          userId: actor.uuid,
          target: { kind: 'course', courseId },
          status: 'fulfilled',
        },
      ]);
      const story = new CourseCatalogStory();
      initStory(story, appApi);

      const response = await story.handleCallback('list', actor, session);
      const buttons = (response.screen?.keyboard?.rows ?? []).flat();

      expect(buttons.some((b) => b.text.includes('Хочу пройти курс'))).toBe(
        true,
      );
    });

    test('list: желание другого пользователя не влияет на кнопки', async () => {
      const appApi = makeCatalogApi([
        {
          userId: 'other-user',
          target: { kind: 'course', courseId },
          status: 'expressed',
        },
      ]);
      const story = new CourseCatalogStory();
      initStory(story, appApi);

      const response = await story.handleCallback('list', actor, session);
      const buttons = (response.screen?.keyboard?.rows ?? []).flat();

      expect(buttons.some((b) => b.text.includes('Хочу пройти курс'))).toBe(
        true,
      );
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
      assertDialogResponseMarkdownSafe(response);

      const call = (appApi.execute as ReturnType<typeof mock>).mock.calls.find(
        (c) => c[0] === 'create-course-wish',
      );
      expect(call).toBeDefined();
      expect(call![1]).toEqual({ courseId });
      expect(call![2]).toBe(actor);

      const text = String(response.screen?.text ?? '');
      expect(text).toContain('зафиксировано');
      expect(text).toContain('когда откроется набор');
      const rows = response.screen?.keyboard?.rows ?? [];
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
      expect(response.screen).toBeUndefined();
      expect(response.notify).toBeUndefined();
    });

    test.each(['expressed', 'confirmed'] as const)(
      'apply конфликт %s: W04 с кнопкой отмены и меню',
      async (status) => {
        const { errConflict, AppException } = await import(
          '@u7-scl/core/domain'
        );
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
        assertDialogResponseMarkdownSafe(response);

        const text = String(response.screen?.text ?? '');
        expect(text).not.toContain('⚠️');
        const rows = response.screen?.keyboard?.rows ?? [];
        const flat = rows.flat();
        expect(flat.some((b) => b.text.includes('Отменить желание'))).toBe(
          true,
        );
        expect(
          flat.some((b) => b.code === `course-catalog:cancel:${courseId}`),
        ).toBe(true);
        expect(flat.some((b) => b.code === Routes.app.mainMenu)).toBe(true);
      },
    );

    test.each(['expressed', 'confirmed'] as const)(
      'apply конфликт %s: текст ветвится',
      async (status) => {
        const { errConflict, AppException } = await import(
          '@u7-scl/core/domain'
        );
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

        const text = String(response.screen?.text ?? '');
        if (status === 'confirmed') {
          expect(text).toContain('обучаешься');
        } else {
          expect(text).toContain('выразил желание');
        }
      },
    );

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
      assertDialogResponseMarkdownSafe(response);

      const text = String(response.screen?.text ?? '');
      expect(text).toContain('начал заполнять анкету');
      expect(text).toContain('не закончил');
      const rows = response.screen?.keyboard?.rows ?? [];
      const flat = rows.flat();
      const resumeBtn = flat.find((b) => b.text.includes('Продолжить анкету'));
      expect(resumeBtn?.code).toBe(`questionnaire:fill:resume:${courseId}`);
      expect(flat.some((b) => b.code === Routes.app.mainMenu)).toBe(true);
    });

    test('apply: другая ошибка (курс не найден) — errorNotify (warn-реплика)', async () => {
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

      expect(response.notify?.kind).toBe('warn');
      expect(String(response.notify?.text)).toContain('не найден');
      expect(response.screen).toBeUndefined();
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
      assertDialogResponseMarkdownSafe(response);

      const text = String(response.screen?.text ?? '');
      expect(text).toContain('Отменить желание пройти курс?');
      const rows = response.screen?.keyboard?.rows ?? [];
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
      assertDialogResponseMarkdownSafe(response);

      const call = (appApi.execute as ReturnType<typeof mock>).mock.calls.find(
        (c) => c[0] === 'cancel-wish',
      );
      expect(call).toBeDefined();
      expect(call![1]).toEqual({ kind: 'course', courseId });
      expect(call![2]).toBe(actor);

      const text = String(response.screen?.text ?? '');
      expect(text).toContain('отменено');
      const rows = response.screen?.keyboard?.rows ?? [];
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
      assertDialogResponseMarkdownSafe(response);

      const text = String(response.screen?.text ?? '');
      expect(text).not.toContain('⚠️');
      expect(text).toContain('уже нет');
    });
  });

  describe('cancel-mod — отмена желания модуля (W05-M)', () => {
    const moduleId = '33333333-3333-4333-8333-333333333333';

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

    test('cancel-mod: рендерит подтверждение W05-M с кнопками Да/Отмена', async () => {
      const appApi = makeCancelApi();
      const story = new CourseCatalogStory();
      initStory(story, appApi as never);

      const response = await story.handleCallback(
        `cancel-mod:${moduleId}`,
        actor,
        session,
      );
      assertDialogResponseMarkdownSafe(response);

      const text = String(response.screen?.text ?? '');
      expect(text).toContain('Отменить желание пройти модуль?');
      const rows = response.screen?.keyboard?.rows ?? [];
      const flat = rows.flat();
      const yes = flat.find((b) => b.text.includes('Да'));
      expect(yes?.code).toBe(`course-catalog:cancel-mod-confirm:${moduleId}`);
      const no = flat.find((b) => b.text.includes('Отмена'));
      expect(no?.code).toBe(Routes.app.mainMenu);
    });

    test('cancel-mod-confirm: вызывает cancel-wish с вариантом module', async () => {
      const appApi = makeCancelApi();
      const story = new CourseCatalogStory();
      initStory(story, appApi as never);

      const response = await story.handleCallback(
        `cancel-mod-confirm:${moduleId}`,
        actor,
        session,
      );
      assertDialogResponseMarkdownSafe(response);

      const call = (appApi.execute as ReturnType<typeof mock>).mock.calls.find(
        (c) => c[0] === 'cancel-wish',
      );
      expect(call).toBeDefined();
      expect(call![1]).toEqual({ kind: 'module', moduleId });
      expect(call![2]).toBe(actor);

      const text = String(response.screen?.text ?? '');
      expect(text).toContain('отменено');
    });

    test('cancel-mod-confirm: WISH_NOT_FOUND — мягкое сообщение без ошибки', async () => {
      const { errNotFound, AppException } = await import('@u7-scl/core/domain');
      const error = new AppException(
        errNotFound('WISH_NOT_FOUND', 'Желание не найдено', {
          userId: actor.uuid,
          moduleId,
        }),
      );
      const appApi = makeCancelApi(error);
      const story = new CourseCatalogStory();
      initStory(story, appApi as never);

      const response = await story.handleCallback(
        `cancel-mod-confirm:${moduleId}`,
        actor,
        session,
      );
      assertDialogResponseMarkdownSafe(response);

      const text = String(response.screen?.text ?? '');
      expect(text).not.toContain('⚠️');
      expect(text).toContain('уже нет');
    });
  });

  // ── Пагинация уровней каталога (S00, трек pagination) ──

  describe('Пагинация уровней каталога (S00)', () => {
    /** Минимальная форма ответа для поиска кнопок. */
    interface ScreenLike {
      screen?: {
        text?: string;
        keyboard?: { rows: Array<Array<{ text: string; code: string }>> };
      };
    }

    function findBtn(response: ScreenLike, textContains: string) {
      return (response.screen?.keyboard?.rows ?? [])
        .flat()
        .find((b) => b.text.includes(textContains));
    }

    /** Длинный снапшот модуля: блок «проект с уроками» ~500 символов. */
    function longSnapshot(projectCount: number, lessonsPerProject: number) {
      return Array.from({ length: projectCount }, (_, p) => ({
        projectId: `p${p}`,
        projectTitle: `Тема ${p + 1}: Проектирование и реализация надёжных компонентов интерфейса пользователя`,
        lessons: Array.from({ length: lessonsPerProject }, (_, l) => ({
          lessonId: `l${p}-${l}`,
          lessonTitle: `Занятие ${p + 1}.${l + 1}: Разбор практических приёмов работы со сложным состоянием приложения`,
          stepIds: ['s1', 's2', 's3'],
        })),
      }));
    }

    /** Считает вызовы UC в appApi-моке. */
    function callsOf(api: ReturnType<typeof makeAppApi>, ucName: string) {
      return api.execute.mock.calls.filter((c) => c[0] === ucName).length;
    }

    test('уровень 3 (модуль): ≥3 страницы из целых проектов, полный цикл листания', async () => {
      const appApi = makeAppApi(
        [],
        {
          'big-mod': {
            uuid: 'big-mod',
            title: 'Большой модуль',
            description: '...',
            projects: [],
          },
        },
        { 'big-mod': longSnapshot(26, 4) },
      );
      const story = new CourseCatalogStory();
      initStory(story, appApi);

      const pageTexts: string[] = [];
      let response = await story.handleCallback(
        'projects:c1:0:big-mod',
        actor,
        session,
      );
      assertDialogResponseMarkdownSafe(response);
      pageTexts.push(String(response.screen?.text ?? ''));

      for (let i = 0; i < 10; i++) {
        const next = findBtn(response, 'След ›');
        if (!next) break;
        const pageSeg = next.code.split(':').pop() ?? '0';
        response = await story.handleCallback(
          `projects:c1:0:big-mod:${pageSeg}`,
          actor,
          session,
        );
        assertDialogResponseMarkdownSafe(response);
        pageTexts.push(String(response.screen?.text ?? ''));
      }

      expect(pageTexts.length).toBeGreaterThanOrEqual(3);
      const total = pageTexts.length;
      for (let i = 0; i < total; i++) {
        expect(pageTexts[i]).toContain('Модуль: Большой модуль');
        expect(pageTexts[i]).toContain(`Стр\\. ${i + 1}/${total}`);
      }

      // Все 26 проектов по порядку, каждый со всеми 4 уроками
      const projectLines = pageTexts
        .join('\n')
        .split('\n')
        .filter((l) => l.includes('Проект:'));
      expect(projectLines).toHaveLength(26);
      const lessonLines = pageTexts
        .join('\n')
        .split('\n')
        .filter((l) => l.includes('Урок:'));
      expect(lessonLines).toHaveLength(26 * 4);

      // Кнопки «След ›» несут номер страницы в коде
      expect(findBtn(response, '‹ Пред')?.code).toBe(
        `course-catalog:projects:c1:0:big-mod:${total - 2}`,
      );
    });

    test('уровень 3: кеш — листание не перечитывает снапшот модуля', async () => {
      const appApi = makeAppApi(
        [],
        {
          'big-mod': {
            uuid: 'big-mod',
            title: 'Большой модуль',
            description: '...',
            projects: [],
          },
        },
        { 'big-mod': longSnapshot(26, 4) },
      );
      const story = new CourseCatalogStory();
      initStory(story, appApi);

      await story.handleCallback('projects:c1:0:big-mod', actor, session);
      await story.handleCallback('projects:c1:0:big-mod:1', actor, session);
      await story.handleCallback('projects:c1:0:big-mod:0', actor, session);

      expect(callsOf(appApi, 'get-module-snapshot')).toBe(1);
    });

    test('уровень 1 короткий: одна страница — без навигации и индикатора', async () => {
      const appApi = makeAppApi([
        {
          uuid: 'c1',
          title: 'JS Basics',
          description: 'd',
          authorId: 'a',
          phases: [{ title: 'Синтаксис', moduleIds: ['m1'] }],
          status: 'published',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ]);
      const story = new CourseCatalogStory();
      initStory(story, appApi);

      const response = await story.handleCallback('phases:c1', actor, session);
      const text = String(response.screen?.text ?? '');
      expect(text).toContain('Синтаксис');
      expect(text).not.toContain('Стр');
      const btns =
        response.screen?.keyboard?.rows.flat().map((b) => b.text) ?? [];
      expect(btns.some((t) => t.includes('След'))).toBe(false);
      expect(btns.some((t) => t.includes('Пред'))).toBe(false);
    });

    test('уровень 0 (курсы): многостраничность, код list:<n>, clamp', async () => {
      // 10 курсов × 8 этапов — блок ~900 символов → ≥2 страницы
      const courses = Array.from({ length: 10 }, (_, i) => ({
        uuid: `cc${i}`,
        title: `Курс ${i + 1}: Полное руководство по современной разработке интерфейсов`,
        description: 'd',
        authorId: 'a',
        phases: Array.from({ length: 8 }, (_, ph) => ({
          title: `Этап ${ph + 1}: Основы проектирования интерактивных приложений`,
          moduleIds: ['m1', 'm2'],
        })),
        status: 'published',
        createdAt: '2026-01-01T00:00:00.000Z',
      }));
      const appApi = makeAppApi(courses);
      const story = new CourseCatalogStory();
      initStory(story, appApi);

      const first = await story.handleCallback('list', actor, session);
      assertDialogResponseMarkdownSafe(first);
      const firstText = String(first.screen?.text ?? '');
      expect(firstText).toContain('Стр\\. 1/');

      const next = findBtn(first, 'След ›');
      expect(next?.code).toBe('course-catalog:list:1');

      // Clamp: номер за пределами — последняя страница (без «След ›»)
      const clamped = await story.handleCallback('list:99', actor, session);
      const clampText = String(clamped.screen?.text ?? '');
      const m = /Стр\\. (\d+)\/(\d+)/.exec(clampText);
      expect(m?.[1]).toBe(m?.[2]);
      expect(findBtn(clamped, 'След ›')).toBeUndefined();
    });
  });
});
