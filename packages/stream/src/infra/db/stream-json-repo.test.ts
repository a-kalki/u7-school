import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { StreamStatus } from '#domain/status';
import type { Stream } from '#domain/stream/entity';
import { StreamJsonRepo } from './stream-json-repo';

function makeStream(
  uuid: string,
  schoolId: string,
  mentorId: string,
  status: Stream['status'] = StreamStatus.ENROLLMENT,
): Stream {
  return {
    uuid,
    schoolId,
    title: `Поток ${uuid}`,
    description: `Описание ${uuid}`,
    mentorId,
    moduleId: '770e8400-e29b-41d4-a716-446655440003',
    startDate: '2026-06-01T12:00',
    status,
    contentSnapshot: [],
    createdAt: '2026-06-01T10:00',
  };
}

describe('StreamJsonRepo', () => {
  let dir: string;

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'u7-streams-'));
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  test('фильтрует потоки по schoolId', async () => {
    const repo = new StreamJsonRepo(join(dir, 'streams.json'));
    const schoolA = 'a0000000-0000-4000-8000-000000000001';
    const schoolB = 'b0000000-0000-4000-8000-000000000002';
    const mentorId = '660e8400-e29b-41d4-a716-446655440002';

    await repo.save(
      makeStream('550e8400-e29b-41d4-a716-446655440001', schoolA, mentorId),
    );
    await repo.save(
      makeStream('550e8400-e29b-41d4-a716-446655440002', schoolA, mentorId),
    );
    await repo.save(
      makeStream('550e8400-e29b-41d4-a716-446655440003', schoolB, mentorId),
    );

    const streamsA = await repo.getAll({ schoolId: schoolA });
    expect(streamsA.length).toBe(2);
    expect(streamsA.every((s) => s.schoolId === schoolA)).toBe(true);

    const streamsB = await repo.getAll({ schoolId: schoolB });
    expect(streamsB.length).toBe(1);
    expect(streamsB[0]?.schoolId).toBe(schoolB);
  });
});
