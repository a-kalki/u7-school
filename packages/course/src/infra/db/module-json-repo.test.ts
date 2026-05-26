import { afterAll, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { Course } from '#domain/module/entity';
import { Status } from '#domain/status';
import { ModuleJsonRepo } from './module-json-repo';

const tmpDir = mkdtempSync('/tmp/course-repo-test-');

function coursePath(): string {
  return join(tmpDir, 'courses.json');
}

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    uuid: crypto.randomUUID(),
    title: 'Тестовый курс',
    description: 'Описание',
    authorId: crypto.randomUUID(),
    status: Status.DRAFT,
    createdAt: '2026-05-01T12:00',
    projects: [],
    ...overrides,
  } as Course;
}

describe('ModuleJsonRepo', () => {
  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('save и getByUuid', async () => {
    const path = coursePath();
    const repo = new ModuleJsonRepo(path);
    const uuid = crypto.randomUUID();
    const course = makeCourse({ uuid } as Partial<Course>);

    await repo.save(course);
    const found = await repo.getByUuid(uuid);

    expect(found).toBeDefined();
    expect(found?.title).toBe('Тестовый курс');
  });

  test('getByUuid возвращает undefined для несуществующего', async () => {
    const path = coursePath();
    const repo = new ModuleJsonRepo(path);

    const found = await repo.getByUuid('550e8400-e29b-41d4-a716-446655440099');
    expect(found).toBeUndefined();
  });

  test('getAll возвращает все курсы', async () => {
    const path = join(tmpDir, 'courses-all.json');
    const repo = new ModuleJsonRepo(path);
    const c1 = makeCourse({ uuid: crypto.randomUUID() } as Partial<Course>);
    const c2 = makeCourse({
      uuid: crypto.randomUUID(),
      title: 'Второй',
    } as Partial<Course>);

    await repo.save(c1);
    await repo.save(c2);

    const all = await repo.getAll();
    expect(all).toHaveLength(2);
  });

  test('getAll с фильтром status', async () => {
    const path = join(tmpDir, 'courses-filter.json');
    const repo = new ModuleJsonRepo(path);
    const draft = makeCourse({ uuid: crypto.randomUUID() } as Partial<Course>);
    const pubUuid = crypto.randomUUID();
    const published = makeCourse({
      uuid: pubUuid,
      status: Status.PUBLISHED,
    } as Partial<Course>);

    await repo.save(draft);
    await repo.save(published);

    const filtered = await repo.getAll({ status: Status.PUBLISHED });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.uuid).toBe(pubUuid);
  });

  test('save перезаписывает существующий курс', async () => {
    const path = join(tmpDir, 'courses-update.json');
    const repo = new ModuleJsonRepo(path);
    const uuid = crypto.randomUUID();
    const course = makeCourse({ uuid } as Partial<Course>);
    await repo.save(course);

    const updated = { ...course, title: 'Обновлённый' };
    await repo.save(updated);

    const found = await repo.getByUuid(uuid);
    expect(found?.title).toBe('Обновлённый');
  });
});
