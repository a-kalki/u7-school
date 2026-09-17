import { describe, expect, mock, test } from 'bun:test';
import { Role, type User } from '@u7-scl/app/domain';
import type { StreamApiModuleResolver } from '#domain/module';
import { CompleteStreamUc } from './complete-stream-uc';

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
    } as unknown as StreamApiModuleResolver);

    await uc.execute(
      { streamId: '77777777-7777-4777-8777-777777777777' },
      makeActor('66666666-6666-4666-8666-666666666666'),
    );

    expect(mockStreamRepo.save).toHaveBeenCalled();
  });

  test('событие stream.completed публикуется на шину после сохранения (ФР-1)', async () => {
    const mockStudentRepo = {
      getByStream: mock(() => Promise.resolve([])),
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

    const mockEventBus = { publish: mock(() => {}) };

    const uc = new CompleteStreamUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: {
        getUserByUuid: mock(() => Promise.resolve(undefined)),
        userExists: mock(() => Promise.resolve(true)),
      },
      courseFacade: {},
      eventBus: mockEventBus,
    } as unknown as StreamApiModuleResolver);

    await uc.execute(
      { streamId: '77777777-7777-4777-8777-777777777777' },
      makeActor('66666666-6666-4666-8666-666666666666'),
    );

    expect(mockStreamRepo.save).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    const event = (mockEventBus.publish as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(event.eventName).toBe('stream.completed');
    expect(event.aggregateName).toBe('Stream');
    expect(event.aggregateId).toBe('77777777-7777-4777-8777-777777777777');
    expect(event.payload).toEqual({
      streamId: '77777777-7777-4777-8777-777777777777',
    });
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
    } as unknown as StreamApiModuleResolver);

    await expect(
      uc.execute(
        { streamId: '77777777-7777-4777-8777-777777777777' },
        makeActor('66666666-6666-4666-8666-666666666666'),
      ),
    ).rejects.toThrow();
  });
});
