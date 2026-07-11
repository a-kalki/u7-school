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
      addRoleToUser: mock(() => Promise.resolve()),
      userExists: mock(() => Promise.resolve(true)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new EnrollStudentUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {
        getCourseByModuleId: mock(() => Promise.resolve(undefined)),
      },
    } as unknown as StreamApiModuleResolver);

    await uc.execute(
      {
        streamId: '11111111-1111-4111-8111-111111111111',
        userId: '99999999-9999-4999-8999-999999999999',
      },
      '99999999-9999-4999-8999-999999999999',
    );
    expect(mockStudentRepo.save).toHaveBeenCalled();
    expect(mockUserFacade.addRoleToUser).toHaveBeenCalledWith(
      '99999999-9999-4999-8999-999999999999',
      Role.STUDENT,
      '99999999-9999-4999-8999-999999999999',
    );
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
      addRoleToUser: mock(() => Promise.resolve()),
      userExists: mock(() => Promise.resolve(true)),
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
            uuid: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
            streamId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            userId: '99999999-9999-4999-8999-999999999999',
            enrolledAt: mockDate,
            status: 'active',
            currentStepId: '66666666-6666-4666-8666-666666666666',
            steps: [],
            createdAt: mockDate,
          },
        ]),
      ),
    };

    const mockStreamRepo = {
      getByUuid: mock((id: string) => {
        if (id === '11111111-1111-4111-8111-111111111111')
          return Promise.resolve({
            uuid: '11111111-1111-4111-8111-111111111111',
            title: 'Test Stream',
            description: 'Test desc',
            mentorId: '22222222-2222-4222-8222-222222222222',
            moduleId: '33333333-3333-4333-8333-333333333333',
            startDate: mockDate,
            status: 'enrollment',
            contentSnapshot: [
              {
                projectId: '44444444-4444-4444-8444-444444444444',
                projectTitle: 'P1',
                lessons: [
                  {
                    lessonId: '55555555-5555-4555-8555-555555555555',
                    lessonTitle: 'L1',
                    stepIds: ['66666666-6666-4666-8666-666666666666'],
                  },
                ],
              },
            ],
            createdAt: mockDate,
          });
        if (id === 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
          return Promise.resolve({
            uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            title: 'Other',
            description: 'Test desc',
            mentorId: '22222222-2222-4222-8222-222222222222',
            moduleId: '33333333-3333-4333-8333-333333333334',
            startDate: mockDate,
            status: 'active',
            contentSnapshot: [],
            createdAt: mockDate,
          });
        return Promise.resolve(undefined);
      }),
      save: mock(() => Promise.resolve()),
      getAll: mock(() => Promise.resolve([])),
    };

    const uc = new EnrollStudentUc();
    uc.init({
      userFacade: mockUserFacade,
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      courseFacade: {
        getCourseByModuleId: mock(() => Promise.resolve(undefined)),
      },
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

  test('успешная запись если предыдущие записи завершённые', async () => {
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
            status: 'advanced',
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
      addRoleToUser: mock(() => Promise.resolve()),
      userExists: mock(() => Promise.resolve(true)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new EnrollStudentUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {
        getCourseByModuleId: mock(() => Promise.resolve(undefined)),
      },
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
      addRoleToUser: mock(() => Promise.resolve()),
      userExists: mock(() => Promise.resolve(true)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new EnrollStudentUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {
        getCourseByModuleId: mock(() => Promise.resolve(undefined)),
      },
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
      addRoleToUser: mock(() => Promise.resolve()),
      userExists: mock(() => Promise.resolve(true)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new EnrollStudentUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {
        getCourseByModuleId: mock(() => Promise.resolve(undefined)),
      },
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
      addRoleToUser: mock(() => Promise.resolve()),
      userExists: mock(() => Promise.resolve(true)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new EnrollStudentUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {
        getCourseByModuleId: mock(() => Promise.resolve(undefined)),
      },
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
      addRoleToUser: mock(() => Promise.resolve()),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      userExists: mock(() => Promise.resolve(true)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new EnrollStudentUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {
        getCourseByModuleId: mock(() => Promise.resolve(undefined)),
      },
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
      addRoleToUser: mock(() => Promise.resolve()),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      userExists: mock(() => Promise.resolve(true)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new EnrollStudentUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {
        getCourseByModuleId: mock(() => Promise.resolve(undefined)),
      },
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

  // ── Gate: проверка canEnrollNextModule ──

  const syntaxModuleId = '33333333-3333-4333-8333-333333333333';
  const algoModuleId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const syntaxStreamId = '11111111-1111-4111-8111-111111111111';
  const algoStreamId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const userId = '99999999-9999-4999-8999-999999999999';

  const mockCourse = {
    uuid: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    title: 'Основы программирования',
    description: 'Курс',
    authorId: '22222222-2222-4222-8222-222222222222',
    phases: [
      {
        title: 'Основы',
        moduleIds: [syntaxModuleId, algoModuleId],
      },
    ],
    status: 'published',
    createdAt: mockDate,
  };

  function makeMockCourseFacade() {
    return {
      getCourseByModuleId: mock(() => Promise.resolve(mockCourse)),
      getModule: mock((id: string) => {
        if (id === syntaxModuleId)
          return Promise.resolve({ title: 'Синтаксис' });
        if (id === algoModuleId)
          return Promise.resolve({ title: 'Алгоритмика' });
        return Promise.resolve({ title: 'Неизвестный модуль' });
      }),
    };
  }

  function makeAlgoStream(overrides: Record<string, unknown> = {}) {
    return {
      uuid: algoStreamId,
      title: 'Алгоритмика',
      description: 'Поток по алгоритмике',
      mentorId: '22222222-2222-4222-8222-222222222222',
      moduleId: algoModuleId,
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
      ...overrides,
    };
  }

  test('gate: запись на N+1 без advanced на N → ошибка с названием prev модуля', async () => {
    const mockCourseFacade = makeMockCourseFacade();

    // Поток, на который пытаемся записаться — Алгоритмика
    const mockStreamRepo = {
      getByUuid: mock((id: string) => {
        if (id === algoStreamId) return Promise.resolve(makeAlgoStream());
        if (id === syntaxStreamId)
          return Promise.resolve({
            uuid: syntaxStreamId,
            title: 'Синтаксис',
            description: 'Поток по синтаксису',
            mentorId: '22222222-2222-4222-8222-222222222222',
            moduleId: syntaxModuleId,
            startDate: mockDate,
            status: 'completed',
            contentSnapshot: [],
            createdAt: mockDate,
          });
        return Promise.resolve(undefined);
      }),
      save: mock(() => Promise.resolve()),
      getAll: mock(() => Promise.resolve([])),
    };

    // У студента есть запись на Синтаксис со статусом not_advanced
    const mockStudentRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(undefined)),
      getByStream: mock(() => Promise.resolve([])),
      getByUser: mock(() =>
        Promise.resolve([
          {
            uuid: 'prev-student-record',
            streamId: syntaxStreamId,
            userId,
            enrolledAt: mockDate,
            status: 'not_advanced',
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
          uuid: userId,
          name: 'Guest',
          telegramId: 2,
          roles: [Role.GUEST],
          createdAt: mockDate,
        }),
      ),
      addRoleToUser: mock(() => Promise.resolve()),
      userExists: mock(() => Promise.resolve(true)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new EnrollStudentUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: mockCourseFacade,
    } as unknown as StreamApiModuleResolver);

    await expect(
      uc.execute({ streamId: algoStreamId, userId }, userId),
    ).rejects.toThrow('Синтаксис');
  });

  test('gate: запись на N+1 с advanced на N → успех, новая Student-запись + STUDENT', async () => {
    const mockCourseFacade = makeMockCourseFacade();

    const mockStreamRepo = {
      getByUuid: mock((id: string) => {
        if (id === algoStreamId) return Promise.resolve(makeAlgoStream());
        if (id === syntaxStreamId)
          return Promise.resolve({
            uuid: syntaxStreamId,
            title: 'Синтаксис',
            description: 'Поток по синтаксису',
            mentorId: '22222222-2222-4222-8222-222222222222',
            moduleId: syntaxModuleId,
            startDate: mockDate,
            status: 'completed',
            contentSnapshot: [],
            createdAt: mockDate,
          });
        return Promise.resolve(undefined);
      }),
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
            uuid: 'prev-student-record',
            streamId: syntaxStreamId,
            userId,
            enrolledAt: mockDate,
            status: 'advanced',
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
          uuid: userId,
          name: 'Guest',
          telegramId: 2,
          roles: [Role.GUEST],
          createdAt: mockDate,
        }),
      ),
      addRoleToUser: mock(() => Promise.resolve()),
      userExists: mock(() => Promise.resolve(true)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new EnrollStudentUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: mockCourseFacade,
    } as unknown as StreamApiModuleResolver);

    await uc.execute({ streamId: algoStreamId, userId }, userId);

    // Новая запись создана
    expect(mockStudentRepo.save).toHaveBeenCalled();
    // Роль STUDENT выдана
    expect(mockUserFacade.addRoleToUser).toHaveBeenCalledWith(
      userId,
      Role.STUDENT,
      userId,
    );
  });

  test('gate: предыдущая Student-запись НЕ меняется (остаётся advanced)', async () => {
    const mockCourseFacade = makeMockCourseFacade();

    const mockStreamRepo = {
      getByUuid: mock((id: string) => {
        if (id === algoStreamId) return Promise.resolve(makeAlgoStream());
        if (id === syntaxStreamId)
          return Promise.resolve({
            uuid: syntaxStreamId,
            title: 'Синтаксис',
            description: 'Поток по синтаксису',
            mentorId: '22222222-2222-4222-8222-222222222222',
            moduleId: syntaxModuleId,
            startDate: mockDate,
            status: 'completed',
            contentSnapshot: [],
            createdAt: mockDate,
          });
        return Promise.resolve(undefined);
      }),
      save: mock(() => Promise.resolve()),
      getAll: mock(() => Promise.resolve([])),
    };

    const prevRecord = {
      uuid: 'prev-student-record',
      streamId: syntaxStreamId,
      userId,
      enrolledAt: mockDate,
      status: 'advanced' as const,
      currentStepId: 'some-step',
      steps: [],
      createdAt: mockDate,
    };

    const mockStudentRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(undefined)),
      getByStream: mock(() => Promise.resolve([])),
      getByUser: mock(() => Promise.resolve([prevRecord])),
    };

    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: userId,
          name: 'Guest',
          telegramId: 2,
          roles: [Role.GUEST],
          createdAt: mockDate,
        }),
      ),
      addRoleToUser: mock(() => Promise.resolve()),
      userExists: mock(() => Promise.resolve(true)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new EnrollStudentUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: mockCourseFacade,
    } as unknown as StreamApiModuleResolver);

    await uc.execute({ streamId: algoStreamId, userId }, userId);

    // save вызван ровно 1 раз — только для новой записи
    expect(mockStudentRepo.save).toHaveBeenCalledTimes(1);
    // Сохранённая запись — новая (enrolled), а не предыдущая
    const savedCall = (mockStudentRepo.save as any).mock.calls[0][0];
    expect(savedCall.status).toBe('enrolled');
    expect(savedCall.streamId).toBe(algoStreamId);
  });

  test('gate: запись на первый модуль курса → разрешён без гейта', async () => {
    const mockCourseFacade = makeMockCourseFacade();

    // Поток на Синтаксис (первый модуль)
    const mockStreamRepo = {
      getByUuid: mock((id: string) => {
        if (id === syntaxStreamId)
          return Promise.resolve({
            uuid: syntaxStreamId,
            title: 'Синтаксис',
            description: 'Поток по синтаксису',
            mentorId: '22222222-2222-4222-8222-222222222222',
            moduleId: syntaxModuleId,
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
          });
        return Promise.resolve(undefined);
      }),
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
          uuid: userId,
          name: 'Guest',
          telegramId: 2,
          roles: [Role.GUEST],
          createdAt: mockDate,
        }),
      ),
      addRoleToUser: mock(() => Promise.resolve()),
      userExists: mock(() => Promise.resolve(true)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new EnrollStudentUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: mockCourseFacade,
    } as unknown as StreamApiModuleResolver);

    await uc.execute({ streamId: syntaxStreamId, userId }, userId);

    expect(mockStudentRepo.save).toHaveBeenCalled();
  });

  test('gate: нет записи на предыдущий модуль → отказ', async () => {
    const mockCourseFacade = makeMockCourseFacade();

    const mockStreamRepo = {
      getByUuid: mock((id: string) => {
        if (id === algoStreamId) return Promise.resolve(makeAlgoStream());
        return Promise.resolve(undefined);
      }),
      save: mock(() => Promise.resolve()),
      getAll: mock(() => Promise.resolve([])),
    };

    // У студента вообще нет записей
    const mockStudentRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(undefined)),
      getByStream: mock(() => Promise.resolve([])),
      getByUser: mock(() => Promise.resolve([])),
    };

    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: userId,
          name: 'Guest',
          telegramId: 2,
          roles: [Role.GUEST],
          createdAt: mockDate,
        }),
      ),
      addRoleToUser: mock(() => Promise.resolve()),
      userExists: mock(() => Promise.resolve(true)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new EnrollStudentUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: mockCourseFacade,
    } as unknown as StreamApiModuleResolver);

    await expect(
      uc.execute({ streamId: algoStreamId, userId }, userId),
    ).rejects.toThrow('Синтаксис');
  });
});
