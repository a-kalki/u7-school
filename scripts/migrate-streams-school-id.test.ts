import { describe, expect, test } from 'bun:test';
import { U7_SCHOOL_ID } from '@u7-scl/app/domain';
import { migrateStreamsData } from './migrate-streams-school-id';

describe('migrateStreamsData', () => {
  test('проставляет U7_SCHOOL_ID потокам без schoolId', () => {
    const rawStreams = [
      { uuid: 'stream-1', title: 'Поток 1' },
      { uuid: 'stream-2', title: 'Поток 2' },
    ];

    const { updatedStreams, result } = migrateStreamsData(rawStreams);

    expect(result.total).toBe(2);
    expect(result.migrated).toBe(2);
    expect(result.alreadyHadSchoolId).toBe(0);
    expect(updatedStreams[0]?.schoolId).toBe(U7_SCHOOL_ID);
    expect(updatedStreams[1]?.schoolId).toBe(U7_SCHOOL_ID);
  });

  test('идемпотентность: не меняет потоки, у которых уже есть schoolId', () => {
    const existingSchoolId = '99999999-9999-4999-8999-999999999999';
    const rawStreams = [
      { uuid: 'stream-1', schoolId: existingSchoolId, title: 'Поток 1' },
      { uuid: 'stream-2', title: 'Поток 2' },
    ];

    const { updatedStreams, result } = migrateStreamsData(rawStreams);

    expect(result.total).toBe(2);
    expect(result.migrated).toBe(1);
    expect(result.alreadyHadSchoolId).toBe(1);
    expect(updatedStreams[0]?.schoolId).toBe(existingSchoolId);
    expect(updatedStreams[1]?.schoolId).toBe(U7_SCHOOL_ID);
  });

  test('пустой список потоков', () => {
    const { updatedStreams, result } = migrateStreamsData([]);

    expect(result.total).toBe(0);
    expect(result.migrated).toBe(0);
    expect(result.alreadyHadSchoolId).toBe(0);
    expect(updatedStreams.length).toBe(0);
  });
});
