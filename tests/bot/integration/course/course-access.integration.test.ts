import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { Status } from '@u7-scl/course/domain';
import type { TestApp } from '../../helpers/test-app';
import { createTestApp } from '../../helpers/test-app';

/**
 * Интеграционный тест: создание и доступность курсов.
 *
 * Покрытие:
 * - AUTHOR может создать курс
 * - Не-AUTHOR не может создать курс
 * - list-courses доступен всем (включая гостя)
 * - get-course доступен всем
 * - созданный курс появляется в list-courses
 */
describe('CourseAccess (интеграционный)', () => {
  let app: TestApp;
  let author: User;
  let student: User;
  let guest: User;

  // Ментор с ролью AUTHOR (фикстура)
  const MENTOR_AUTHOR_UUID = '44444444-4444-4444-4444-444444444444';
  // Студент без AUTHOR (фикстура: 2222...)
  const STUDENT_UUID = '22222222-2222-2222-2222-222222222222';

  beforeAll(async () => {
    app = await createTestApp('course-access');
    author = (await app.userFacade.getUserByUuid(MENTOR_AUTHOR_UUID))!;
    student = (await app.userFacade.getUserByUuid(STUDENT_UUID))!;
    guest = (await app.userFacade.getUserByTelegramId(1001))!;
  });

  afterAll(async () => {
    await app.cleanup();
  });

  test('AUTHOR создаёт курс', async () => {
    const course = await app.apiApp.execute(
      'create-course',
      { title: 'Новый курс', description: 'Описание' },
      author.uuid,
    );

    expect(course.uuid).toBeDefined();
    expect(course.title).toBe('Новый курс');
    expect(course.authorId).toBe(author.uuid);
    expect(course.status).toBe(Status.DRAFT);
  });

  test('студент без AUTHOR не может создать курс', async () => {
    await expect(
      app.apiApp.execute(
        'create-course',
        { title: 'Курс студента', description: '...' },
        student.uuid,
      ),
    ).rejects.toThrow('Недостаточно прав для создания курса');
  });

  test('list-courses доступен гостю', async () => {
    const courses = await app.apiApp.execute('list-courses', {}, guest.uuid);

    expect(Array.isArray(courses)).toBe(true);
  });

  test('созданный курс виден через get-course', async () => {
    // Создаём курс
    const created = await app.apiApp.execute(
      'create-course',
      { title: 'Видимый курс', description: '...' },
      author.uuid,
    );

    // Получаем курс (без actorId — публичный доступ)
    const course = await app.apiApp.execute('get-course', {
      uuid: created.uuid,
    });

    expect(course.title).toBe('Видимый курс');
  });

  test('созданный курс появляется через list-courses', async () => {
    const courses = await app.apiApp.execute(
      'list-courses',
      { status: Status.DRAFT },
      author.uuid,
    );

    const found = courses.find(
      (c: { title: string }) => c.title === 'Видимый курс',
    );
    expect(found).toBeDefined();
  });
});
