import { describe, expect, mock, test } from 'bun:test';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModuleResolver } from '#domain/module';
import { CompleteStudentUc } from './complete-student-uc';

const mockDate = '2026-06-01T10:00';

describe('CompleteStudentUc', () => {
  function createMocks(mentorId = 'mentor-1') {
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
          mentorId,
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
          uuid: mentorId,
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

    return { mockStudentRepo, mockStreamRepo, mockUserFacade };
  }

  test('ментор завершает студента → advanced + −STUDENT', async () => {
    const { mockStudentRepo, mockStreamRepo, mockUserFacade } = createMocks();

    const uc = new CompleteStudentUc();
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
        outcome: 'advanced',
      },
      'mentor-1',
    );

    expect(mockStudentRepo.save).toHaveBeenCalled();
    const saved = (mockStudentRepo.save as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(saved.status).toBe('advanced');
    expect(saved.completionDetails).toEqual({
      nextPreference: 'undecided',
    });

    expect(mockUserFacade.removeRoleFromUser).toHaveBeenCalledWith(
      'user-1',
      Role.STUDENT,
    );
  });

  test('ментор завершает → not_advanced + −STUDENT', async () => {
    const { mockStudentRepo, mockStreamRepo, mockUserFacade } = createMocks();

    const uc = new CompleteStudentUc();
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
        outcome: 'not_advanced',
      },
      'mentor-1',
    );

    const saved = (mockStudentRepo.save as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(saved.status).toBe('not_advanced');
    expect(mockUserFacade.removeRoleFromUser).toHaveBeenCalledWith(
      'user-1',
      Role.STUDENT,
    );
  });

  test('ментор завершает → abandoned + −STUDENT', async () => {
    const { mockStudentRepo, mockStreamRepo, mockUserFacade } = createMocks();

    const uc = new CompleteStudentUc();
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
        outcome: 'abandoned',
      },
      'mentor-1',
    );

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

  test('не-ментор → access denied', async () => {
    const { mockStudentRepo, mockStreamRepo, mockUserFacade } = createMocks(
      'other-mentor',
    );

    mockUserFacade.getUserByUuid = mock(() =>
      Promise.resolve({
        uuid: 'user-2',
        name: 'Student',
        telegramId: 2,
        roles: [Role.STUDENT],
        createdAt: mockDate,
      }),
    );

    const uc = new CompleteStudentUc();
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
          outcome: 'advanced',
        },
        'user-2',
      ),
    ).rejects.toThrow();
  });
});
