import { describe, expect, mock, test } from 'bun:test';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModuleResolver } from '#domain/module';
import { CompleteStudentUc } from './complete-student-uc';

const mockDate = '2026-06-01T10:00';

describe('CompleteStudentUc', () => {
  function createMocks(mentorId = '66666666-6666-4666-8666-666666666666') {
    const mockStudentRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          streamId: '77777777-7777-4777-8777-777777777777',
          userId: '11111111-1111-4111-8111-111111111111',
          status: 'active',
          enrolledAt: mockDate,
          currentStepId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
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
          uuid: '77777777-7777-4777-8777-777777777777',
          title: 'Test Stream',
          description: 'Test Description',
          mentorId,
          moduleId: '33333333-3333-4333-8333-333333333333',
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
        streamId: '77777777-7777-4777-8777-777777777777',
        studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        outcome: 'advanced',
      },
      '66666666-6666-4666-8666-666666666666',
    );

    expect(mockStudentRepo.save).toHaveBeenCalled();
    const saved = (mockStudentRepo.save as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(saved.status).toBe('advanced');
    expect(saved.completionDetails).toEqual({
      nextPreference: 'undecided',
    });

    expect(mockUserFacade.removeRoleFromUser).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
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
        streamId: '77777777-7777-4777-8777-777777777777',
        studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        outcome: 'not_advanced',
      },
      '66666666-6666-4666-8666-666666666666',
    );

    const saved = (mockStudentRepo.save as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(saved.status).toBe('not_advanced');
    expect(mockUserFacade.removeRoleFromUser).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
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
        streamId: '77777777-7777-4777-8777-777777777777',
        studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        outcome: 'abandoned',
      },
      '66666666-6666-4666-8666-666666666666',
    );

    const saved = (mockStudentRepo.save as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(saved.status).toBe('abandoned');
    expect(saved.abandonDetails).toEqual({
      who: 'mentor',
      cause: 'by_mentor',
    });
    expect(mockUserFacade.removeRoleFromUser).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      Role.STUDENT,
    );
  });

  test('не-ментор → access denied', async () => {
    const { mockStudentRepo, mockStreamRepo, mockUserFacade } = createMocks(
      '55555555-5555-4555-8555-555555555555',
    );

    mockUserFacade.getUserByUuid = mock(() =>
      Promise.resolve({
        uuid: '22222222-2222-4222-8222-222222222222',
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
          streamId: '77777777-7777-4777-8777-777777777777',
          studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          outcome: 'advanced',
        },
        '22222222-2222-4222-8222-222222222222',
      ),
    ).rejects.toThrow();
  });
});
