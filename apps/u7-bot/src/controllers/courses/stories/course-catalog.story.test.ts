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

  test('menuButtons возвращает кнопку главного меню (приоритет 12, «📖 Курсы»)', async () => {
    const story = new CourseCatalogStory();
    const items = await story.menuButtons(actor);
    expect(items).toHaveLength(1);
    const item = items[0];
    expect(item?.kind).toBe('callback');
    expect(item?.text).toBe('📖 Курсы');
    expect(item?.priority).toBe(12);
    if (item?.kind === 'callback') {
      expect(item.action).toBe('course-catalog:list');
    }
  });

  test('menuButtons содержит описание для help', async () => {
    const story = new CourseCatalogStory();
    const items = await story.menuButtons(actor);
    expect(items[0]?.description).toBe(
      '📖 Курсы — каталог учебных курсов и их структура',
    );
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

    // Кнопка этапа ведёт на phase:
    const rows = response.screen?.keyboard?.rows ?? [];
    const phaseBtn = rows.find((r) => r[0]?.text?.includes('Синтаксис'));
    expect(phaseBtn).toBeDefined();
    expect(phaseBtn![0]!.code).toBe('course-catalog:phase:c1:0');

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

  // ── Уровень 1: Этап + модули подуровнем ──

  test('phase: модули жирным, проекты подуровнем', async () => {
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
      `phase:${courseUuid}:0`,
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('Курс 1/1: Fullstack JS');
    expect(text).toContain('Этап 1/2: Синтаксис');
    expect(text).toContain('Переменные');

    // Кнопки-модули
    const rows = response.screen?.keyboard?.rows ?? [];
    const modBtn = rows.find((r) => r[0]?.text?.includes('Переменные'));
    expect(modBtn).toBeDefined();
    expect(modBtn![0]!.code).toBe(`course-catalog:module:${courseUuid}:0:m-1`);

    // Кнопка «Назад к курсу»
    expect(rows.some((r) => r[0]?.text?.includes('Назад к курсу'))).toBe(true);
  });

  // ── Уровень 2: Модуль + проекты подуровнем ──

  test('module: проекты жирным, уроки подуровнем', async () => {
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
              moduleIds: ['m-a'],
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
          projects: [],
        },
      },
      {
        'm-a': [
          {
            projectId: 'pa',
            projectTitle: 'Проект 1',
            lessons: [
              { lessonId: 'l1', lessonTitle: 'Урок 1', stepIds: ['s1'] },
            ],
          },
        ],
      },
    );

    const story = new CourseCatalogStory();
    initStory(story, appApi);

    const response = await story.handleCallback(
      `module:${courseUuid}:0:m-a`,
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('Этап 1/1: Синтаксис');
    expect(text).toContain('Модуль 1/1: Модуль A');
    expect(text).toContain('Проект 1');

    // Кнопки-проекты
    const rows = response.screen?.keyboard?.rows ?? [];
    const projBtn = rows.find((r) => r[0]?.text?.includes('Проект 1'));
    expect(projBtn).toBeDefined();
    expect(projBtn![0]!.code).toBe(`course-catalog:prj:${courseUuid}:m-a:pa`);

    // Кнопка «Назад к этапу»
    expect(rows.some((r) => r[0]?.text?.includes('Назад к этапу'))).toBe(true);
  });

  // ── Уровень 3: Проект + уроки с шагами-заголовками подуровнем ──

  test('project: уроки жирным, шаги-заголовки подуровнем', async () => {
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
                stepIds: ['s1'],
              },
              {
                lessonId: 'les-b',
                lessonTitle: 'CSS стили',
                stepIds: ['s2'],
              },
            ],
          },
        ],
      },
      {
        'les-a': [{ uuid: 's1', description: 'Структура DOM' }],
        'les-b': [{ uuid: 's2', description: 'Селекторы' }],
      },
    );

    const story = new CourseCatalogStory();
    initStory(story, appApi);

    const response = await story.handleCallback(
      `project:${courseUuid}:0:m-x:proj-1`,
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('Модуль 1/1: Модуль X');
    expect(text).toContain('Проект 1/1: ToDo App');
    expect(text).toContain('HTML разметка');
    expect(text).toContain('CSS стили');

    // Кнопки-уроки
    const rows = response.screen?.keyboard?.rows ?? [];
    const lessonBtn = rows.find((r) => r[0]?.text?.includes('HTML разметка'));
    expect(lessonBtn).toBeDefined();
    expect(lessonBtn![0]!.code).toBe(
      `course-catalog:les:${courseUuid}:proj-1:les-a`,
    );

    // Кнопка «Назад к модулю»
    expect(rows.some((r) => r[0]?.text?.includes('Назад к модулю'))).toBe(true);
  });

  // ── Уровень 4: Урок (шаги только заголовками, закрытый уровень) ──

  test('lesson: шаги только заголовками, входа в шаг нет', async () => {
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
      {
        'm-z': {
          uuid: 'm-z',
          title: 'Модуль Z',
          description: '...',
          projects: [],
        },
      },
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
    initStory(story, appApi);

    const response = await story.handleCallback(
      `lesson:${courseUuid}:0:m-z:proj-1:les-x`,
      actor,
      session,
    );
    assertDialogResponseMarkdownSafe(response);
    const text = String(response.screen?.text ?? '');

    expect(text).toContain('Проект 1/1: App');
    expect(text).toContain('Урок 1/1: Урок 1');
    expect(text).toContain('Что такое переменные');
    expect(text).toContain('Типы данных');

    // Кнопок шагов на клавиатуре НЕТ
    const rows = response.screen?.keyboard?.rows ?? [];
    const flatBtns = rows.flat();
    expect(flatBtns.some((b) => b.text.includes('Что такое переменные'))).toBe(
      false,
    );
    expect(flatBtns.some((b) => b.text.includes('Типы данных'))).toBe(false);

    // Кнопка «Назад к проекту»
    expect(flatBtns.some((b) => b.text.includes('Назад к проекту'))).toBe(true);
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
        if (ucName === 'list-courses') {
          return [
            {
              uuid: 'c1',
              title: 'C',
              phases: [{ title: 'P', moduleIds: ['bad'] }],
            },
          ];
        }
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
      expect(no?.code).toBe(`course-catalog:course:${courseId}`);
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

  // ── Навигация: листание соседних сущностей (drill-down) ──

  describe('Листание соседей (drill-down навигация)', () => {
    test('листание курсов: ◀️ Пред. курс / След. курс ▶️', async () => {
      const courses = [
        {
          uuid: 'c-1',
          title: 'Первый курс',
          description: 'd1',
          authorId: 'a',
          phases: [{ title: 'Этап 1', moduleIds: [] }],
          status: 'published',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          uuid: 'c-2',
          title: 'Второй курс',
          description: 'd2',
          authorId: 'a',
          phases: [{ title: 'Этап 2', moduleIds: [] }],
          status: 'published',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ];
      const appApi = makeAppApi(courses);
      const story = new CourseCatalogStory();
      initStory(story, appApi);

      // Карточка первого курса: есть «След. курс ▶️», нет «◀️ Пред. курс»
      const first = await story.handleCallback('list', actor, session);
      assertDialogResponseMarkdownSafe(first);
      const firstBtns = first.screen?.keyboard?.rows.flat() ?? [];
      const nextCourseBtn = firstBtns.find((b) =>
        b.text.includes('След. курс'),
      );
      expect(nextCourseBtn).toBeDefined();
      expect(nextCourseBtn?.code).toBe('course-catalog:course:c-2');
      expect(firstBtns.some((b) => b.text.includes('Пред. курс'))).toBe(false);

      // Карточка второго курса: есть «◀️ Пред. курс», нет «След. курс ▶️»
      const second = await story.handleCallback('course:c-2', actor, session);
      assertDialogResponseMarkdownSafe(second);
      const secondBtns = second.screen?.keyboard?.rows.flat() ?? [];
      const prevCourseBtn = secondBtns.find((b) =>
        b.text.includes('Пред. курс'),
      );
      expect(prevCourseBtn).toBeDefined();
      expect(prevCourseBtn?.code).toBe('course-catalog:course:c-1');
      expect(secondBtns.some((b) => b.text.includes('След. курс'))).toBe(false);
    });

    test('листание этапов: ◀️ Пред. этап / След. этап ▶️', async () => {
      const appApi = makeAppApi([
        {
          uuid: 'c-1',
          title: 'Курс с 2 этапами',
          description: 'd',
          authorId: 'a',
          phases: [
            { title: 'Этап 1', moduleIds: [] },
            { title: 'Этап 2', moduleIds: [] },
          ],
          status: 'published',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ]);
      const story = new CourseCatalogStory();
      initStory(story, appApi);

      const respPhase0 = await story.handleCallback(
        'phase:c-1:0',
        actor,
        session,
      );
      assertDialogResponseMarkdownSafe(respPhase0);
      const btns0 = respPhase0.screen?.keyboard?.rows.flat() ?? [];
      const nextPhaseBtn = btns0.find((b) => b.text.includes('След. этап'));
      expect(nextPhaseBtn).toBeDefined();
      expect(nextPhaseBtn?.code).toBe('course-catalog:phase:c-1:1');

      const respPhase1 = await story.handleCallback(
        'phase:c-1:1',
        actor,
        session,
      );
      assertDialogResponseMarkdownSafe(respPhase1);
      const btns1 = respPhase1.screen?.keyboard?.rows.flat() ?? [];
      const prevPhaseBtn = btns1.find((b) => b.text.includes('Пред. этап'));
      expect(prevPhaseBtn).toBeDefined();
      expect(prevPhaseBtn?.code).toBe('course-catalog:phase:c-1:0');
    });

    test('drill-down сохраняет контекст курса, если модуль входит в несколько курсов', async () => {
      const sharedModId = 'shared-mod';
      const courses = [
        {
          uuid: 'course-first',
          title: 'Основы программирования',
          description: 'Первый курс',
          authorId: 'a',
          phases: [{ title: 'Этап 1', moduleIds: [sharedModId] }],
          status: 'published',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          uuid: 'course-second',
          title: 'Тест курс (v2)',
          description: 'Второй курс',
          authorId: 'a',
          phases: [{ title: 'Этап 1', moduleIds: [sharedModId] }],
          status: 'published',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ];
      const appApi = makeAppApi(
        courses,
        {
          [sharedModId]: {
            uuid: sharedModId,
            title: 'Общий модуль',
            description: '...',
            projects: [],
          },
        },
        {
          [sharedModId]: [
            {
              projectId: 'proj-1',
              projectTitle: 'Тестовый проект',
              lessons: [
                {
                  lessonId: 'les-1',
                  lessonTitle: 'Тестовый урок',
                  stepIds: ['s1'],
                },
              ],
            },
          ],
        },
        {
          'les-1': [{ uuid: 's1', description: 'Шаг 1' }],
        },
      );

      const story = new CourseCatalogStory();
      initStory(story, appApi);

      // 1. Заходим в проект второго курса по новому адресу prj:courseId:modId:projId
      const projResp = await story.handleCallback(
        `prj:course-second:${sharedModId}:proj-1`,
        actor,
        session,
      );
      assertDialogResponseMarkdownSafe(projResp);
      const projText = String(projResp.screen?.text ?? '');
      // Должен быть именно второй курс «Тест курс (v2)», а не первый!
      expect(projText).toContain('Тест курс');
      expect(projText).not.toContain('Основы программирования');

      // Кнопка «Назад к модулю» должна вести во второй курс
      const projBtns = projResp.screen?.keyboard?.rows.flat() ?? [];
      const backToModBtn = projBtns.find((b) =>
        b.text.includes('Назад к модулю'),
      );
      expect(backToModBtn).toBeDefined();
      expect(backToModBtn?.code).toContain('course-second');

      // 2. Переходим в урок второго курса
      const lesResp = await story.handleCallback(
        `les:course-second:proj-1:les-1`,
        actor,
        session,
      );
      assertDialogResponseMarkdownSafe(lesResp);
      const lesText = String(lesResp.screen?.text ?? '');
      expect(lesText).toContain('Тест курс');
      expect(lesText).not.toContain('Основы программирования');

      // Кнопка «Назад к проекту» должна содержать course-second
      const lesBtns = lesResp.screen?.keyboard?.rows.flat() ?? [];
      const backToProjBtn = lesBtns.find((b) =>
        b.text.includes('Назад к проекту'),
      );
      expect(backToProjBtn).toBeDefined();
      expect(backToProjBtn?.code).toContain('course-second');
    });
  });
});
