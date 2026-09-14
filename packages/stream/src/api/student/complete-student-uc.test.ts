import { describe, expect, mock, test } from 'bun:test';
import { Role, type User } from '@u7-scl/app/domain';
import type { StreamApiModuleResolver } from '#domain/module';
import { CompleteStudentUc } from './complete-student-uc';

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
const STUDENT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const STUDENT_USER_ID = '11111111-1111-4111-8111-111111111111';
const MENTOR_ID = '66666666-6666-4666-8666-666666666666';
const STREAM_ID = '77777777-7777-4777-8777-777777777777';

describe('CompleteStudentUc', () => {
  function createMocks(
    mentorId = MENTOR_ID,
    place?: {
      courseId: string;
      isFirst: boolean;
      isLast: boolean;
      prevModuleId?: string;
      nextModuleId?: string;
    },
  ) {
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
      notify: mock(() => Promise.resolve()),
      userExists: mock(() => Promise.resolve(true)),
      addRoleToUser: mock(() => Promise.resolve()),
      updateUserRole: mock(() => Promise.resolve({})),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as never)),
    };

    const mockEventBus = { publish: mock(() => {}) };

    const resolver = {
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: { getModulePlace: mock(() => Promise.resolve(place)) },
      eventBus: mockEventBus,
    } as unknown as StreamApiModuleResolver;

    return { resolver, mockStudentRepo, mockUserFacade, mockEventBus };
  }

  test('ментор завершает студента → advanced + −STUDENT + событие student.completed', async () => {
    const { resolver, mockStudentRepo, mockUserFacade, mockEventBus } =
      createMocks();

    const uc = new CompleteStudentUc();
    uc.init(resolver);

    await uc.execute(
      {
        streamId: STREAM_ID,
        studentId: STUDENT_ID,
        outcome: 'advanced',
      },
      makeActor(MENTOR_ID),
    );

    expect(mockStudentRepo.save).toHaveBeenCalled();
    const saved = (mockStudentRepo.save as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(saved.status).toBe('advanced');
    expect(saved.completionDetails).toEqual({ nextPreference: 'undecided' });

    expect(mockUserFacade.removeRoleFromUser).toHaveBeenCalledWith(
      STUDENT_USER_ID,
      Role.STUDENT,
      makeActor(MENTOR_ID),
    );

    // Публикуется событие student.completed с полным payload
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    const event = (mockEventBus.publish as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(event.eventName).toBe('student.completed');
    expect(event.aggregateName).toBe('Student');
    expect(event.payload).toEqual({
      studentId: STUDENT_ID,
      userId: STUDENT_USER_ID,
      streamId: STREAM_ID,
      moduleId: '33333333-3333-4333-8333-333333333333',
      outcome: 'advanced',
    });
  });

  test('ментор завершает → not_advanced + событие с outcome=not_advanced', async () => {
    const { resolver, mockStudentRepo, mockUserFacade, mockEventBus } =
      createMocks();

    const uc = new CompleteStudentUc();
    uc.init(resolver);

    await uc.execute(
      {
        streamId: STREAM_ID,
        studentId: STUDENT_ID,
        outcome: 'not_advanced',
      },
      makeActor(MENTOR_ID),
    );

    const saved = (mockStudentRepo.save as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(saved.status).toBe('not_advanced');
    expect(mockUserFacade.removeRoleFromUser).toHaveBeenCalled();

    const event = (mockEventBus.publish as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(event.payload.outcome).toBe('not_advanced');
  });

  test('ментор завершает → abandoned: публикуется student.abandoned (who=mentor)', async () => {
    const { resolver, mockStudentRepo, mockUserFacade, mockEventBus } =
      createMocks();

    const uc = new CompleteStudentUc();
    uc.init(resolver);

    await uc.execute(
      {
        streamId: STREAM_ID,
        studentId: STUDENT_ID,
        outcome: 'abandoned',
      },
      makeActor(MENTOR_ID),
    );

    const saved = (mockStudentRepo.save as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(saved.status).toBe('abandoned');
    expect(mockUserFacade.removeRoleFromUser).toHaveBeenCalled();

    // abandoned → событие student.abandoned (кик из TG-группы, spec FR-6)
    const event = (mockEventBus.publish as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(event.eventName).toBe('student.abandoned');
    expect(event.payload.who).toBe('mentor');
    expect(event.payload.cause).toBe('by_mentor');
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
        makeActor('22222222-2222-4222-8222-222222222222'),
      ),
    ).rejects.toThrow();
  });

  // ── Уведомления при advanced (трек user-notify, сценарии #7c/7d) ──

  test('advanced + последний модуль → студенту «🎉 Курс завершён!» (FR-6 #7c)', async () => {
    const { resolver, mockUserFacade } = createMocks(MENTOR_ID, {
      courseId: 'c-1',
      isFirst: false,
      isLast: true,
      prevModuleId: 'm-0',
    });

    const uc = new CompleteStudentUc();
    uc.init(resolver);

    await uc.execute(
      { streamId: STREAM_ID, studentId: STUDENT_ID, outcome: 'advanced' },
      makeActor(MENTOR_ID),
    );

    expect(mockUserFacade.notify).toHaveBeenCalledTimes(1);
    expect(mockUserFacade.notify).toHaveBeenCalledWith(
      STUDENT_USER_ID,
      '🎉 Курс завершён! Поздравляем — ты прошёл всю программу.',
      'info',
      makeActor(MENTOR_ID),
    );
  });

  test('advanced + место модуля неизвестно → студенту «🏁 Модуль завершён!» (FR-6 #7d)', async () => {
    const { resolver, mockUserFacade } = createMocks(MENTOR_ID, undefined);

    const uc = new CompleteStudentUc();
    uc.init(resolver);

    await uc.execute(
      { streamId: STREAM_ID, studentId: STUDENT_ID, outcome: 'advanced' },
      makeActor(MENTOR_ID),
    );

    expect(mockUserFacade.notify).toHaveBeenCalledTimes(1);
    expect(mockUserFacade.notify).toHaveBeenCalledWith(
      STUDENT_USER_ID,
      '🏁 Модуль завершён!',
      'info',
      makeActor(MENTOR_ID),
    );
  });

  test('advanced + есть следующий модуль → notify НЕ шлётся (кнопка — в HubStory)', async () => {
    const { resolver, mockUserFacade } = createMocks(MENTOR_ID, {
      courseId: 'c-1',
      isFirst: false,
      isLast: false,
      nextModuleId: '55555555-5555-4555-8555-555555555555',
    });

    const uc = new CompleteStudentUc();
    uc.init(resolver);

    await uc.execute(
      { streamId: STREAM_ID, studentId: STUDENT_ID, outcome: 'advanced' },
      makeActor(MENTOR_ID),
    );

    expect(mockUserFacade.notify).not.toHaveBeenCalled();
  });

  test('not_advanced → notify НЕ шлётся (кнопка «Пройти снова» — в HubStory)', async () => {
    const { resolver, mockUserFacade } = createMocks(MENTOR_ID, {
      courseId: 'c-1',
      isFirst: false,
      isLast: true,
    });

    const uc = new CompleteStudentUc();
    uc.init(resolver);

    await uc.execute(
      { streamId: STREAM_ID, studentId: STUDENT_ID, outcome: 'not_advanced' },
      makeActor(MENTOR_ID),
    );

    expect(mockUserFacade.notify).not.toHaveBeenCalled();
  });
});
