import { describe, expect, mock, test } from 'bun:test';
import { isoNow } from '@u7-scl/core/shared';
import { Role } from '@u7-scl/user/domain';
import { StreamStatus } from '#domain/status';
import { GetStudentProgressUc } from './get-student-progress-uc';

const streamId = '55555555-5555-4555-8555-555555555555';
const studentId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const userId = '66666666-6666-4666-8666-666666666666';
const mentorId = '33333333-3333-4333-8333-333333333333';

const mockStudent = {
  uuid: studentId,
  streamId,
  userId,
  enrolledAt: isoNow(),
  status: 'active' as const,
  currentStepId: 's1',
  steps: [],
  createdAt: isoNow(),
};

const mentor = {
  uuid: mentorId,
  name: 'M',
  telegramId: 1,
  roles: [Role.MENTOR],
  createdAt: isoNow(),
};
const student = {
  uuid: userId,
  name: 'S',
  telegramId: 3,
  roles: [Role.STUDENT],
  createdAt: isoNow(),
};
const otherStudent = {
  uuid: 'other',
  name: 'O',
  telegramId: 4,
  roles: [Role.STUDENT],
  createdAt: isoNow(),
};

const mockStream = {
  uuid: streamId,
  title: 'T',
  description: 'D',
  mentorId,
  moduleId: '44444444-4444-4444-8444-444444444444',
  startDate: '2026-06-01T12:00',
  status: StreamStatus.ACTIVE,
  contentSnapshot: [],
  createdAt: isoNow(),
};

const baseResolve = (u: any = student, s: any = undefined) =>
  ({
    streamRepo: {
      getByUuid: mock(() => Promise.resolve(s)),
      save: mock(() => Promise.resolve()),
      getAll: mock(() => Promise.resolve([])),
    },
    streamStudentRepo: {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(mockStudent)),
      getByStream: mock(() => Promise.resolve([])),
      getByUser: mock(() => Promise.resolve([])),
    },
    userFacade: {
      getUserByUuid: mock(() => Promise.resolve(u)),
      userExists: mock(() => Promise.resolve(true)),
      addRoleToUser: mock(() => Promise.resolve()),
      updateUserRole: mock(() => Promise.resolve()),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve()),
      registerGuest: mock(() => Promise.resolve({})),
    },
    courseFacade: { getModuleSnapshot: mock(() => Promise.resolve([])) },
  }) as any;

describe('GetStudentProgressUc', () => {
  test('сам студент видит свой прогресс', async () => {
    const uc = new GetStudentProgressUc();
    uc.init(baseResolve());
    const result = await uc.execute({ studentId }, userId);
    expect(result.uuid).toBe(studentId);
  });

  test('любой пользователь видит прогресс студента (публичный доступ)', async () => {
    const uc = new GetStudentProgressUc();
    uc.init(baseResolve(otherStudent));
    const result = await uc.execute({ studentId }, 'other');
    expect(result.uuid).toBe(studentId);
  });

  test('ментор видит прогресс студента', async () => {
    const uc = new GetStudentProgressUc();
    uc.init(baseResolve(mentor, mockStream));
    const result = await uc.execute({ studentId }, mentorId);
    expect(result.uuid).toBe(studentId);
  });
});
