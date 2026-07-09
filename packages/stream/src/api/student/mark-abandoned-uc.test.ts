import { describe, expect, mock, test } from 'bun:test';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModuleResolver } from '#domain/module';
import type { TgFacade } from '#domain/tg-facade';
import { MarkAbandonedUc } from './mark-abandoned-uc';

const mockDate = '2026-06-01T10:00';

describe('MarkAbandonedUc', () => {
  test('ментор отчисляет студента: active→abandoned(by_mentor), STUDENT снят', async () => {
    const mockStudentRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: 'student-1',
          streamId: 'stream-1',
          userId: 'user-1',
          status: 'active',
          enrolledAt: mockDate,
          currentStepId: 'step-1',
          steps: [],
          createdAt: mockDate,
        }),
      ),
      save: mock(() => Promise.resolve()),
      getByUser: mock(() => Promise.resolve([])),
      getByStream: mock(() => Promise.resolve([])),
    };

    const mockStreamRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: 'stream-1',
          title: 'Test Stream',
          mentorId: 'mentor-1',
          moduleId: 'module-1',
          startDate: mockDate,
          status: 'active',
          contentSnapshot: [],
          createdAt: mockDate,
        }),
      ),
    };

    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: 'mentor-1',
          name: 'Mentor',
          telegramId: 1,
          roles: [Role.MENTOR],
          createdAt: mockDate,
        }),
      ),
      removeRoleFromUser: mock(() => Promise.resolve()),
      userExists: mock(() => Promise.resolve(true)),
      addRoleToUser: mock(() => Promise.resolve()),
      updateUserRole: mock(() => Promise.resolve({})),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as never)),
    };

    const mockTgFacade: TgFacade = {
      sendMessage: mock(() => Promise.resolve()),
      sendBatch: mock(() => Promise.resolve()),
    };

    const uc = new MarkAbandonedUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
      tgFacade: mockTgFacade,
    } as unknown as StreamApiModuleResolver);

    await uc.execute(
      {
        streamId: 'stream-1',
        studentId: 'student-1',
        cause: 'by_mentor',
      },
      'mentor-1',
    );

    expect(mockStudentRepo.save).toHaveBeenCalled();
    const saved = (mockStudentRepo.save as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(saved.status).toBe('abandoned');
    expect(saved.abandonDetails).toEqual({
      who: 'mentor',
      cause: 'by_mentor',
    });

    expect(mockUserFacade.removeRoleFromUser).toHaveBeenCalledWith(
      'user-1',
      Role.STUDENT,
    );
  });

  test('ментор отчисляет за неактивность', async () => {
    const mockStudentRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: 'student-1',
          streamId: 'stream-1',
          userId: 'user-1',
          status: 'active',
          enrolledAt: mockDate,
          currentStepId: 'step-1',
          steps: [],
          createdAt: mockDate,
        }),
      ),
      save: mock(() => Promise.resolve()),
      getByUser: mock(() => Promise.resolve([])),
      getByStream: mock(() => Promise.resolve([])),
    };

    const mockStreamRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: 'stream-1',
          title: 'Test Stream',
          mentorId: 'mentor-1',
          moduleId: 'module-1',
          startDate: mockDate,
          status: 'active',
          contentSnapshot: [],
          createdAt: mockDate,
        }),
      ),
    };

    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: 'mentor-1',
          name: 'Mentor',
          telegramId: 1,
          roles: [Role.MENTOR],
          createdAt: mockDate,
        }),
      ),
      removeRoleFromUser: mock(() => Promise.resolve()),
      userExists: mock(() => Promise.resolve(true)),
      addRoleToUser: mock(() => Promise.resolve()),
      updateUserRole: mock(() => Promise.resolve({})),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as never)),
    };

    const uc = new MarkAbandonedUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
      tgFacade: {},
    } as unknown as StreamApiModuleResolver);

    await uc.execute(
      {
        streamId: 'stream-1',
        studentId: 'student-1',
        cause: 'inactivity',
      },
      'mentor-1',
    );

    const saved = (mockStudentRepo.save as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(saved.abandonDetails).toEqual({
      who: 'mentor',
      cause: 'inactivity',
    });
  });

  test('не-ментор не может отчислить', async () => {
    const mockStudentRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: 'student-1',
          streamId: 'stream-1',
          userId: 'user-1',
          status: 'active',
          enrolledAt: mockDate,
          currentStepId: 'step-1',
          steps: [],
          createdAt: mockDate,
        }),
      ),
    };

    const mockStreamRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: 'stream-1',
          title: 'Test Stream',
          mentorId: 'mentor-1',
          moduleId: 'module-1',
          startDate: mockDate,
          status: 'active',
          contentSnapshot: [],
          createdAt: mockDate,
        }),
      ),
    };

    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: 'user-2',
          name: 'Student',
          telegramId: 2,
          roles: [Role.STUDENT],
          createdAt: mockDate,
        }),
      ),
    };

    const uc = new MarkAbandonedUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
      tgFacade: {},
    } as unknown as StreamApiModuleResolver);

    await expect(
      uc.execute(
        {
          streamId: 'stream-1',
          studentId: 'student-1',
          cause: 'by_mentor',
        },
        'user-2',
      ),
    ).rejects.toThrow();
  });
});
