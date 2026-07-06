import { describe, expect, mock, test } from 'bun:test';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModuleResolver } from '#domain/module';
import { EnrollStudentUc } from './enroll-student-uc';

const mockDate = '2026-06-01T10:00';

describe('EnrollStudentUc', () => {
  test('успешно зачисляет GUEST', async () => {
    const mockStreamRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: '11111111-1111-4111-8111-111111111111',
          title: 'Test Stream',
          description: 'Description',
          mentorId: '22222222-2222-4222-8222-222222222222',
          moduleId: '33333333-3333-4333-8333-333333333333',
          startDate: mockDate,
          status: 'enrollment',
          contentSnapshot: [
            {
              projectId: '44444444-4444-4444-8444-444444444444',
              projectTitle: 'Project 1',
              lessons: [
                {
                  lessonId: '55555555-5555-4555-8555-555555555555',
                  lessonTitle: 'Lesson 1',
                  stepIds: ['66666666-6666-4666-8666-666666666666'],
                },
              ],
            },
          ],
          createdAt: mockDate,
        }),
      ),
      save: mock(() => Promise.resolve()),
      getAll: mock(() => Promise.resolve([])),
    };
    const mockStudentRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(undefined)),
      getByStream: mock(() => Promise.resolve([])),
      getByUser: mock(() => Promise.resolve([])),
    };
    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: '99999999-9999-4999-8999-999999999999',
          name: 'Guest',
          telegramId: 2,
          roles: [Role.GUEST],
          createdAt: mockDate,
        }),
      ),
      updateUserRole: mock(() => Promise.resolve({})),
      userExists: mock(() => Promise.resolve(true)),
      addRoleToUser: mock(() => Promise.resolve(undefined)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new EnrollStudentUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
    } as unknown as StreamApiModuleResolver);

    await uc.execute(
      {
        streamId: '11111111-1111-4111-8111-111111111111',
        userId: '99999999-9999-4999-8999-999999999999',
      },
      '99999999-9999-4999-8999-999999999999',
    );
    expect(mockStudentRepo.save).toHaveBeenCalled();
    expect(mockUserFacade.updateUserRole).toHaveBeenCalledWith(
      '99999999-9999-4999-8999-999999999999',
      Role.STUDENT,
      '99999999-9999-4999-8999-999999999999',
    );
  });

  test('бросает ошибку для STUDENT', async () => {
    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: '99999999-9999-4999-8999-999999999999',
          name: 'Student',
          telegramId: 3,
          roles: [Role.STUDENT],
          createdAt: mockDate,
        }),
      ),
      userExists: mock(() => Promise.resolve(true)),
      addRoleToUser: mock(() => Promise.resolve(undefined)),
      updateUserRole: mock(() => Promise.resolve(undefined)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new EnrollStudentUc();
    uc.init({
      userFacade: mockUserFacade,
      streamRepo: {},
      streamStudentRepo: {},
      courseFacade: {},
    } as unknown as StreamApiModuleResolver);

    await expect(
      uc.execute(
        {
          streamId: '11111111-1111-4111-8111-111111111111',
          userId: '99999999-9999-4999-8999-999999999999',
        },
        '99999999-9999-4999-8999-999999999999',
      ),
    ).rejects.toThrow();
  });

  test('ошибка если у пользователя уже есть активный поток', async () => {
    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: '99999999-9999-4999-8999-999999999999',
          name: 'Guest',
          telegramId: 2,
          roles: [Role.GUEST],
          createdAt: mockDate,
        }),
      ),
      updateUserRole: mock(() => Promise.resolve({})),
      userExists: mock(() => Promise.resolve(true)),
      addRoleToUser: mock(() => Promise.resolve(undefined)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };
    const mockStudentRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(undefined)),
      getByStream: mock(() => Promise.resolve([])),
      getByUser: mock(() =>
        Promise.resolve([
          {
            uuid: 'existing-active',
            streamId: 'other-stream',
            userId: '99999999-9999-4999-8999-999999999999',
            enrolledAt: mockDate,
            status: 'active',
            currentStepId: 'some-step',
            steps: [],
            createdAt: mockDate,
          },
        ]),
      ),
    };

    const uc = new EnrollStudentUc();
    uc.init({
      userFacade: mockUserFacade,
      streamRepo: {},
      streamStudentRepo: mockStudentRepo,
      courseFacade: {},
    } as unknown as StreamApiModuleResolver);

    await expect(
      uc.execute(
        {
          streamId: '11111111-1111-4111-8111-111111111111',
          userId: '99999999-9999-4999-8999-999999999999',
        },
        '99999999-9999-4999-8999-999999999999',
      ),
    ).rejects.toThrow('Вы уже проходите обучение');
  });

  test('успешная запись если предыдущие записи archived/completed', async () => {
    const mockStreamRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: '11111111-1111-4111-8111-111111111111',
          title: 'Test Stream',
          description: 'Description',
          mentorId: '22222222-2222-4222-8222-222222222222',
          moduleId: '33333333-3333-4333-8333-333333333333',
          startDate: mockDate,
          status: 'enrollment',
          contentSnapshot: [
            {
              projectId: '44444444-4444-4444-8444-444444444444',
              projectTitle: 'Project 1',
              lessons: [
                {
                  lessonId: '55555555-5555-4555-8555-555555555555',
                  lessonTitle: 'Lesson 1',
                  stepIds: ['66666666-6666-4666-8666-666666666666'],
                },
              ],
            },
          ],
          createdAt: mockDate,
        }),
      ),
      save: mock(() => Promise.resolve()),
      getAll: mock(() => Promise.resolve([])),
    };
    const mockStudentRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(undefined)),
      getByStream: mock(() => Promise.resolve([])),
      getByUser: mock(() =>
        Promise.resolve([
          {
            uuid: 'prev-completed',
            streamId: 'previous-stream',
            userId: '99999999-9999-4999-8999-999999999999',
            enrolledAt: mockDate,
            status: 'completed',
            currentStepId: 'some-step',
            steps: [],
            createdAt: mockDate,
          },
        ]),
      ),
    };
    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: '99999999-9999-4999-8999-999999999999',
          name: 'Guest',
          telegramId: 2,
          roles: [Role.GUEST],
          createdAt: mockDate,
        }),
      ),
      updateUserRole: mock(() => Promise.resolve({})),
      userExists: mock(() => Promise.resolve(true)),
      addRoleToUser: mock(() => Promise.resolve(undefined)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new EnrollStudentUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
    } as unknown as StreamApiModuleResolver);

    await uc.execute(
      {
        streamId: '11111111-1111-4111-8111-111111111111',
        userId: '99999999-9999-4999-8999-999999999999',
      },
      '99999999-9999-4999-8999-999999999999',
    );
    expect(mockStudentRepo.save).toHaveBeenCalled();
  });

  // --- enrollmentKey tests ---

  test('зачисление с верным enrollmentKey — успех', async () => {
    const mockStreamRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: '11111111-1111-4111-8111-111111111111',
          title: 'Test Stream',
          description: 'Description',
          mentorId: '22222222-2222-4222-8222-222222222222',
          moduleId: '33333333-3333-4333-8333-333333333333',
          startDate: mockDate,
          status: 'enrollment',
          enrollmentKey: 'secret',
          contentSnapshot: [
            {
              projectId: '44444444-4444-4444-8444-444444444444',
              projectTitle: 'Project 1',
              lessons: [
                {
                  lessonId: '55555555-5555-4555-8555-555555555555',
                  lessonTitle: 'Lesson 1',
                  stepIds: ['66666666-6666-4666-8666-666666666666'],
                },
              ],
            },
          ],
          createdAt: mockDate,
        }),
      ),
      save: mock(() => Promise.resolve()),
      getAll: mock(() => Promise.resolve([])),
    };
    const mockStudentRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(undefined)),
      getByStream: mock(() => Promise.resolve([])),
      getByUser: mock(() => Promise.resolve([])),
    };
    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: '99999999-9999-4999-8999-999999999999',
          name: 'Guest',
          telegramId: 2,
          roles: [Role.GUEST],
          createdAt: mockDate,
        }),
      ),
      updateUserRole: mock(() => Promise.resolve({})),
      userExists: mock(() => Promise.resolve(true)),
      addRoleToUser: mock(() => Promise.resolve(undefined)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new EnrollStudentUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
    } as unknown as StreamApiModuleResolver);

    await uc.execute(
      {
        streamId: '11111111-1111-4111-8111-111111111111',
        userId: '99999999-9999-4999-8999-999999999999',
        enrollmentKey: 'secret',
      },
      '99999999-9999-4999-8999-999999999999',
    );
    expect(mockStudentRepo.save).toHaveBeenCalled();
  });

  test('зачисление с неверным enrollmentKey — ошибка', async () => {
    const mockStreamRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: '11111111-1111-4111-8111-111111111111',
          title: 'Test Stream',
          description: 'Description',
          mentorId: '22222222-2222-4222-8222-222222222222',
          moduleId: '33333333-3333-4333-8333-333333333333',
          startDate: mockDate,
          status: 'enrollment',
          enrollmentKey: 'secret',
          contentSnapshot: [
            {
              projectId: '44444444-4444-4444-8444-444444444444',
              projectTitle: 'Project 1',
              lessons: [
                {
                  lessonId: '55555555-5555-4555-8555-555555555555',
                  lessonTitle: 'Lesson 1',
                  stepIds: ['66666666-6666-4666-8666-666666666666'],
                },
              ],
            },
          ],
          createdAt: mockDate,
        }),
      ),
      save: mock(() => Promise.resolve()),
      getAll: mock(() => Promise.resolve([])),
    };
    const mockStudentRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(undefined)),
      getByStream: mock(() => Promise.resolve([])),
      getByUser: mock(() => Promise.resolve([])),
    };
    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: '99999999-9999-4999-8999-999999999999',
          name: 'Guest',
          telegramId: 2,
          roles: [Role.GUEST],
          createdAt: mockDate,
        }),
      ),
      updateUserRole: mock(() => Promise.resolve({})),
      userExists: mock(() => Promise.resolve(true)),
      addRoleToUser: mock(() => Promise.resolve(undefined)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new EnrollStudentUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
    } as unknown as StreamApiModuleResolver);

    await expect(
      uc.execute(
        {
          streamId: '11111111-1111-4111-8111-111111111111',
          userId: '99999999-9999-4999-8999-999999999999',
          enrollmentKey: 'wrong',
        },
        '99999999-9999-4999-8999-999999999999',
      ),
    ).rejects.toThrow();
  });

  test('зачисление без enrollmentKey, когда у потока есть ключ — ошибка', async () => {
    const mockStreamRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: '11111111-1111-4111-8111-111111111111',
          title: 'Test Stream',
          description: 'Description',
          mentorId: '22222222-2222-4222-8222-222222222222',
          moduleId: '33333333-3333-4333-8333-333333333333',
          startDate: mockDate,
          status: 'enrollment',
          enrollmentKey: 'secret',
          contentSnapshot: [
            {
              projectId: '44444444-4444-4444-8444-444444444444',
              projectTitle: 'Project 1',
              lessons: [
                {
                  lessonId: '55555555-5555-4555-8555-555555555555',
                  lessonTitle: 'Lesson 1',
                  stepIds: ['66666666-6666-4666-8666-666666666666'],
                },
              ],
            },
          ],
          createdAt: mockDate,
        }),
      ),
      save: mock(() => Promise.resolve()),
      getAll: mock(() => Promise.resolve([])),
    };
    const mockStudentRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(undefined)),
      getByStream: mock(() => Promise.resolve([])),
      getByUser: mock(() => Promise.resolve([])),
    };
    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: '99999999-9999-4999-8999-999999999999',
          name: 'Guest',
          telegramId: 2,
          roles: [Role.GUEST],
          createdAt: mockDate,
        }),
      ),
      updateUserRole: mock(() => Promise.resolve({})),
      userExists: mock(() => Promise.resolve(true)),
      addRoleToUser: mock(() => Promise.resolve(undefined)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new EnrollStudentUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
    } as unknown as StreamApiModuleResolver);

    await expect(
      uc.execute(
        {
          streamId: '11111111-1111-4111-8111-111111111111',
          userId: '99999999-9999-4999-8999-999999999999',
        },
        '99999999-9999-4999-8999-999999999999',
      ),
    ).rejects.toThrow();
  });

  // --- CANDIDATE снятие ---

  test('зачисление снимает CANDIDATE если был', async () => {
    const mockStreamRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: '11111111-1111-4111-8111-111111111111',
          title: 'Test Stream',
          description: 'Description',
          mentorId: '22222222-2222-4222-8222-222222222222',
          moduleId: '33333333-3333-4333-8333-333333333333',
          startDate: mockDate,
          status: 'enrollment',
          contentSnapshot: [
            {
              projectId: '44444444-4444-4444-8444-444444444444',
              projectTitle: 'Project 1',
              lessons: [
                {
                  lessonId: '55555555-5555-4555-8555-555555555555',
                  lessonTitle: 'Lesson 1',
                  stepIds: ['66666666-6666-4666-8666-666666666666'],
                },
              ],
            },
          ],
          createdAt: mockDate,
        }),
      ),
      save: mock(() => Promise.resolve()),
      getAll: mock(() => Promise.resolve([])),
    };
    const mockStudentRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(undefined)),
      getByStream: mock(() => Promise.resolve([])),
      getByUser: mock(() => Promise.resolve([])),
    };
    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: '99999999-9999-4999-8999-999999999999',
          name: 'Candidate',
          telegramId: 2,
          roles: [Role.CANDIDATE],
          createdAt: mockDate,
        }),
      ),
      updateUserRole: mock(() => Promise.resolve({})),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      userExists: mock(() => Promise.resolve(true)),
      addRoleToUser: mock(() => Promise.resolve(undefined)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new EnrollStudentUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
    } as unknown as StreamApiModuleResolver);

    await uc.execute(
      {
        streamId: '11111111-1111-4111-8111-111111111111',
        userId: '99999999-9999-4999-8999-999999999999',
      },
      '99999999-9999-4999-8999-999999999999',
    );

    expect(mockStudentRepo.save).toHaveBeenCalled();
    expect(mockUserFacade.removeRoleFromUser).toHaveBeenCalledWith(
      '99999999-9999-4999-8999-999999999999',
      Role.CANDIDATE,
      '99999999-9999-4999-8999-999999999999',
    );
  });

  test('зачисление без CANDIDATE — без ошибок', async () => {
    const mockStreamRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: '11111111-1111-4111-8111-111111111111',
          title: 'Test Stream',
          description: 'Description',
          mentorId: '22222222-2222-4222-8222-222222222222',
          moduleId: '33333333-3333-4333-8333-333333333333',
          startDate: mockDate,
          status: 'enrollment',
          contentSnapshot: [
            {
              projectId: '44444444-4444-4444-8444-444444444444',
              projectTitle: 'Project 1',
              lessons: [
                {
                  lessonId: '55555555-5555-4555-8555-555555555555',
                  lessonTitle: 'Lesson 1',
                  stepIds: ['66666666-6666-4666-8666-666666666666'],
                },
              ],
            },
          ],
          createdAt: mockDate,
        }),
      ),
      save: mock(() => Promise.resolve()),
      getAll: mock(() => Promise.resolve([])),
    };
    const mockStudentRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(undefined)),
      getByStream: mock(() => Promise.resolve([])),
      getByUser: mock(() => Promise.resolve([])),
    };
    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: '99999999-9999-4999-8999-999999999999',
          name: 'Guest',
          telegramId: 2,
          roles: [Role.GUEST],
          createdAt: mockDate,
        }),
      ),
      updateUserRole: mock(() => Promise.resolve({})),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      userExists: mock(() => Promise.resolve(true)),
      addRoleToUser: mock(() => Promise.resolve(undefined)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new EnrollStudentUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
    } as unknown as StreamApiModuleResolver);

    await uc.execute(
      {
        streamId: '11111111-1111-4111-8111-111111111111',
        userId: '99999999-9999-4999-8999-999999999999',
      },
      '99999999-9999-4999-8999-999999999999',
    );

    expect(mockStudentRepo.save).toHaveBeenCalled();
    // removeRoleFromUser не должен вызываться для не-CANDIDATE
    expect(mockUserFacade.removeRoleFromUser).not.toHaveBeenCalled();
  });
});
