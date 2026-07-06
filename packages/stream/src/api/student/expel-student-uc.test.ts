import { describe, expect, mock, test } from 'bun:test';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModuleResolver } from '#domain/module';
import { ExpelStudentUc } from './expel-student-uc';

const mockDate = '2026-06-01T10:00';
const STREAM_ID = '11111111-1111-4111-8111-111111111111';
const STUDENT_ID = '77777777-7777-4777-8777-777777777777';
const USER_ID = '66666666-6666-4666-8666-666666666666';
const MENTOR_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_MENTOR_ID = '33333333-3333-4333-8333-333333333333';
const ADMIN_ID = '44444444-4444-4444-8444-444444444444';
const MODULE_ID = '55555555-5555-4555-8555-555555555555';
const STEP_ID = '88888888-8888-4888-8888-888888888888';

function mockStream(mentorId: string) {
  return {
    uuid: STREAM_ID,
    title: 'Test Stream',
    description: 'Desc',
    mentorId,
    moduleId: MODULE_ID,
    startDate: mockDate,
    status: 'active',
    contentSnapshot: [],
    createdAt: mockDate,
  };
}

function mockStudent(status = 'active') {
  return {
    uuid: STUDENT_ID,
    streamId: STREAM_ID,
    userId: USER_ID,
    enrolledAt: mockDate,
    status,
    currentStepId: STEP_ID,
    steps: [],
    createdAt: mockDate,
  };
}

function makeUserFacade(uuid: string, roles: Role[]) {
  return {
    getUserByUuid: mock(() =>
      Promise.resolve({
        uuid,
        name: 'User',
        telegramId: 1,
        roles,
        createdAt: mockDate,
      }),
    ),
    removeRoleFromUser: mock(() => Promise.resolve(undefined)),
    userExists: mock(() => Promise.resolve(true)),
    addRoleToUser: mock(() => Promise.resolve(undefined)),
    updateUserRole: mock(() => Promise.resolve(undefined)),
    getUserByTelegramId: mock(() => Promise.resolve(undefined)),
    registerGuest: mock(() => Promise.resolve({} as any)),
  };
}

describe('ExpelStudentUc', () => {
  test('ментор-владелец отчисляет → expelled, -STUDENT', async () => {
    const mockStudentRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(mockStudent('active'))),
      getByStream: mock(() => Promise.resolve([])),
      getByUser: mock(() => Promise.resolve([])),
    };
    const mockStreamRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(mockStream(MENTOR_ID))),
      getAll: mock(() => Promise.resolve([])),
    };
    const userFacade = makeUserFacade(MENTOR_ID, [Role.MENTOR]);

    const uc = new ExpelStudentUc();
    uc.init({
      streamStudentRepo: mockStudentRepo,
      streamRepo: mockStreamRepo,
      userFacade,
      courseFacade: {},
    } as unknown as StreamApiModuleResolver);

    await uc.execute({ streamId: STREAM_ID, studentId: STUDENT_ID }, MENTOR_ID);

    expect(mockStudentRepo.save).toHaveBeenCalled();
    expect(userFacade.removeRoleFromUser).toHaveBeenCalledWith(
      USER_ID,
      Role.STUDENT,
    );
  });

  test('чужой ментор — ошибка доступа', async () => {
    const mockStudentRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(mockStudent('active'))),
      getByStream: mock(() => Promise.resolve([])),
      getByUser: mock(() => Promise.resolve([])),
    };
    const mockStreamRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(mockStream(OTHER_MENTOR_ID))),
      getAll: mock(() => Promise.resolve([])),
    };
    const userFacade = makeUserFacade(MENTOR_ID, [Role.MENTOR]);

    const uc = new ExpelStudentUc();
    uc.init({
      streamStudentRepo: mockStudentRepo,
      streamRepo: mockStreamRepo,
      userFacade,
      courseFacade: {},
    } as unknown as StreamApiModuleResolver);

    await expect(
      uc.execute({ streamId: STREAM_ID, studentId: STUDENT_ID }, MENTOR_ID),
    ).rejects.toThrow();
  });

  test('админ отчисляет — успех', async () => {
    const mockStudentRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(mockStudent('active'))),
      getByStream: mock(() => Promise.resolve([])),
      getByUser: mock(() => Promise.resolve([])),
    };
    const mockStreamRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(mockStream(MENTOR_ID))),
      getAll: mock(() => Promise.resolve([])),
    };
    const userFacade = makeUserFacade(ADMIN_ID, [Role.ADMIN]);

    const uc = new ExpelStudentUc();
    uc.init({
      streamStudentRepo: mockStudentRepo,
      streamRepo: mockStreamRepo,
      userFacade,
      courseFacade: {},
    } as unknown as StreamApiModuleResolver);

    await uc.execute({ streamId: STREAM_ID, studentId: STUDENT_ID }, ADMIN_ID);

    expect(mockStudentRepo.save).toHaveBeenCalled();
    expect(userFacade.removeRoleFromUser).toHaveBeenCalledWith(
      USER_ID,
      Role.STUDENT,
    );
  });

  test('запись студента сохраняется после отчисления (не удаляется)', async () => {
    const savedState: unknown[] = [];
    const mockStudentRepo = {
      save: mock((state: unknown) => {
        savedState.push(state);
        return Promise.resolve();
      }),
      getByUuid: mock(() => Promise.resolve(mockStudent('active'))),
      getByStream: mock(() => Promise.resolve([])),
      getByUser: mock(() => Promise.resolve([])),
    };
    const mockStreamRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(mockStream(MENTOR_ID))),
      getAll: mock(() => Promise.resolve([])),
    };
    const userFacade = makeUserFacade(MENTOR_ID, [Role.MENTOR]);

    const uc = new ExpelStudentUc();
    uc.init({
      streamStudentRepo: mockStudentRepo,
      streamRepo: mockStreamRepo,
      userFacade,
      courseFacade: {},
    } as unknown as StreamApiModuleResolver);

    await uc.execute({ streamId: STREAM_ID, studentId: STUDENT_ID }, MENTOR_ID);

    expect(savedState).toHaveLength(1);
    const saved = savedState[0] as Record<string, unknown>;
    expect(saved.status).toBe('expelled');
    expect(saved.uuid).toBe(STUDENT_ID);
  });
});
