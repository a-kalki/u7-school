import { describe, expect, test } from 'bun:test';
import { Status } from '@u7-scl/course/domain';
import { Role } from '@u7-scl/user/domain';
import { StreamStatus } from '../status';
import { StreamPolicy } from './policy';

// Моковый курс с двумя модулями в двух фазах
const mockCourse = {
  uuid: 'c1',
  title: 'Основы JS',
  description: 'Курс по основам JS',
  authorId: 'a1',
  phases: [
    { title: 'Синтаксис', moduleIds: ['mod-syntax'] },
    { title: 'Алгоритмика', moduleIds: ['mod-algo'] },
  ],
  status: Status.PUBLISHED,
  createdAt: '2026-01-01T00:00:00.000Z',
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
  test('входной модуль разрешён без завершённых потоков', () => {
    expect(StreamPolicy.canEnrollNextModule(mockCourse, 'mod-syntax', [])).toBe(
      true,
    );
  });

  test('предыдущий модуль завершён с advanced → разрешён', () => {
    const completedRecords = [
      { streamId: 's1', moduleId: 'mod-syntax', status: 'advanced' },
    ];
    expect(
      StreamPolicy.canEnrollNextModule(
        mockCourse,
        'mod-algo',
        completedRecords,
      ),
    ).toBe(true);
  });

  test('предыдущий модуль завершён с not_advanced → отказ', () => {
    const completedRecords = [
      { streamId: 's1', moduleId: 'mod-syntax', status: 'not_advanced' },
    ];
    expect(
      StreamPolicy.canEnrollNextModule(
        mockCourse,
        'mod-algo',
        completedRecords,
      ),
    ).toBe(false);
  });

  test('предыдущий модуль abandoned → отказ', () => {
    const completedRecords = [
      { streamId: 's1', moduleId: 'mod-syntax', status: 'abandoned' },
    ];
    expect(
      StreamPolicy.canEnrollNextModule(
        mockCourse,
        'mod-algo',
        completedRecords,
      ),
    ).toBe(false);
  });

  test('нет записи на предыдущий модуль → отказ', () => {
    expect(StreamPolicy.canEnrollNextModule(mockCourse, 'mod-algo', [])).toBe(
      false,
    );
  });

  test('модуль не найден в курсе → отказ', () => {
    const completedRecords = [
      { streamId: 's1', moduleId: 'mod-syntax', status: 'advanced' },
    ];
    expect(
      StreamPolicy.canEnrollNextModule(
        mockCourse,
        'mod-unknown',
        completedRecords,
      ),
    ).toBe(false);
  });
});
