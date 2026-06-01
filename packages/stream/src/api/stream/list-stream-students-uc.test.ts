import { describe, expect, mock, test } from 'bun:test';
import { isoNow } from '@u7-scl/core/shared';
import { Role } from '@u7-scl/user/domain';
import { StreamStatus } from '#domain/status';
import { ListStreamStudentsUc } from './list-stream-students-uc';

const streamId = '55555555-5555-4555-8555-555555555555';
const mentorId = '33333333-3333-4333-8333-333333333333';
const modId = '44444444-4444-4444-8444-444444444444';

const mockStream = {
  uuid: streamId,
  title: 'Поток',
  description: 'Описание',
  mentorId,
  moduleId: modId,
  startDate: '2026-06-01T12:00',
  status: StreamStatus.ACTIVE,
  contentSnapshot: [],
  createdAt: isoNow(),
};

const student1 = {
  uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  streamId,
  userId: 'u1',
  enrolledAt: isoNow(),
  status: 'active' as const,
  currentStepId: 's1',
  steps: [],
  createdAt: isoNow(),
};

const student2 = {
  uuid: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  streamId,
  userId: 'u2',
  enrolledAt: isoNow(),
  status: 'active' as const,
  currentStepId: 's2',
  steps: [],
  createdAt: isoNow(),
};

const mentor = {
  uuid: mentorId,
  name: 'Mentor',
  telegramId: 1,
  roles: [Role.MENTOR],
  createdAt: isoNow(),
};

const guest = {
  uuid: 'gggggggg-gggg-4ggg-8ggg-gggggggggggg',
  name: 'Guest',
  telegramId: 2,
  roles: [Role.GUEST],
  createdAt: isoNow(),
};

const baseResolve = (overrides: Record<string, unknown> = {}) =>
  ({
    streamRepo: {
      getByUuid: mock(() => Promise.resolve(mockStream)),
      save: mock(() => Promise.resolve()),
      getAll: mock(() => Promise.resolve([])),
    },
    streamStudentRepo: {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(undefined)),
      getByStream: mock(() => Promise.resolve([student1, student2])),
      getByUser: mock(() => Promise.resolve([])),
    },
    userFacade: {
      getUserByUuid: mock(() => Promise.resolve(mentor)),
      userExists: mock(() => Promise.resolve(true)),
      addRoleToUser: mock(() => Promise.resolve()),
      updateUserRole: mock(() => Promise.resolve()),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve()),
      registerGuest: mock(() => Promise.resolve({} as any)),
    },
    courseFacade: {
      getModuleSnapshot: mock(() => Promise.resolve([])),
    },
    ...overrides,
  }) as any;

describe('ListStreamStudentsUc', () => {
  test('ментор потока видит список студентов', async () => {
    const uc = new ListStreamStudentsUc();
    uc.init(baseResolve());

    const result = await uc.execute({ streamId }, mentorId);
    expect(result).toHaveLength(2);
    expect(result[0].userId).toBe('u1');
    expect(result[1].userId).toBe('u2');
  });

  test('пустой список если студентов нет', async () => {
    const resolve = baseResolve({
      streamStudentRepo: {
        getByStream: mock(() => Promise.resolve([])),
        save: mock(() => Promise.resolve()),
        getByUuid: mock(() => Promise.resolve(undefined)),
        getByUser: mock(() => Promise.resolve([])),
      },
    });

    const uc = new ListStreamStudentsUc();
    uc.init(resolve);

    const result = await uc.execute({ streamId }, mentorId);
    expect(result).toHaveLength(0);
  });

  test('доступ запрещён для не-ментора', async () => {
    const resolve = baseResolve({
      userFacade: {
        getUserByUuid: mock(() => Promise.resolve(guest)),
        userExists: mock(() => Promise.resolve(true)),
        addRoleToUser: mock(() => Promise.resolve()),
        updateUserRole: mock(() => Promise.resolve()),
        getUserByTelegramId: mock(() => Promise.resolve(undefined)),
        removeRoleFromUser: mock(() => Promise.resolve()),
        registerGuest: mock(() => Promise.resolve({} as any)),
      },
    });

    const uc = new ListStreamStudentsUc();
    uc.init(resolve);

    await expect(uc.execute({ streamId }, guest.uuid)).rejects.toThrow(
      'Недостаточно прав для выполнения действия',
    );
  });
});
