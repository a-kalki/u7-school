import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Student } from '#domain/student/entity';
import { StudentJsonRepo } from './student-json-repo';

/** Студент с минимумом полей для тестов выборки по статусам. */
function makeStudent(uuid: string, status: Student['status']): Student {
  return {
    uuid,
    streamId: '77777777-7777-4777-8777-777777777777',
    userId: '11111111-1111-4111-8111-111111111111',
    enrolledAt: '2026-06-01T00:00',
    status,
    currentStepId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
    steps: [],
    createdAt: '2026-06-01T00:00',
  };
}

const UUIDS = [
  '11111111-1111-4111-8111-1111111111a1',
  '22222222-2222-4222-8222-2222222222a2',
  '33333333-3333-4333-8333-3333333333a3',
  '44444444-4444-4444-8444-4444444444a4',
  '55555555-5555-4555-8555-5555555555a5',
  '66666666-6666-4666-8666-6666666666b1',
] as const;

describe('StudentJsonRepo.getByStatuses', () => {
  let dir: string;

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'u7-students-'));
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test('возвращает только студентов с указанными статусами', async () => {
    const repo = new StudentJsonRepo(join(dir, 'statuses.json'));
    await repo.save(makeStudent(UUIDS[0], 'active'));
    await repo.save(makeStudent(UUIDS[1], 'enrolled'));
    await repo.save(makeStudent(UUIDS[2], 'abandoned'));
    await repo.save(makeStudent(UUIDS[3], 'advanced'));
    await repo.save(makeStudent(UUIDS[4], 'not_advanced'));

    const active = await repo.getByStatuses(['active', 'enrolled']);
    expect(active.map((s) => s.uuid).sort()).toEqual([UUIDS[0], UUIDS[1]]);

    const abandoned = await repo.getByStatuses(['abandoned']);
    expect(abandoned.map((s) => s.uuid)).toEqual([UUIDS[2]]);
  });

  test('пустой результат для несовпавших статусов', async () => {
    const repo = new StudentJsonRepo(join(dir, 'empty.json'));
    await repo.save(makeStudent(UUIDS[5], 'advanced'));

    const result = await repo.getByStatuses(['active', 'enrolled']);
    expect(result).toEqual([]);
  });
});
