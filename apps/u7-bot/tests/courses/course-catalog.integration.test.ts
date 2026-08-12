// @ts-nocheck
import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { AppController } from '@u7-scl/bot/app/app-controller';
import { CoursesController } from '@u7-scl/bot/courses/controller';
import type { SessionData } from '@u7-scl/core/ui';
import { assertBotResponseValid, UiApp } from '@u7-scl/core/ui';
import type { TestApp } from '@u7-scl/test-helpers/test-app';
import {
  createTestApp,
  type TestBotUiApp,
} from '@u7-scl/test-helpers/test-app';

/**
 * Интеграционный тест CourseCatalogStory (S00 + drill-down)
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
  let router: TestBotUiApp;
  let guest: User;
  let author: User;
  const session: SessionData = { activeHandler: null };

  const FIXTURE_MODULE_UUID = 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0';

  const SCHOOL_GROUP_URL = 'https://t.me/u7_school_group';

  beforeAll(async () => {
    app = await createTestApp('course-catalog-v2');
    const courseController = new CoursesController();
    const appController = new AppController(SCHOOL_GROUP_URL);
    router = new UiApp([appController, courseController]);
    router.init(app.apiApp, (tgId: number) =>
      app.userFacade.getUserByTelegramId(tgId),
    );
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
    author = (await app.userFacade.getUserByTelegramId(1004))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  async function createCourseWithModule(
    title: string,
  ): Promise<{ courseId: string; moduleId: string }> {
    const course = await app.apiApp.execute(
      'create-course',
      { title, description: 'Интеграционный тест' },
      author.uuid,
    );
    const mod = await app.apiApp.execute(
      'create-module',
      { title: 'Модуль', description: 'Тестовый модуль' },
      author.uuid,
    );
    await app.apiApp.execute(
      'publish-module',
      { moduleId: mod.uuid },
      author.uuid,
    );
    await app.apiApp.execute(
      'add-phase-to-course',
      { courseId: course.uuid, title: 'Этап 1', track: 'tech' },
      author.uuid,
    );
    await app.apiApp.execute(
      'add-module-to-course',
      { courseId: course.uuid, phaseTitle: 'Этап 1', moduleId: mod.uuid },
      author.uuid,
    );
    return { courseId: course.uuid, moduleId: mod.uuid };
  }

  // ── Уровень 0: Курсы ──

  test('list: курсы + этапы inline', async () => {
    const response = await router.handleCallback(
      'course:course-catalog:list',
      guest.telegramId,
      session,
    );
    assertBotResponseValid(response);
    expect(response.sendMessage?.text).toContain('Курсы');
    expect(response.sendMessage?.text).toContain('Основы программирования');
    expect(response.sendMessage?.text).toContain('Синтаксис');
  });

  // ── Уровень 1: Этапы ──

  test('phases: этапы + модули inline', async () => {
    const { courseId } = await createCourseWithModule('Тестовый курс');

    const response = await router.handleCallback(
      `course:course-catalog:phases:${courseId}`,
      guest.telegramId,
      session,
    );
    assertBotResponseValid(response);

    expect(response.sendMessage?.text).toContain('Курс: Тестовый курс');
    expect(response.sendMessage?.text).toContain('Этап 1');

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    expect(rows.some((r) => r[0]?.text?.includes('Этап 1'))).toBe(true);
    expect(rows.some((r) => r[0]?.text?.includes('Назад к курсам'))).toBe(true);
  });

  test('phases: несуществующий курс — ошибка', async () => {
    const response = await router.handleCallback(
      'course:course-catalog:phases:bad-uuid',
      guest.telegramId,
      session,
    );
    assertBotResponseValid(response);
    expect(response.sendMessage?.text).toContain('не найден');
  });

  // ── Уровень 2: Модули ──

  test('modules: модули + проекты inline', async () => {
    const { courseId } = await createCourseWithModule('Курс M');

    const response = await router.handleCallback(
      `course:course-catalog:modules:${courseId}:0`,
      guest.telegramId,
      session,
    );
    assertBotResponseValid(response);

    expect(response.sendMessage?.text).toContain('Этап: Этап 1');
    expect(response.sendMessage?.text).toContain('Модуль');

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    expect(rows.some((r) => r[0]?.text?.includes('Модуль'))).toBe(true);
    expect(rows.some((r) => r[0]?.text?.includes('Назад к курсу'))).toBe(true);
  });

  // ── Уровень 3: Проекты ──

  test('projects: проекты + уроки inline (фикстурный модуль)', async () => {
    const course = await app.apiApp.execute(
      'create-course',
      { title: 'Курс с проектами', description: 'Тест' },
      author.uuid,
    );
    await app.apiApp.execute(
      'add-phase-to-course',
      { courseId: course.uuid, title: 'Этап', track: 'tech' },
      author.uuid,
    );
    await app.apiApp.execute(
      'add-module-to-course',
      {
        courseId: course.uuid,
        phaseTitle: 'Этап',
        moduleId: FIXTURE_MODULE_UUID,
      },
      author.uuid,
    );

    const response = await router.handleCallback(
      `course:course-catalog:projects:${course.uuid}:0:${FIXTURE_MODULE_UUID}`,
      guest.telegramId,
      session,
    );
    assertBotResponseValid(response);

    expect(response.sendMessage?.text).toContain('Введение');
    expect(response.sendMessage?.text).toContain('Переменные и типы');

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    // Кнопки — проекты, не уроки
    expect(rows.some((r) => r[0]?.text?.includes('Введение'))).toBe(true);
    expect(rows.some((r) => r[0]?.text?.includes('Назад к этапу'))).toBe(true);
  });

  // ── Уровень 4: Уроки ──

  test('lessons: уроки + заголовки шагов, тела скрыты', async () => {
    const course = await app.apiApp.execute(
      'create-course',
      { title: 'Курс с шагами', description: 'Тест' },
      author.uuid,
    );
    await app.apiApp.execute(
      'add-phase-to-course',
      { courseId: course.uuid, title: 'Этап', track: 'tech' },
      author.uuid,
    );
    await app.apiApp.execute(
      'add-module-to-course',
      {
        courseId: course.uuid,
        phaseTitle: 'Этап',
        moduleId: FIXTURE_MODULE_UUID,
      },
      author.uuid,
    );

    const response = await router.handleCallback(
      `course:course-catalog:lessons:${course.uuid}:0:${FIXTURE_MODULE_UUID}:0`,
      guest.telegramId,
      session,
    );
    assertBotResponseValid(response);

    expect(response.sendMessage?.text).toContain('Проект: Введение');
    expect(response.sendMessage?.text).toContain('Переменные и типы');

    // Тела шагов не видны
    expect(response.sendMessage?.text).not.toContain('<html');
    expect(response.sendMessage?.text).not.toContain('function');

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    expect(rows.some((r) => r[0]?.text?.includes('Назад к модулю'))).toBe(true);
  });
});
