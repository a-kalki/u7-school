import { describe, expect, mock, test } from 'bun:test';
import { isoNow } from '@u7-scl/core/shared';
import { GetStudentByUserUc } from './get-student-by-user-uc';

const userId = '66666666-6666-4666-8666-666666666666';
const streamId = '55555555-5555-4555-8555-555555555555';

const activeStudent = {
  uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  streamId,
  userId,
  enrolledAt: isoNow(),
  status: 'active' as const,
  currentStepId: '11111111-1111-4111-8111-111111111111',
  steps: [],
  createdAt: isoNow(),
};

const advancedStudent = {
  uuid: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  streamId: 'another-stream-id',
  userId,
  enrolledAt: isoNow(),
  status: 'advanced' as const,
  currentStepId: '22222222-2222-4222-8222-222222222222',
  steps: [],
  createdAt: isoNow(),
};

const baseResolve = (overrides: Record<string, unknown> = {}) =>
  ({
    streamRepo: {
      getByUuid: mock(() => Promise.resolve(undefined)),
      save: mock(() => Promise.resolve()),
      getAll: mock(() => Promise.resolve([])),
    },
    streamStudentRepo: {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(undefined)),
      getByStream: mock(() => Promise.resolve([])),
      getByUser: mock(() => Promise.resolve([activeStudent])),
    },
    userFacade: {
      getUserByUuid: mock(() => Promise.resolve(undefined)),
      userExists: mock(() => Promise.resolve(false)),
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

describe('GetStudentByUserUc', () => {
  test('возвращает активную запись студента', async () => {
    const uc = new GetStudentByUserUc();
    uc.init(baseResolve());

    const result = await uc.execute({ userId });
    expect(result.uuid).toBe(activeStudent.uuid);
    expect(result.status).toBe('active');
    expect(result.userId).toBe(userId);
  });

  test('возвращает активную запись если есть несколько записей с разными статусами', async () => {
    const resolve = baseResolve({
      streamStudentRepo: {
        save: mock(() => Promise.resolve()),
        getByUuid: mock(() => Promise.resolve(undefined)),
        getByStream: mock(() => Promise.resolve([])),
        getByUser: mock(() =>
          Promise.resolve([advancedStudent, activeStudent]),
        ),
      },
    });

    const uc = new GetStudentByUserUc();
    uc.init(resolve);

    const result = await uc.execute({ userId });
    expect(result.status).toBe('active');
  });

  test('возвращает advanced-запись если active нет', async () => {
    const resolve = baseResolve({
      streamStudentRepo: {
        save: mock(() => Promise.resolve()),
        getByUuid: mock(() => Promise.resolve(undefined)),
        getByStream: mock(() => Promise.resolve([])),
        getByUser: mock(() => Promise.resolve([advancedStudent])),
      },
    });

    const uc = new GetStudentByUserUc();
    uc.init(resolve);

    const result = await uc.execute({ userId });
    expect(result.status).toBe('advanced');
  });

  test('ошибка если записей пользователя нет совсем', async () => {
    const resolve = baseResolve({
      streamStudentRepo: {
        save: mock(() => Promise.resolve()),
        getByUuid: mock(() => Promise.resolve(undefined)),
        getByStream: mock(() => Promise.resolve([])),
        getByUser: mock(() => Promise.resolve([])),
      },
    });

    const uc = new GetStudentByUserUc();
    uc.init(resolve);

    await expect(uc.execute({ userId })).rejects.toThrow(
      'Активная запись студента не найдена',
    );
  });

  test('возвращает enrolled-запись если active нет', async () => {
    const enrolledStudent = {
      ...activeStudent,
      uuid: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      status: 'enrolled' as const,
    };

    const uc = new GetStudentByUserUc();
    uc.init(
      baseResolve({
        streamStudentRepo: {
          ...baseResolve().streamStudentRepo,
          getByUser: mock(() => Promise.resolve([enrolledStudent])),
        },
      }),
    );

    const result = await uc.execute({ userId });
    expect(result.status).toBe('enrolled');
  });
});
