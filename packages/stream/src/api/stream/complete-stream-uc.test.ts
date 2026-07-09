import { describe, expect, mock, test } from 'bun:test';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModuleResolver } from '#domain/module';
import type { TgFacade } from '#domain/tg-facade';
import { CompleteStreamUc } from './complete-stream-uc';

const mockDate = '2026-06-01T10:00';

describe('CompleteStreamUc', () => {
  test('ментор завершает поток: студентам назначаются исходы, STUDENT снят, сообщения через TgFacade', async () => {
    const student1 = {
      uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      streamId: '77777777-7777-4777-8777-777777777777',
      userId: '11111111-1111-4111-8111-111111111111',
      status: 'active',
      enrolledAt: mockDate,
      currentStepId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
      steps: [],
      createdAt: mockDate,
    };
    const student2 = {
      uuid: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      streamId: '77777777-7777-4777-8777-777777777777',
      userId: '22222222-2222-4222-8222-222222222222',
      status: 'active',
      enrolledAt: mockDate,
      currentStepId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02',
      steps: [],
      createdAt: mockDate,
    };
    const student3 = {
      uuid: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
      streamId: '77777777-7777-4777-8777-777777777777',
      userId: '33333333-3333-4333-8333-333333333333',
      status: 'active',
      enrolledAt: mockDate,
      currentStepId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03',
      steps: [],
      createdAt: mockDate,
    };

    const mockStudentRepo = {
      getByStream: mock(() =>
        Promise.resolve([student1, student2, student3]),
      ),
      getByUuid: mock(() => Promise.resolve(undefined)),
      save: mock(() => Promise.resolve()),
      getByUser: mock(() => Promise.resolve([])),
    };

    const streamEntity = {
      uuid: '77777777-7777-4777-8777-777777777777',
      title: 'Test Stream',
          description: 'Test Description',
      mentorId: '66666666-6666-4666-8666-666666666666',
      moduleId: '33333333-3333-4333-8333-333333333333',
      startDate: mockDate,
      status: 'active',
      contentSnapshot: [],
      createdAt: mockDate,
    };

    const mockStreamRepo = {
      getByUuid: mock(() => Promise.resolve(streamEntity)),
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

    const uc = new CompleteStreamUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
      tgFacade: mockTgFacade,
    } as unknown as StreamApiModuleResolver);

    await uc.execute(
      {
        streamId: '77777777-7777-4777-8777-777777777777',
        studentOutcomes: [
          { studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', outcome: 'advanced' },
          { studentId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', outcome: 'not_advanced' },
          { studentId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', outcome: 'abandoned' },
        ],
      },
      '66666666-6666-4666-8666-666666666666',
    );

    // Студенты сохранены (3 + stream save)
    expect(mockStudentRepo.save).toHaveBeenCalledTimes(3);

    // advanced студент
    const saved1 = (mockStudentRepo.save as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(saved1.status).toBe('advanced');

    // not_advanced студент
    const saved2 = (mockStudentRepo.save as ReturnType<typeof mock>).mock
      .calls[1][0];
    expect(saved2.status).toBe('not_advanced');

    // abandoned студент
    const saved3 = (mockStudentRepo.save as ReturnType<typeof mock>).mock
      .calls[2][0];
    expect(saved3.status).toBe('abandoned');

    // STUDENT снят со всех
    expect(mockUserFacade.removeRoleFromUser).toHaveBeenCalledTimes(3);

    // TgFacade: сообщения только advanced и not_advanced (не abandoned)
    const tgCalls = (
      mockTgFacade.sendMessage as ReturnType<typeof mock>
    ).mock.calls;
    expect(tgCalls.length).toBe(2);
  });
});
