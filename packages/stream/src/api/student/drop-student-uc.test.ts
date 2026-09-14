import { describe, expect, mock, test } from 'bun:test';
import { Role, type User } from '@u7-scl/app/domain';
import type { StreamApiModuleResolver } from '#domain/module';
import { DropStudentUc } from './drop-student-uc';

function makeActor(uuid: string): User {
  return {
    uuid,
    name: 'Актор',
    telegramId: 1,
    roles: [Role.MENTOR],
    createdAt: '2026-01-01T00:00',
  };
}

const mockDate = '2026-06-01T10:00';

describe('DropStudentUc', () => {
  test('студент выходит из потока: active→abandoned(voluntary), STUDENT снят', async () => {
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

    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: '11111111-1111-4111-8111-111111111111',
          name: 'Student',
          telegramId: 1,
          roles: [Role.STUDENT],
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

    const uc = new DropStudentUc();
    uc.init({
      streamRepo: { getByUuid: mock(() => Promise.resolve(undefined)) },
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
    } as unknown as StreamApiModuleResolver);

    await uc.execute(
      {
        streamId: '77777777-7777-4777-8777-777777777777',
        studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      },
      makeActor('11111111-1111-4111-8111-111111111111'),
    );

    // studentRepo.save был вызван
    expect(mockStudentRepo.save).toHaveBeenCalled();
    const saved = (mockStudentRepo.save as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(saved.status).toBe('abandoned');
    expect(saved.abandonDetails).toEqual({
      who: 'self',
      cause: 'voluntary',
    });

    // STUDENT роль снята
    expect(mockUserFacade.removeRoleFromUser).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      Role.STUDENT,
      makeActor('11111111-1111-4111-8111-111111111111'),
    );
  });

  test('не-владелец не может выйти (access denied)', async () => {
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
    };

    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: '22222222-2222-4222-8222-222222222222',
          name: 'Other',
          telegramId: 2,
          roles: [Role.GUEST],
          createdAt: mockDate,
        }),
      ),
    };

    const uc = new DropStudentUc();
    uc.init({
      streamRepo: { getByUuid: mock(() => Promise.resolve(undefined)) },
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
    } as unknown as StreamApiModuleResolver);

    await expect(
      uc.execute(
        {
          streamId: '77777777-7777-4777-8777-777777777777',
          studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        },
        makeActor('22222222-2222-4222-8222-222222222222'),
      ),
    ).rejects.toThrow();
  });

  test('нельзя покинуть учёбу повторно (abandoned → ошибка)', async () => {
    const mockStudentRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          streamId: '77777777-7777-4777-8777-777777777777',
          userId: '11111111-1111-4111-8111-111111111111',
          status: 'abandoned',
          abandonDetails: { who: 'self', cause: 'voluntary' },
          enrolledAt: mockDate,
          currentStepId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
          steps: [],
          createdAt: mockDate,
        }),
      ),
    };

    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: '11111111-1111-4111-8111-111111111111',
          name: 'Student',
          telegramId: 1,
          roles: [Role.STUDENT],
          createdAt: mockDate,
        }),
      ),
    };

    const uc = new DropStudentUc();
    uc.init({
      streamRepo: { getByUuid: mock(() => Promise.resolve(undefined)) },
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
    } as unknown as StreamApiModuleResolver);

    await expect(
      uc.execute(
        {
          streamId: '77777777-7777-4777-8777-777777777777',
          studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        },
        makeActor('11111111-1111-4111-8111-111111111111'),
      ),
    ).rejects.toThrow();
  });

  test('самовыход из enrolled возможен и публикует student.abandoned', async () => {
    const mockStudentRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          streamId: '77777777-7777-4777-8777-777777777777',
          userId: '11111111-1111-4111-8111-111111111111',
          status: 'enrolled',
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

    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: '11111111-1111-4111-8111-111111111111',
          name: 'Student',
          telegramId: 1,
          roles: [Role.STUDENT],
          createdAt: mockDate,
        }),
      ),
      removeRoleFromUser: mock(() => Promise.resolve()),
    };

    const mockEventBus = { publish: mock(() => {}) };

    const uc = new DropStudentUc();
    uc.init({
      streamRepo: { getByUuid: mock(() => Promise.resolve(undefined)) },
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
      eventBus: mockEventBus,
    } as unknown as StreamApiModuleResolver);

    await uc.execute(
      {
        streamId: '77777777-7777-4777-8777-777777777777',
        studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      },
      makeActor('11111111-1111-4111-8111-111111111111'),
    );

    expect(mockStudentRepo.save).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    const event = (mockEventBus.publish as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(event.eventName).toBe('student.abandoned');
    expect(event.payload.who).toBe('self');
    expect(event.payload.cause).toBe('voluntary');
  });

  test('самовыход → ментору уведомление с именем студента и потока (FR-6 #3)', async () => {
    const MENTOR_ID = '66666666-6666-4666-8666-666666666666';
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
          title: 'Поток JS',
          mentorId: MENTOR_ID,
        }),
      ),
    };
    const notify = mock(() => Promise.resolve());
    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: '11111111-1111-4111-8111-111111111111',
          name: 'Student',
          telegramId: 1,
          roles: [Role.STUDENT],
          createdAt: mockDate,
        }),
      ),
      removeRoleFromUser: mock(() => Promise.resolve()),
      notify,
    };

    const uc = new DropStudentUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
    } as unknown as StreamApiModuleResolver);

    await uc.execute(
      {
        streamId: '77777777-7777-4777-8777-777777777777',
        studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      },
      makeActor('11111111-1111-4111-8111-111111111111'),
    );

    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith(
      MENTOR_ID,
      '🚪 Студент Student покинул учёбу с потока «Поток JS» по собственному желанию.',
      'info',
      makeActor('11111111-1111-4111-8111-111111111111'),
    );
  });

  test('самовыход: имя недоступно → в уведомлении первые 8 символов userId', async () => {
    const MENTOR_ID = '66666666-6666-4666-8666-666666666666';
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
          title: 'Поток JS',
          mentorId: MENTOR_ID,
        }),
      ),
    };
    const notify = mock(() => Promise.resolve());
    const mockUserFacade = {
      getUserByUuid: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve()),
      notify,
    };

    const uc = new DropStudentUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
    } as unknown as StreamApiModuleResolver);

    await uc.execute(
      {
        streamId: '77777777-7777-4777-8777-777777777777',
        studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      },
      makeActor('11111111-1111-4111-8111-111111111111'),
    );

    expect(notify).toHaveBeenCalledWith(
      MENTOR_ID,
      '🚪 Студент 11111111 покинул учёбу с потока «Поток JS» по собственному желанию.',
      'info',
      makeActor('11111111-1111-4111-8111-111111111111'),
    );
  });
});
