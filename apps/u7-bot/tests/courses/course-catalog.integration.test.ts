import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { AppController } from '@u7-scl/bot/app/app-controller';
import { CoursesController } from '@u7-scl/bot/courses/controller';
import type { TestApp } from '@u7-scl/test-helpers/test-app';
import { createTestApp } from '@u7-scl/test-helpers/test-app';
import {
  createTestBotTransport,
  stampedCode,
  type TestBotTransport,
} from '@u7-scl/test-helpers/test-bot-transport';

/**
 * Интеграционный тест CourseCatalogStory (S00 + drill-down)
 *
 * Контракт «Диалог и Экран»: ассерты — по DialogResponse, захваченному
 * на границе uiApp. Коды прямых вызовов штампуются актуальным штампом
 * открытого экрана (transport валидирует штампы на входе).
 *
 * 5 уровней:
 *   list     — курсы + этапы inline
 *   phases   — этапы + модули inline
 *   modules  — модули + проекты inline
 *   projects — проекты + уроки inline
 *   lessons  — уроки + заголовки шагов
 */
describe('CourseCatalogStory (интеграционный)', () => {
  let app: TestApp;
  let transport: TestBotTransport;
  let guest: User;
  let author: User;

  const FIXTURE_MODULE_UUID = 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0';

  const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';

  beforeAll(async () => {
    app = await createTestApp('course-catalog-v2');
    const courseController = new CoursesController();
    const appController = new AppController(SCHOOL_GROUP_URL);
    transport = createTestBotTransport(app, [appController, courseController]);
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
    author = (await app.userFacade.getUserByTelegramId(1004))!;
  });

  beforeEach(() => {
    transport.reset();
  });

  afterAll(async () => {
    await app.cleanup();
  });

  /** Открывает диалог гостя и вызывает сырой код стори с актуальным штампом. */
  async function openCourse(rawCode: string) {
    await transport.handleStart(transport.makeBotContext(guest.telegramId));
    return transport.handleCallback(
      transport.makeBotContext(guest.telegramId, {
        callbackData: stampedCode(transport, guest.telegramId, rawCode),
      }),
    );
  }

  async function createCourseWithModule(
    title: string,
  ): Promise<{ courseId: string; moduleId: string }> {
    const course = await app.apiApp.execute(
      'create-course',
      { title, description: 'Интеграционный тест' },
      author,
    );
    const mod = await app.apiApp.execute(
      'create-module',
      { title: 'Модуль', description: 'Тестовый модуль' },
      author,
    );
    await app.apiApp.execute('publish-module', { moduleId: mod.uuid }, author);
    await app.apiApp.execute(
      'add-phase-to-course',
      { courseId: course.uuid, title: 'Этап 1', track: 'tech' },
      author,
    );
    await app.apiApp.execute(
      'add-module-to-course',
      { courseId: course.uuid, phaseTitle: 'Этап 1', moduleId: mod.uuid },
      author,
    );
    return { courseId: course.uuid, moduleId: mod.uuid };
  }

  // ── Уровень 0: Курсы ──

  test('list: курсы + этапы inline', async () => {
    const response = await openCourse('course:course-catalog:list');
    const text = response.screen?.text ?? '';
    expect(text).toContain('Курсы');
    expect(text).toContain('Основы программирования');
    expect(text).toContain('Синтаксис');
  });

  // ── Уровень 1: Этапы ──

  test('phases: этапы + модули inline', async () => {
    const { courseId } = await createCourseWithModule('Тестовый курс');

    const response = await openCourse(
      `course:course-catalog:phases:${courseId}`,
    );

    const text = response.screen?.text ?? '';
    expect(text).toContain('Курс: Тестовый курс');
    expect(text).toContain('Этап 1');

    const rows = response.screen?.keyboard?.rows ?? [];
    expect(rows.some((r) => r[0]?.text?.includes('Этап 1'))).toBe(true);
    expect(rows.some((r) => r[0]?.text?.includes('Назад к курсам'))).toBe(true);
  });

  test('phases: несуществующий курс — ошибка', async () => {
    const response = await openCourse('course:course-catalog:phases:bad-uuid');
    expect(response.screen?.text).toContain('не найден');
  });

  // ── Уровень 2: Модули ──

  test('modules: модули + проекты inline', async () => {
    const { courseId } = await createCourseWithModule('Курс M');

    const response = await openCourse(
      `course:course-catalog:modules:${courseId}:0`,
    );

    const text = response.screen?.text ?? '';
    expect(text).toContain('Этап: Этап 1');
    expect(text).toContain('Модуль');

    const rows = response.screen?.keyboard?.rows ?? [];
    expect(rows.some((r) => r[0]?.text?.includes('Модуль'))).toBe(true);
    expect(rows.some((r) => r[0]?.text?.includes('Назад к курсу'))).toBe(true);
  });

  // ── Уровень 3: Проекты ──

  test('projects: проекты + уроки inline (фикстурный модуль)', async () => {
    const course = await app.apiApp.execute(
      'create-course',
      { title: 'Курс с проектами', description: 'Тест' },
      author,
    );
    await app.apiApp.execute(
      'add-phase-to-course',
      { courseId: course.uuid, title: 'Этап', track: 'tech' },
      author,
    );
    await app.apiApp.execute(
      'add-module-to-course',
      {
        courseId: course.uuid,
        phaseTitle: 'Этап',
        moduleId: FIXTURE_MODULE_UUID,
      },
      author,
    );

    const response = await openCourse(
      `course:course-catalog:projects:${course.uuid}:0:${FIXTURE_MODULE_UUID}`,
    );

    const text = response.screen?.text ?? '';
    expect(text).toContain('Введение');
    expect(text).toContain('Переменные и типы');

    const rows = response.screen?.keyboard?.rows ?? [];
    // Кнопки — проекты, не уроки
    expect(rows.some((r) => r[0]?.text?.includes('Введение'))).toBe(true);
    expect(rows.some((r) => r[0]?.text?.includes('Назад к этапу'))).toBe(true);
  });

  // ── Уровень 4: Уроки ──

  test('lessons: уроки + заголовки шагов, тела скрыты', async () => {
    const course = await app.apiApp.execute(
      'create-course',
      { title: 'Курс с шагами', description: 'Тест' },
      author,
    );
    await app.apiApp.execute(
      'add-phase-to-course',
      { courseId: course.uuid, title: 'Этап', track: 'tech' },
      author,
    );
    await app.apiApp.execute(
      'add-module-to-course',
      {
        courseId: course.uuid,
        phaseTitle: 'Этап',
        moduleId: FIXTURE_MODULE_UUID,
      },
      author,
    );

    const response = await openCourse(
      `course:course-catalog:lessons:${course.uuid}:0:${FIXTURE_MODULE_UUID}:0`,
    );

    const text = response.screen?.text ?? '';
    expect(text).toContain('Проект: Введение');
    expect(text).toContain('Переменные и типы');

    // Тела шагов не видны
    expect(text).not.toContain('<html');
    expect(text).not.toContain('function');

    const rows = response.screen?.keyboard?.rows ?? [];
    expect(rows.some((r) => r[0]?.text?.includes('Назад к модулю'))).toBe(true);
  });
});
