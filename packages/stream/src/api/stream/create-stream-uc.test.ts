import { describe, expect, mock, test } from 'bun:test';
import { isoNow } from '@u7-scl/core/shared';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModuleResolver } from '#domain/module';
import { CreateStreamUc } from './create-stream-uc';

/** Фасад пользователей с ментором m1 (паттерн существующих тестов файла). */
function makeMentorFacade() {
  return {
    getUserByUuid: mock(() =>
      Promise.resolve({
        uuid: 'm1',
        name: 'Mentor',
        telegramId: 1,
        roles: [Role.MENTOR],
        createdAt: isoNow(),
      }),
    ),
    userExists: mock(() => Promise.resolve(true)),
    addRoleToUser: mock(() => Promise.resolve(undefined)),
    updateUserRole: mock(() => Promise.resolve(undefined)),
    getUserByTelegramId: mock(() => Promise.resolve(undefined)),
    removeRoleFromUser: mock(() => Promise.resolve(undefined)),
    registerGuest: mock(() => Promise.resolve({} as any)),
  };
}

/** Валидная команда создания потока. */
function makeCreateCmd() {
  return {
    title: 'Новый курс',
    description: 'Описание',
    mentorId: '33333333-3333-4333-8333-333333333333',
    moduleId: '44444444-4444-4444-4444-444444444444',
    startDate: '2026-06-01T12:00',
  };
}

