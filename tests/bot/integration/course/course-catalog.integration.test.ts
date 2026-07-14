import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { SessionData } from '@u7-scl/core/ui';
import { assertBotResponseValid, BotRouter } from '@u7-scl/core/ui';
import { CourseController } from '@u7-scl/course/ui';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

/**
 * Интеграционный тест CourseCatalogStory (S00, S00a, S00b)
 *
 * Покрытие:
 * - S00:  список курсов (гость видит published)
 * - S00a: карточка курса (фазы, сводка, кнопки)
 * - S00b.1: программа — этапы + модули inline
 * - S00b.2: модуль — проекты + уроки inline
 * - S00b.3: урок — заголовки шагов (тела скрыты)
 * - Ошибки: несуществующий курс
 */
describe('CourseCatalogStory (интеграционный)', () => {
  let app: TestApp;
  let router: BotRouter;
  let guest: User;
  let author: User;
  const session: SessionData = { activeHandler: null };

  // uuid фикстурного модуля (есть проекты и уроки в фикстурах)
  const FIXTURE_MODULE_UUID = 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0';

  beforeAll(async () => {
    app = await createTestApp('course-catalog');

    const courseController = new CourseController(app.courseModule);
    courseController.init(app.apiApp);
    router = new BotRouter([courseController]);

    guest = (await app.userFacade.getUserByTelegramId(1001))!;
    author = (await app.userFacade.getUserByTelegramId(1004))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  async function createCourseWithModule(title: string): Promise<{ courseId: string; moduleId: string }> {
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
    await app.apiApp.execute('publish-module', { moduleId: mod.uuid }, author.uuid);
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

  // ── S00 ──

  test('S00: гость видит список published-курсов', async () => {
    const response = await router.handleCallback(
      'course:course-catalog:list',
      guest,
      session,
    );
    assertBotResponseValid(response);

    expect(response.sendMessage?.text).toContain('Программы курсов');
    // Фикстурный курс «Основы программирования» должен быть виден
    expect(response.sendMessage?.text).toContain('Основы программирования');
  });

  // ── S00a ──

  test('S00a: карточка курса с фазами и кнопкой «Развернуть программу»', async () => {
    const { courseId } = await createCourseWithModule('Тестовый курс');

    const response = await router.handleCallback(
      `course:course-catalog:view:${courseId}`,
      guest,
      session,
    );
    assertBotResponseValid(response);

    expect(response.sendMessage?.text).toContain('Тестовый курс');
    expect(response.sendMessage?.text).toContain('Этап 1');

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const programBtn = rows.find(
      (r) => r[0]?.text === '📖 Развернуть программу',
    );
    expect(programBtn).toBeDefined();
    // Не проверяем точный uuid, только префикс
    expect(programBtn![0]!.code).toMatch(/^course:course-catalog:program:/);
  });

  test('S00a: несуществующий курс — ошибка', async () => {
    const response = await router.handleCallback(
      'course:course-catalog:view:ffffffff-ffff-ffff-ffff-ffffffffffff',
      guest,
      session,
    );
    assertBotResponseValid(response);
    expect(response.sendMessage?.text).toContain('не найден');
  });

  // ── S00b.1 ──

  test('S00b.1: этапы + модули inline', async () => {
    const { courseId } = await createCourseWithModule('Курс S00b');

    const response = await router.handleCallback(
      `course:course-catalog:program:${courseId}`,
      guest,
      session,
    );
    assertBotResponseValid(response);

    expect(response.sendMessage?.text).toContain('Программа');
    expect(response.sendMessage?.text).toContain('Курс S00b');
    expect(response.sendMessage?.text).toContain('Этап 1');
    expect(response.sendMessage?.text).toContain('Модуль');

    // Кнопка «Назад к карточке»
    const rows = response.sendMessage?.keyboard?.rows ?? [];
    expect(rows.some((r) => r[0]?.text?.includes('Назад к карточке'))).toBe(true);
  });

  test('S00b: несуществующий курс — ошибка', async () => {
    const response = await router.handleCallback(
      'course:course-catalog:program:bad-uuid',
      guest,
      session,
    );
    assertBotResponseValid(response);
    expect(response.sendMessage?.text).toContain('не найден');
  });

  // ── S00b.2 ──

  test('S00b.2: проекты + уроки inline (фикстурный модуль)', async () => {
    // Создаём курс и добавляем ФИКСТУРНЫЙ модуль (уже есть проекты/уроки)
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
      { courseId: course.uuid, phaseTitle: 'Этап', moduleId: FIXTURE_MODULE_UUID },
      author.uuid,
    );

    const response = await router.handleCallback(
      `course:course-catalog:program:module:${course.uuid}:0:${FIXTURE_MODULE_UUID}`,
      guest,
      session,
    );
    assertBotResponseValid(response);

    expect(response.sendMessage?.text).toContain('Введение');
    expect(response.sendMessage?.text).toContain('Переменные и типы');

    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const backBtn = rows.find((r) => r[0]?.text?.includes('Назад к этапам'));
    expect(backBtn).toBeDefined();
    expect(backBtn![0]!.code).toMatch(
      /^course:course-catalog:program:.+/,
    );
  });

  // ── S00b.3 ──

  test('S00b.3: заголовки шагов (тела скрыты)', async () => {
    // Создаём курс с фикстурным модулем
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
      { courseId: course.uuid, phaseTitle: 'Этап', moduleId: FIXTURE_MODULE_UUID },
      author.uuid,
    );

    // projectIdx=0, lessonIdx=0 → проект «Введение», урок «Переменные и типы»
    const response = await router.handleCallback(
      `course:course-catalog:program:lesson:${course.uuid}:0:${FIXTURE_MODULE_UUID}:0:0`,
      guest,
      session,
    );
    assertBotResponseValid(response);

    expect(response.sendMessage?.text).toContain('Переменные и типы');

    // Тела шагов не видны
    expect(response.sendMessage?.text).not.toContain('<html');
    expect(response.sendMessage?.text).not.toContain('function');
    expect(response.sendMessage?.text).not.toContain('const ');

    // Кнопка «Назад к модулю»
    const rows = response.sendMessage?.keyboard?.rows ?? [];
    const backBtn = rows.find((r) => r[0]?.text?.includes('Назад к модулю'));
    expect(backBtn).toBeDefined();
    expect(backBtn![0]!.code).toMatch(
      /^course:course-catalog:program:module:.+/,
    );
  });
});
