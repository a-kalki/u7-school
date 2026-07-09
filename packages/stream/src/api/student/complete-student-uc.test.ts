import { describe, expect, mock, test } from 'bun:test';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModuleResolver } from '#domain/module';
import type { TgFacade } from '#domain/tg-facade';
import { CompleteStudentUc } from './complete-student-uc';

const mockDate = '2026-06-01T10:00';
const STUDENT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const STUDENT_USER_ID = '11111111-1111-4111-8111-111111111111';
const MENTOR_ID = '66666666-6666-4666-8666-666666666666';
const STREAM_ID = '77777777-7777-4777-8777-777777777777';

describe('CompleteStudentUc', () => {
  function createMocks(mentorId = MENTOR_ID) {
    const mockStudentRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: STUDENT_ID,
          streamId: STREAM_ID,
          userId: STUDENT_USER_ID,
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
          uuid: STREAM_ID,
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
      getUserByUuid: mock((uuid: string) => {
        if (uuid === STUDENT_USER_ID) {
          return Promise.resolve({
            uuid: STUDENT_USER_ID,
            name: 'Student',
            telegramId: 12345,
            roles: [Role.STUDENT],
            createdAt: mockDate,
          });
        }
        return Promise.resolve({
          uuid: mentorId,
          name: 'Mentor',
          telegramId: 1,
          roles: [Role.MENTOR],
          createdAt: mockDate,
        });
      }),
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

    const resolver = {
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
      tgFacade: mockTgFacade,
    } as unknown as StreamApiModuleResolver;

    return { resolver, mockStudentRepo, mockUserFacade, mockTgFacade };
  }

  test('ментор завершает студента → advanced + −STUDENT + сообщение', async () => {
    const { resolver, mockStudentRepo, mockUserFacade, mockTgFacade } =
      createMocks();

    const uc = new CompleteStudentUc();
    uc.init(resolver);

    await uc.execute(
      {
        streamId: STREAM_ID,
        studentId: STUDENT_ID,
        outcome: 'advanced',
      },
      MENTOR_ID,
    );

    expect(mockStudentRepo.save).toHaveBeenCalled();
    const saved = (mockStudentRepo.save as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(saved.status).toBe('advanced');
    expect(saved.completionDetails).toEqual({ nextPreference: 'undecided' });

    expect(mockUserFacade.removeRoleFromUser).toHaveBeenCalledWith(
      STUDENT_USER_ID,
      Role.STUDENT,
      MENTOR_ID,
    );

    // TgFacade.sendMessage вызван с telegramId студента
    expect(mockTgFacade.sendMessage).toHaveBeenCalledWith(
      12345,
      'Ты завершил модуль. Хочешь записаться на следующий?',
    );
  });

  test('ментор завершает → not_advanced + сообщение', async () => {
    const { resolver, mockStudentRepo, mockUserFacade, mockTgFacade } =
      createMocks();

    const uc = new CompleteStudentUc();
    uc.init(resolver);

    await uc.execute(
      {
        streamId: STREAM_ID,
        studentId: STUDENT_ID,
        outcome: 'not_advanced',
      },
      MENTOR_ID,
    );

    const saved = (mockStudentRepo.save as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(saved.status).toBe('not_advanced');
    expect(mockUserFacade.removeRoleFromUser).toHaveBeenCalled();

    expect(mockTgFacade.sendMessage).toHaveBeenCalledWith(
      12345,
      'Ты завершил модуль, но не набрал проходной балл. Хочешь перезаписаться на этот же модуль?',
    );
  });

  test('ментор завершает → abandoned БЕЗ сообщения', async () => {
    const { resolver, mockStudentRepo, mockUserFacade, mockTgFacade } =
      createMocks();

    const uc = new CompleteStudentUc();
    uc.init(resolver);

    await uc.execute(
      {
        streamId: STREAM_ID,
        studentId: STUDENT_ID,
        outcome: 'abandoned',
      },
      MENTOR_ID,
    );

    const saved = (mockStudentRepo.save as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(saved.status).toBe('abandoned');
    expect(mockUserFacade.removeRoleFromUser).toHaveBeenCalled();

    // abandoned — сообщение НЕ отправляется
    expect(mockTgFacade.sendMessage).not.toHaveBeenCalled();
  });

  test('не-ментор → access denied', async () => {
    const { resolver } = createMocks('55555555-5555-4555-8555-555555555555');

    // Переопределяем getUserByUuid чтобы актор был не ментор
    const mockUserFacade = {
      ...resolver.userFacade,
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: '22222222-2222-4222-8222-222222222222',
          name: 'Student',
          telegramId: 2,
          roles: [Role.STUDENT],
          createdAt: mockDate,
        }),
      ),
    };

    const uc = new CompleteStudentUc();
    uc.init({ ...resolver, userFacade: mockUserFacade });

    await expect(
      uc.execute(
        {
          streamId: STREAM_ID,
          studentId: STUDENT_ID,
          outcome: 'advanced',
        },
        '22222222-2222-4222-8222-222222222222',
      ),
    ).rejects.toThrow();
  });
});