describe('CreateStreamUc', () => {
  test('успешно создает поток MENTOR-ом', async () => {
    const mockRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(undefined)),
      getAll: mock(() => Promise.resolve([])),
    };
    const mockCourseFacade = {
      getModuleSnapshot: mock(() => Promise.resolve([])),
    };
    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: 'm1',
          name: 'Mentor',
          telegramId: 1,
          roles: [Role.MENTOR],
          createdAt: isoNow(),
        }),
      ),
      userExists: mock(() => Promise.resolve(true)),
      addRoleToUser: mock(() => Promise.resolve(undefined)),
      updateUserRole: mock(() => Promise.resolve(undefined)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new CreateStreamUc();
    uc.init({
      streamRepo: mockRepo,
      courseFacade: mockCourseFacade,
      userFacade: mockUserFacade,
      streamStudentRepo: {},
    } as unknown as StreamApiModuleResolver);

    const cmd = {
      title: 'Новый курс',
      description: 'Описание',
      mentorId: '33333333-3333-4333-8333-333333333333',
      moduleId: '44444444-4444-4444-4444-444444444444',
      startDate: '2026-06-01T12:00',
      telegramGroupId: 'tg1',
      goal: 'Цель',
      result: 'Результат',
      rules: 'Правила',
      additional: 'Доп',
      targetAudience: 'Студенты',
    };

    const result = await uc.execute(cmd, 'm1');
    expect(result.title).toBe(cmd.title);
    expect(mockRepo.save).toHaveBeenCalled();
  });

  test('бросает ошибку, если GUEST пытается создать поток', async () => {
    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: 'g1',
          name: 'Guest',
          telegramId: 2,
          roles: [Role.GUEST],
          createdAt: isoNow(),
        }),
      ),
      userExists: mock(() => Promise.resolve(true)),
      addRoleToUser: mock(() => Promise.resolve(undefined)),
      updateUserRole: mock(() => Promise.resolve(undefined)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new CreateStreamUc();
    uc.init({
      userFacade: mockUserFacade,
      streamRepo: {},
      courseFacade: {},
      streamStudentRepo: {},
    } as unknown as StreamApiModuleResolver);

    await expect(uc.execute({} as any, 'g1')).rejects.toThrow();
  });

  test('сохраняет enrollmentKey при создании потока с ключом', async () => {
    const mockRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(undefined)),
      getAll: mock(() => Promise.resolve([])),
    };
    const mockCourseFacade = {
      getModuleSnapshot: mock(() => Promise.resolve([])),
    };
    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: 'm1',
          name: 'Mentor',
          telegramId: 1,
          roles: [Role.MENTOR],
          createdAt: isoNow(),
        }),
      ),
      userExists: mock(() => Promise.resolve(true)),
      addRoleToUser: mock(() => Promise.resolve(undefined)),
      updateUserRole: mock(() => Promise.resolve(undefined)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new CreateStreamUc();
    uc.init({
      streamRepo: mockRepo,
      courseFacade: mockCourseFacade,
      userFacade: mockUserFacade,
      streamStudentRepo: {},
    } as unknown as StreamApiModuleResolver);

    const cmd = {
      title: 'Новый курс',
      description: 'Описание',
      mentorId: '33333333-3333-4333-8333-333333333333',
      moduleId: '44444444-4444-4444-4444-444444444444',
      startDate: '2026-06-01T12:00',
      enrollmentKey: 'секретное-слово',
    };

    const result = await uc.execute(cmd, 'm1');
    expect(result.enrollmentKey).toBe('секретное-слово');
  });

  test('публикует stream.created после сохранения потока', async () => {
    const mockEventBus = { publish: mock(() => {}) };
    const mockRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(undefined)),
      getAll: mock(() => Promise.resolve([])),
    };
    const mockCourseFacade = {
      getModuleSnapshot: mock(() => Promise.resolve([])),
    };
    const mockUserFacade = makeMentorFacade();

    const uc = new CreateStreamUc();
    uc.init({
      streamRepo: mockRepo,
      courseFacade: mockCourseFacade,
      userFacade: mockUserFacade,
      streamStudentRepo: {},
      eventBus: mockEventBus,
    } as unknown as StreamApiModuleResolver);

    const cmd = makeCreateCmd();

    const result = await uc.execute(cmd, 'm1');

    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    const event = (mockEventBus.publish as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(event.eventName).toBe('stream.created');
    expect(event.aggregateName).toBe('Stream');
    expect(event.aggregateId).toBe(result.uuid);
    expect(event.payload).toEqual({
      streamId: result.uuid,
      moduleId: cmd.moduleId,
    });
  });

  test('не падает при отсутствии eventBus (публикация необязательна)', async () => {
    const mockRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(undefined)),
      getAll: mock(() => Promise.resolve([])),
    };
    const mockCourseFacade = {
      getModuleSnapshot: mock(() => Promise.resolve([])),
    };
    const mockUserFacade = makeMentorFacade();

    const uc = new CreateStreamUc();
    uc.init({
      streamRepo: mockRepo,
      courseFacade: mockCourseFacade,
      userFacade: mockUserFacade,
      streamStudentRepo: {},
    } as unknown as StreamApiModuleResolver);

    const result = await uc.execute(makeCreateCmd(), 'm1');
    expect(result.title).toBe('Новый курс');
  });

  test('enrollmentKey — undefined если не передан', async () => {
    const mockRepo = {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(undefined)),
      getAll: mock(() => Promise.resolve([])),
    };
    const mockCourseFacade = {
      getModuleSnapshot: mock(() => Promise.resolve([])),
    };
    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: 'm1',
          name: 'Mentor',
          telegramId: 1,
          roles: [Role.MENTOR],
          createdAt: isoNow(),
        }),
      ),
      userExists: mock(() => Promise.resolve(true)),
      addRoleToUser: mock(() => Promise.resolve(undefined)),
      updateUserRole: mock(() => Promise.resolve(undefined)),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve(undefined)),
      registerGuest: mock(() => Promise.resolve({} as any)),
    };

    const uc = new CreateStreamUc();
    uc.init({
      streamRepo: mockRepo,
      courseFacade: mockCourseFacade,
      userFacade: mockUserFacade,
      streamStudentRepo: {},
    } as unknown as StreamApiModuleResolver);

    const cmd = {
      title: 'Без ключа',
      description: 'Описание',
      mentorId: '33333333-3333-4333-8333-333333333333',
      moduleId: '44444444-4444-4444-4444-444444444444',
      startDate: '2026-06-01T12:00',
    };

    const result = await uc.execute(cmd, 'm1');
    expect(result.enrollmentKey).toBeUndefined();
  });
});
