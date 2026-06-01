import { describe, expect, mock, test } from 'bun:test';
import { isoNow } from '@u7-scl/core/shared';
import { Role } from '@u7-scl/user/domain';
import { CreateStreamUc } from './create-stream-uc';

describe('CreateStreamUc', () => {
  test('успешно создает поток MENTOR-ом', async () => {
    const mockRepo = { save: mock(() => Promise.resolve()) };
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
    };

    const uc = new CreateStreamUc();
    // @ts-expect-error - упрощенный DI для теста
    uc.init({
      streamRepo: mockRepo,
      courseFacade: mockCourseFacade,
      userFacade: mockUserFacade,
    });

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
    };

    const uc = new CreateStreamUc();
    // @ts-expect-error
    uc.init({ userFacade: mockUserFacade });

    await expect(uc.execute({} as any, 'g1')).rejects.toThrow();
  });
});
