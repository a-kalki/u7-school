import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

/**
 * Интеграционный тест: get-course возвращает программу курса.
 *
 * Покрытие:
 * - Создание курса автором
 * - Добавление фазы
 * - Добавление модулей (из фикстур + динамически созданный)
 * - getCourseProgram возвращает phases → modules (ContentSnapshot)
 */
describe('CourseProgram (интеграционный)', () => {
  let app: TestApp;
  let author: User;

  // Модуль из фикстур
  const FIXTURE_MODULE_UUID = 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0';
  // Автор из фикстур (роли: MENTOR, AUTHOR), также автор фикстурного модуля
  const AUTHOR_UUID = '44444444-4444-4444-4444-444444444444';

  beforeAll(async () => {
    app = await createTestApp('course-program');
    author = (await app.userFacade.getUserByUuid(AUTHOR_UUID))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('get-course возвращает программу из 2 модулей', async () => {
    // 1. Создаём второй модуль (первый уже в фикстурах)
    const newModule = await app.apiApp.execute(
      'create-module',
      {
        title: 'Алгоритмика (тест)',
        description: 'Тестовый модуль для интеграционного теста',
      },
      author.uuid,
    );

    // Публикуем модуль, чтобы getModuleSnapshot видел его без actorId
    await app.apiApp.execute(
      'publish-module',
      { moduleId: newModule.uuid },
      author.uuid,
    );

    // 2. Создаём курс
    const course = await app.apiApp.execute(
      'create-course',
      {
        title: 'Полный курс JS',
        description: 'Интеграционный тестовый курс',
      },
      author.uuid,
    );

    // 3. Добавляем фазу
    await app.apiApp.execute(
      'add-phase-to-course',
      {
        courseId: course.uuid,
        title: 'Этап 1: Основы',
        track: 'tech',
      },
      author.uuid,
    );

    // 4. Добавляем модули в фазу
    await app.apiApp.execute(
      'add-module-to-course',
      {
        courseId: course.uuid,
        phaseTitle: 'Этап 1: Основы',
        moduleId: FIXTURE_MODULE_UUID,
      },
      author.uuid,
    );

    await app.apiApp.execute(
      'add-module-to-course',
      {
        courseId: course.uuid,
        phaseTitle: 'Этап 1: Основы',
        moduleId: newModule.uuid,
      },
      author.uuid,
    );

    // 5. Получаем программу курса
    const program = await app.courseFacade.getCourseProgram(course.uuid);

    // Проверяем структуру
    expect(program.course.uuid).toBe(course.uuid);
    expect(program.course.title).toBe('Полный курс JS');
    expect(program.course.phases).toHaveLength(1);

    const phase = program.phases[0];
    expect(phase).toBeDefined();
    expect(phase?.title).toBe('Этап 1: Основы');
    expect(phase?.track).toBe('tech');
    expect(phase?.modules).toHaveLength(2);

    // Первый модуль (из фикстур) — должен содержать проекты с уроками
    const fixtureSnapshot = phase?.modules[0];
    expect(fixtureSnapshot).toBeDefined();
    // ContentSnapshot — массив проектов, каждый с projectId, projectTitle, lessons
    expect(Array.isArray(fixtureSnapshot)).toBe(true);
    expect(fixtureSnapshot!.length).toBeGreaterThan(0);
    // Проверяем проект «Основы синтаксиса» из фикстур
    const project = fixtureSnapshot!.find(
      (p) => p.projectId === 'b0b0b0b0-b0b0-b0b0-b0b0-b0b0b0b0b0b0',
    );
    expect(project).toBeDefined();
    expect(project?.projectTitle).toBe('Введение');
    expect(project?.lessons.length).toBeGreaterThan(0);

    // Второй модуль (созданный) — пустой (нет проектов)
    const newModuleSnapshot = phase?.modules[1];
    expect(Array.isArray(newModuleSnapshot)).toBe(true);
    expect(newModuleSnapshot).toEqual([]);

    // Проверяем порядок модулей в фазе
    expect(program.course.phases[0]?.moduleIds).toEqual([
      FIXTURE_MODULE_UUID,
      newModule.uuid,
    ]);
  });
});
