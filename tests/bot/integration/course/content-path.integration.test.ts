import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

/**
 * Интеграционный тест: resolve-content-path — ролевой доступ.
 *
 * Покрытие:
 * - Разрешение пути на уровне модуля (A)
 * - Разрешение пути на уровне проекта (A:B)
 * - Разрешение пути на уровне урока (A:B:C)
 * - Разрешение пути на уровне шага (A:B:C:D)
 * - Путь all (A:B:C:all)
 * - Алиасы (m1:p1:l1:s1)
 * - Ошибочные пути (not found)
 * - **Ролевой фильтр:**
 *   - curious (без actorId) — заголовки видны, content/code скрыты
 *   - mentor (ADMIN/AUTHOR) — полный контент
 */
describe('ResolveContentPath (интеграционный)', () => {
  let app: TestApp;
  let author: User;
  let mentor: User;
  let courseUuid: string;

  const AUTHOR_UUID = '44444444-4444-4444-4444-444444444444';
  const MENTOR_UUID = '44444444-4444-4444-4444-444444444444';
  const FIXTURE_MODULE_UUID = 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0';

  beforeAll(async () => {
    app = await createTestApp('resolve-content-path');
    author = (await app.userFacade.getUserByUuid(AUTHOR_UUID))!;
    mentor = author;

    // Создаём курс с фазой для resolve-content-path
    const course: any = await app.apiApp.execute(
      'create-course',
      {
        title: 'Тестовый курс',
        description: 'Курс для тестов ContentPath',
      },
      author.uuid,
    );
    courseUuid = course.uuid;

    await app.apiApp.execute(
      'add-phase-to-course',
      {
        courseId: courseUuid,
        title: 'Фаза 1: Основы',
        track: 'tech',
      },
      author.uuid,
    );

    await app.apiApp.execute(
      'add-module-to-course',
      {
        courseId: courseUuid,
        phaseTitle: 'Фаза 1: Основы',
        moduleId: FIXTURE_MODULE_UUID,
      },
      author.uuid,
    );
  });

  afterAll(async () => {
    await app.cleanup();
  });

  // ═══════════════════════════════════════════
  // Уровень модуля (A)
  // ═══════════════════════════════════════════

  test('путь "1" — уровень модуля, без actorId', async () => {
    const result: any = await app.apiApp.execute('resolve-content-path', {
      path: '1',
      courseId: courseUuid,
    });

    expect(result.path).toBe('1');
    expect(result.moduleIndex).toBe(1);
    expect(result.moduleTitle).toBeDefined();
    expect(result.projectIndex).toBeUndefined();
  });

  test('путь "m1" (алиас module) — уровень модуля', async () => {
    const result: any = await app.apiApp.execute('resolve-content-path', {
      path: 'm1',
      courseId: courseUuid,
    });

    expect(result.path).toBe('1');
    expect(result.moduleIndex).toBe(1);
  });

  // ═══════════════════════════════════════════
  // Уровень проекта (A:B)
  // ═══════════════════════════════════════════

  test('путь "1:1" — уровень проекта', async () => {
    const result: any = await app.apiApp.execute('resolve-content-path', {
      path: '1:1',
      courseId: courseUuid,
    });

    expect(result.path).toBe('1:1');
    expect(result.projectIndex).toBe(1);
    expect(result.projectId).toBeDefined();
    expect(result.projectTitle).toBe('Введение');
    expect(result.lessons).toBeDefined();
    expect(result.lessons.length).toBeGreaterThan(0);
    expect(result.lessonIndex).toBeUndefined();
  });

  test('путь "m1:p1" (алиас module:project) — уровень проекта', async () => {
    const result: any = await app.apiApp.execute('resolve-content-path', {
      path: 'm1:p1',
      courseId: courseUuid,
    });

    expect(result.path).toBe('1:1');
    expect(result.projectTitle).toBe('Введение');
  });

  // ═══════════════════════════════════════════
  // Уровень урока (A:B:C)
  // ═══════════════════════════════════════════

  test('путь "1:1:1" — уровень урока, без actorId (curious)', async () => {
    const result: any = await app.apiApp.execute('resolve-content-path', {
      path: '1:1:1',
      courseId: courseUuid,
    });

    expect(result.path).toBe('1:1:1');
    expect(result.lessonIndex).toBe(1);
    expect(result.lessonTitle).toBeDefined();
    expect(result.steps).toBeDefined();
    expect(result.steps.length).toBeGreaterThan(0);

    // curious: шаги видны, но без content/code
    for (const step of result.steps) {
      expect(step.uuid).toBeDefined();
      expect(step.description).toBeDefined();
      expect(step.kind).toBeDefined();
      expect(step.content).toBeUndefined();
      expect(step.code).toBeUndefined();
    }

    // step не заполняется (только для A:B:C:D)
    expect(result.step).toBeUndefined();
  });

  test('путь "1:1:1" — ментор видит полный контент', async () => {
    const result: any = await app.apiApp.execute(
      'resolve-content-path',
      { path: '1:1:1', courseId: courseUuid },
      mentor.uuid,
    );

    expect(result.path).toBe('1:1:1');

    // mentor: шаги с content (code — только для kind=code)
    for (const step of result.steps) {
      expect(step.uuid).toBeDefined();
      expect(step.description).toBeDefined();
      expect(Object.hasOwn(step, 'content')).toBe(true);
    }
  });

  test('путь "1:1:1:all" — все шаги урока', async () => {
    const result: any = await app.apiApp.execute('resolve-content-path', {
      path: '1:1:1:all',
      courseId: courseUuid,
    });

    expect(result.path).toBe('1:1:1:all');
    expect(result.steps).toBeDefined();
    expect(result.steps.length).toBe(2);
    expect(result.step).toBeUndefined();
  });

  test('путь "m1:p1:l1:sall" (алиас) — все шаги', async () => {
    const result: any = await app.apiApp.execute('resolve-content-path', {
      path: 'm1:p1:l1:sall',
      courseId: courseUuid,
    });

    expect(result.path).toBe('1:1:1:all');
    expect(result.steps.length).toBe(2);
  });

  // ═══════════════════════════════════════════
  // Уровень шага (A:B:C:D)
  // ═══════════════════════════════════════════

  test('путь "1:1:1:1" — конкретный шаг, curious (без контента)', async () => {
    const result: any = await app.apiApp.execute('resolve-content-path', {
      path: '1:1:1:1',
      courseId: courseUuid,
    });

    expect(result.path).toBe('1:1:1:1');
    expect(result.step).toBeDefined();
    expect(result.step.description).toBeDefined();
    expect(result.step.content).toBeUndefined();
    expect(result.step.code).toBeUndefined();
  });

  test('путь "1:1:1:1" — ментор видит контент шага', async () => {
    const result: any = await app.apiApp.execute(
      'resolve-content-path',
      { path: '1:1:1:1', courseId: courseUuid },
      mentor.uuid,
    );

    expect(result.step).toBeDefined();
    expect(Object.hasOwn(result.step, 'content')).toBe(true);
  });

  test('путь "m1:p1:l1:s1" (алиас) — конкретный шаг', async () => {
    const result: any = await app.apiApp.execute('resolve-content-path', {
      path: 'm1:p1:l1:s1',
      courseId: courseUuid,
    });

    expect(result.path).toBe('1:1:1:1');
    expect(result.step).toBeDefined();
  });

  test('путь "1:1:2:1" — шаг во втором уроке', async () => {
    const result: any = await app.apiApp.execute('resolve-content-path', {
      path: '1:1:2:1',
      courseId: courseUuid,
    });

    expect(result.path).toBe('1:1:2:1');
    expect(result.lessonIndex).toBe(2);
    expect(result.lessonTitle).toBe('Условные операторы');
    expect(result.step.description).toBeDefined();
  });

  // ═══════════════════════════════════════════
  // Ошибочные пути
  // ═══════════════════════════════════════════

  test('несуществующий модуль — ошибка NotFound', async () => {
    await expect(
      app.apiApp.execute('resolve-content-path', {
        path: '99',
        courseId: courseUuid,
      }),
    ).rejects.toThrow('Модуль не найден');
  });

  test('несуществующий проект — ошибка NotFound', async () => {
    await expect(
      app.apiApp.execute('resolve-content-path', {
        path: '1:99',
        courseId: courseUuid,
      }),
    ).rejects.toThrow('Проект не найден');
  });

  test('несуществующий урок — ошибка NotFound', async () => {
    await expect(
      app.apiApp.execute('resolve-content-path', {
        path: '1:1:99',
        courseId: courseUuid,
      }),
    ).rejects.toThrow('Урок не найден');
  });

  test('несуществующий шаг — ошибка NotFound', async () => {
    await expect(
      app.apiApp.execute('resolve-content-path', {
        path: '1:1:1:99',
        courseId: courseUuid,
      }),
    ).rejects.toThrow('Шаг не найден');
  });

  // ═══════════════════════════════════════════
  // Рендер программы
  // ═══════════════════════════════════════════

  test('путь "1:1" возвращает список уроков с lessonId и lessonTitle', async () => {
    const result: any = await app.apiApp.execute('resolve-content-path', {
      path: '1:1',
      courseId: courseUuid,
    });

    expect(result.lessons).toBeDefined();
    const lessonTitles = result.lessons.map(
      (l: { lessonTitle: string }) => l.lessonTitle,
    );
    expect(lessonTitles).toContain('Переменные и типы');
    expect(lessonTitles).toContain('Условные операторы');
    expect(result.lessons.length).toBe(2);
  });

  test('гость (не авторизован) видит только заголовки на уровне шага', async () => {
    const result: any = await app.apiApp.execute('resolve-content-path', {
      path: '1:1:1:1',
      courseId: courseUuid,
    });

    expect(result.step.content).toBeUndefined();
    expect(result.step.code).toBeUndefined();
  });

  test('гость видит все шаги урока через all', async () => {
    const result: any = await app.apiApp.execute('resolve-content-path', {
      path: '1:1:1:all',
      courseId: courseUuid,
    });

    expect(result.steps.length).toBe(2);
    for (const step of result.steps) {
      expect(step.content).toBeUndefined();
    }
  });
});
