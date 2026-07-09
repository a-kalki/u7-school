import { describe, expect, mock, test } from 'bun:test';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModuleResolver } from '#domain/module';
import { CompleteStreamUc } from './complete-stream-uc';

const mockDate = '2026-06-01T10:00';

describe('CompleteStreamUc', () => {
  test('ментор завершает поток когда нет активных студентов', async () => {
    const mockStudentRepo = {
      getByStream: mock(() =>
        Promise.resolve([
          {
            uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            streamId: '77777777-7777-4777-8777-777777777777',
            userId: '11111111-1111-4111-8111-111111111111',
            status: 'advanced',
            enrolledAt: mockDate,
            currentStepId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
            steps: [],
            createdAt: mockDate,
          },
        ]),
      ),
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(undefined)),
      getByUser: mock(() => Promise.resolve([])),
    };

    const mockStreamRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: '77777777-7777-4777-8777-777777777777',
          title: 'Test Stream',
          description: 'Test Description',
          mentorId: '66666666-6666-4666-8666-666666666666',
          moduleId: '33333333-3333-4333-8333-333333333333',
          startDate: mockDate,
          status: 'active',
          contentSnapshot: [],
          createdAt: mockDate,
        }),
      ),
      save: mock(() => Promise.resolve()),
      getAll: mock(() => Promise.resolve([])),
    };

    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: '66666666-6666-4666-8666-666666666666',
          name: 'Mentor',
          telegramId: 1,
          roles: [Role.MENTOR],
          createdAt: mockDate,
        }),
      ),
      userExists: mock(() => Promise.resolve(true)),
    };

    const uc = new CompleteStreamUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
      tgFacade: {},
    } as unknown as StreamApiModuleResolver);

    await uc.execute(
      { streamId: '77777777-7777-4777-8777-777777777777' },
      '66666666-6666-4666-8666-666666666666',
    );

    expect(mockStreamRepo.save).toHaveBeenCalled();
  });

  test('ошибка если остались активные студенты', async () => {
    const mockStudentRepo = {
      getByStream: mock(() =>
        Promise.resolve([
          {
            uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            streamId: '77777777-7777-4777-8777-777777777777',
            userId: '11111111-1111-4111-8111-111111111111',
            status: 'active',
            enrolledAt: mockDate,
            currentStepId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
            steps: [],
            createdAt: mockDate,
          },
        ]),
      ),
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(undefined)),
      getByUser: mock(() => Promise.resolve([])),
    };

    const mockStreamRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: '77777777-7777-4777-8777-777777777777',
          title: 'Test Stream',
          description: 'Test Description',
          mentorId: '66666666-6666-4666-8666-666666666666',
          moduleId: '33333333-3333-4333-8333-333333333333',
          startDate: mockDate,
          status: 'active',
          contentSnapshot: [],
          createdAt: mockDate,
        }),
      ),
      save: mock(() => Promise.resolve()),
      getAll: mock(() => Promise.resolve([])),
    };

    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: '66666666-6666-4666-8666-666666666666',
          name: 'Mentor',
          telegramId: 1,
          roles: [Role.MENTOR],
          createdAt: mockDate,
        }),
      ),
      userExists: mock(() => Promise.resolve(true)),
    };

    const uc = new CompleteStreamUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
      tgFacade: {},
    } as unknown as StreamApiModuleResolver);

    await expect(
      uc.execute(
        { streamId: '77777777-7777-4777-8777-777777777777' },
        '66666666-6666-4666-8666-666666666666',
      ),
    ).rejects.toThrow();
  });
});
