import { describe, expect, test } from 'bun:test';
import { Status } from '@u7-scl/course/domain';
import { Role } from '@u7-scl/user/domain';
import { StreamStatus } from '../status';
import type { Stream } from './entity';
import { StreamPolicy } from './policy';

const syntaxModuleId = '33333333-3333-4333-8333-333333333333';
const algoModuleId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

// Моковый курс с двумя модулями в двух фазах
const mockCourse = {
  uuid: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  title: 'Основы JS',
  description: 'Курс по основам JS',
  authorId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  phases: [
    { title: 'Синтаксис', moduleIds: [syntaxModuleId] },
    { title: 'Алгоритмика', moduleIds: [algoModuleId] },
  ],
  status: Status.PUBLISHED,
  createdAt: '2026-01-01T00:00',
};

const mentorId = 'm1';

const mockStream = {
  uuid: 's1',
  title: 'Поток',
  description: 'Описание',
  mentorId,
  moduleId: 'mod1',
  startDate: '2026-06-01T12:00',
  status: StreamStatus.ACTIVE,
  createdAt: '2026-06-01T10:00',
  contentSnapshot: [],
};

describe('StreamPolicy', () => {
  test('canCreate — true для MENTOR', () => {
    const actor = {
      uuid: 'a1',
      name: 'Mentor',
      telegramId: 1,
      roles: [Role.MENTOR],
      createdAt: '2026-01-01T00:00:00Z',
    };
    expect(StreamPolicy.canCreate(actor)).toBe(true);
  });

  test('canCreate — false для GUEST', () => {
    const actor = {
      uuid: 'a1',
      name: 'Guest',
      telegramId: 2,
      roles: [Role.GUEST],
      createdAt: '2026-01-01T00:00:00Z',
    };
    expect(StreamPolicy.canCreate(actor)).toBe(false);
  });

  test('canRead — true для всех при ACTIVE', () => {
    const actor = {
      uuid: 'a2',
      name: 'Student',
      telegramId: 3,
      roles: [Role.STUDENT],
      createdAt: '2026-01-01T00:00:00Z',
    };
    expect(StreamPolicy.canRead(actor, mockStream)).toBe(true);
  });

  test('canEnroll — true для GUEST', () => {
    const actor = {
      uuid: 'a1',
      name: 'Guest',
      telegramId: 2,
      roles: [Role.GUEST],
      createdAt: '2026-01-01T00:00:00Z',
    };
    expect(StreamPolicy.canEnroll(actor)).toBe(true);
  });

  test('canEnroll — false для STUDENT', () => {
    const actor = {
      uuid: 'a1',
      name: 'Student',
      telegramId: 3,
      roles: [Role.STUDENT],
      createdAt: '2026-01-01T00:00:00Z',
    };
    expect(StreamPolicy.canEnroll(actor)).toBe(false);
  });
});

describe('StreamPolicy.canEnrollNextModule', () => {
  const mockStream = {
    uuid: 's-syntax',
    moduleId: syntaxModuleId,
  } as Stream;

  const mockStudentAdvanced = {
    uuid: 'st1',
    streamId: 's-syntax',
    userId: 'u1',
    enrolledAt: '2026-01-01T00:00:00.000Z',
    status: 'advanced' as const,
    currentStepId: 'step1',
    steps: [],
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  const mockStudentNotAdvanced = {
    ...mockStudentAdvanced,
    status: 'not_advanced' as const,
  };

  const mockStudentAbandoned = {
    ...mockStudentAdvanced,
    status: 'abandoned' as const,
  };

  test('входной модуль разрешён без завершённых потоков', () => {
    expect(
      StreamPolicy.canEnrollNextModule(mockCourse, syntaxModuleId, [], []),
    ).toBe(true);
  });

  test('предыдущий модуль завершён с advanced → разрешён', () => {
    expect(
      StreamPolicy.canEnrollNextModule(
        mockCourse,
        algoModuleId,
        [mockStudentAdvanced],
        [mockStream],
      ),
    ).toBe(true);
  });

  test('предыдущий модуль завершён с not_advanced → отказ', () => {
    expect(
      StreamPolicy.canEnrollNextModule(
        mockCourse,
        algoModuleId,
        [mockStudentNotAdvanced],
        [mockStream],
      ),
    ).toBe(false);
  });

  test('предыдущий модуль abandoned → отказ', () => {
    expect(
      StreamPolicy.canEnrollNextModule(
        mockCourse,
        algoModuleId,
        [mockStudentAbandoned],
        [mockStream],
      ),
    ).toBe(false);
  });

  test('нет записи на предыдущий модуль → отказ', () => {
    expect(
      StreamPolicy.canEnrollNextModule(mockCourse, algoModuleId, [], []),
    ).toBe(false);
  });

  test('модуль не найден в курсе → отказ', () => {
    expect(
      StreamPolicy.canEnrollNextModule(
        mockCourse,
        'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        [mockStudentAdvanced],
        [mockStream],
      ),
    ).toBe(false);
  });
});
