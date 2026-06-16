import { describe, expect, mock, test } from 'bun:test';
import { isoNow } from '@u7-scl/core/shared';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModuleResolver } from '#domain/module';
import { CreateStreamUc } from './create-stream-uc';

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
});
