import { afterAll, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { Course } from '#domain/course/entity';
import { Status } from '#domain/status';
import { CourseJsonRepo } from './course-json-repo';

const tmpDir = mkdtempSync('/tmp/course-json-repo-test-');

function filePath(filename = 'courses.json'): string {
  return join(tmpDir, filename);
}

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    uuid: crypto.randomUUID(),
    title: 'Тестовый курс',
    description: 'Описание',
    authorId: crypto.randomUUID(),
    phases: [],
    status: Status.DRAFT,
    createdAt: '2026-05-01T12:00',
    ...overrides,
  };
}

describe('CourseJsonRepo', () => {
  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('save и getByUuid', () => {
    test('сохраняет и находит курс по uuid', async () => {
      const repo = new CourseJsonRepo(filePath());
      const uuid = crypto.randomUUID();
      const course = makeCourse({ uuid });

      await repo.save(course);
      const found = await repo.getByUuid(uuid);

      expect(found).toBeDefined();
      expect(found?.title).toBe('Тестовый курс');
    });

    test('getByUuid возвращает undefined для несуществующего', async () => {
      const repo = new CourseJsonRepo(filePath());

      const found = await repo.getByUuid(
        '550e8400-e29b-41d4-a716-446655440099',
      );
      expect(found).toBeUndefined();
    });

    test('save перезаписывает существующий курс', async () => {
      const repo = new CourseJsonRepo(filePath('courses-update.json'));
      const uuid = crypto.randomUUID();
      const course = makeCourse({ uuid });
      await repo.save(course);

      const updated = { ...course, title: 'Обновлённый курс' };
      await repo.save(updated);

      const found = await repo.getByUuid(uuid);
      expect(found?.title).toBe('Обновлённый курс');
    });
  });

  describe('getAll', () => {
    test('возвращает все курсы', async () => {
      const repo = new CourseJsonRepo(filePath('courses-all.json'));
      const c1 = makeCourse({ uuid: crypto.randomUUID() });
      const c2 = makeCourse({
        uuid: crypto.randomUUID(),
        title: 'Второй курс',
      });

      await repo.save(c1);
      await repo.save(c2);

      const all = await repo.getAll();
      expect(all).toHaveLength(2);
    });

    test('возвращает пустой массив если файла нет', async () => {
      const repo = new CourseJsonRepo(filePath('courses-empty.json'));
      const all = await repo.getAll();
      expect(all).toEqual([]);
    });
  });

  describe('getAll с фильтрами', () => {
    test('фильтрует по статусу', async () => {
      const repo = new CourseJsonRepo(filePath('courses-status.json'));
      const draft = makeCourse({ uuid: crypto.randomUUID() });
      const pubUuid = crypto.randomUUID();
      const published = makeCourse({ uuid: pubUuid, status: Status.PUBLISHED });

      await repo.save(draft);
      await repo.save(published);

      const filtered = await repo.getAll({ status: Status.PUBLISHED });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.uuid).toBe(pubUuid);
    });

    test('фильтрует по authorId', async () => {
      const repo = new CourseJsonRepo(filePath('courses-author.json'));
      const authorA = crypto.randomUUID();
      const authorB = crypto.randomUUID();
      const c1 = makeCourse({ uuid: crypto.randomUUID(), authorId: authorA });
      const c2 = makeCourse({ uuid: crypto.randomUUID(), authorId: authorB });

      await repo.save(c1);
      await repo.save(c2);

      const filtered = await repo.getAll({ authorId: authorA });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.authorId).toBe(authorA);
    });

    test('фильтрует по title (частичное совпадение)', async () => {
      const repo = new CourseJsonRepo(filePath('courses-title.json'));
      const c1 = makeCourse({
        uuid: crypto.randomUUID(),
        title: 'Основы JavaScript',
      });
      const c2 = makeCourse({
        uuid: crypto.randomUUID(),
        title: 'Алгоритмика',
      });

      await repo.save(c1);
      await repo.save(c2);

      const filtered = await repo.getAll({ title: 'Java' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.title).toBe('Основы JavaScript');
    });

    test('фильтрует по нескольким параметрам одновременно', async () => {
      const repo = new CourseJsonRepo(filePath('courses-combined.json'));
      const authorA = crypto.randomUUID();
      const pubUuid = crypto.randomUUID();
      const c1 = makeCourse({
        uuid: pubUuid,
        authorId: authorA,
        status: Status.PUBLISHED,
        title: 'JS курс',
      });
      const c2 = makeCourse({
        uuid: crypto.randomUUID(),
        authorId: authorA,
        status: Status.DRAFT,
        title: 'Алгоритмика',
      });
      const c3 = makeCourse({
        uuid: crypto.randomUUID(),
        authorId: crypto.randomUUID(),
        status: Status.PUBLISHED,
        title: 'Python',
      });

      await repo.save(c1);
      await repo.save(c2);
      await repo.save(c3);

      const filtered = await repo.getAll({
        authorId: authorA,
        status: Status.PUBLISHED,
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.uuid).toBe(pubUuid);
    });

    test('сортирует по title asc', async () => {
      const repo = new CourseJsonRepo(filePath('courses-sort-title.json'));
      const c1 = makeCourse({ uuid: crypto.randomUUID(), title: 'Бета' });
      const c2 = makeCourse({ uuid: crypto.randomUUID(), title: 'Альфа' });

      await repo.save(c1);
      await repo.save(c2);

      const sorted = await repo.getAll({ sort: 'title:asc' });
      expect(sorted).toHaveLength(2);
      expect(sorted[0]?.title).toBe('Альфа');
      expect(sorted[1]?.title).toBe('Бета');
    });

    test('сортирует по createdAt desc', async () => {
      const repo = new CourseJsonRepo(filePath('courses-sort-date.json'));
      const c1 = makeCourse({
        uuid: crypto.randomUUID(),
        createdAt: '2026-01-01T00:00',
      });
      const c2 = makeCourse({
        uuid: crypto.randomUUID(),
        createdAt: '2026-06-01T00:00',
      });

      await repo.save(c1);
      await repo.save(c2);

      const sorted = await repo.getAll({ sort: 'createdAt:desc' });
      expect(sorted).toHaveLength(2);
      expect(sorted[0]?.createdAt).toBe('2026-06-01T00:00');
      expect(sorted[1]?.createdAt).toBe('2026-01-01T00:00');
    });

    test('ограничивает по limit', async () => {
      const repo = new CourseJsonRepo(filePath('courses-limit.json'));
      const c1 = makeCourse({ uuid: crypto.randomUUID() });
      const c2 = makeCourse({ uuid: crypto.randomUUID() });
      const c3 = makeCourse({ uuid: crypto.randomUUID() });

      await repo.save(c1);
      await repo.save(c2);
      await repo.save(c3);

      const limited = await repo.getAll({ limit: 2 });
      expect(limited).toHaveLength(2);
    });
  });
});
