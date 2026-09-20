import { describe, expect, mock, test } from 'bun:test';
import { AppException } from '@u7-scl/core/domain';
import type { StreamApiModule } from '#api/module';
import type { Student } from '#domain/student/entity';
import { StreamInProcFacade } from './stream-in-proc-facade';

const STREAM_ID = '11111111-1111-4111-8111-111111111111';
const MENTOR_ID = '66666666-6666-4666-8666-666666666666';
const mockDate = '2026-06-01T10:00';

function makeStream(): Record<string, unknown> {
  return {
    uuid: STREAM_ID,
    title: 'Поток',
    description: 'Описание',
    mentorId: MENTOR_ID,
    moduleId: '33333333-3333-4333-8333-333333333333',
    startDate: mockDate,
    status: 'completed',
    contentSnapshot: [],
    createdAt: mockDate,
  };
}

function makeStudent(
  uuid: string,
  userId: string,
  status: Student['status'],
  completedSteps = 0,
): Student {
  const steps = Array.from({ length: completedSteps }, (_, i) => ({
    stepId: `aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa0${i + 1}`,
    status: 'completed' as const,
    issuedAt: mockDate,
    completedAt: mockDate,
  }));
  return {
    uuid,
    streamId: STREAM_ID,
    userId,
    status,
    enrolledAt: mockDate,
    currentStepId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    steps,
    createdAt: mockDate,
  };
}

/** Мок API-модуля: маршрутизация двух команд по имени. */
function makeApi(
  stream: Record<string, unknown> | undefined,
  students: Student[],
) {
  return {
    execute: mock((ucName: string) => {
      if (ucName === 'get-stream') {
        if (!stream) {
          throw new AppException({
            name: 'STREAM_NOT_FOUND',
            level: 'domain',
            kind: 'not-found',
            message: 'Поток не найден',
            payload: { uuid: STREAM_ID },
          });
        }
        return Promise.resolve(stream);
      }
      if (ucName === 'list-stream-students') {
        return Promise.resolve(students);
      }
      return Promise.resolve(undefined);
    }),
  } as unknown as StreamApiModule;
}

describe('StreamInProcFacade.getMembers', () => {
  test('статусы участников: «прошёл»/«не прошёл» различаются, учёба и признак «не начал» (read-API, ФР-2)', async () => {
    const facade = new StreamInProcFacade(
      makeApi(makeStream(), [
        makeStudent(
          'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          '22222222-2222-4222-8222-222222222222',
          'advanced',
        ),
        makeStudent(
          'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          '33333333-3333-4333-8333-333333333333',
          'not_advanced',
        ),
        makeStudent(
          'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          '44444444-4444-4444-8444-444444444444',
          'enrolled',
        ),
        makeStudent(
          'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
          '55555555-5555-4555-8555-555555555555',
          'active',
        ),
        makeStudent(
          'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
          '88888888-8888-4888-8888-888888888888',
          'abandoned',
        ),
        makeStudent(
          'ffffffff-ffff-4fff-8fff-ffffffffffff',
          '99999999-9999-4999-8999-999999999999',
          'abandoned',
          1,
        ),
      ]),
    );

    const members = await facade.getMembers(STREAM_ID);

    expect(members?.mentorId).toBe(MENTOR_ID);
    expect(members?.students).toEqual([
      {
        userId: '22222222-2222-4222-8222-222222222222',
        status: 'advanced',
        neverStarted: false,
      },
      {
        userId: '33333333-3333-4333-8333-333333333333',
        status: 'not_advanced',
        neverStarted: false,
      },
      {
        userId: '44444444-4444-4444-8444-444444444444',
        status: 'enrolled',
        neverStarted: false,
      },
      {
        userId: '55555555-5555-4555-8555-555555555555',
        status: 'active',
        neverStarted: false,
      },
      {
        userId: '88888888-8888-4888-8888-888888888888',
        status: 'abandoned',
        neverStarted: true,
      },
      {
        userId: '99999999-9999-4999-8999-999999999999',
        status: 'abandoned',
        neverStarted: false,
      },
    ]);
  });

  test('поток не найден — undefined', async () => {
    const facade = new StreamInProcFacade(makeApi(undefined, []));

    expect(await facade.getMembers(STREAM_ID)).toBeUndefined();
  });
});
