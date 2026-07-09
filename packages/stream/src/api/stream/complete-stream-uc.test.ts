import { describe, expect, mock, test } from 'bun:test';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModuleResolver } from '#domain/module';
import type { TgFacade } from '#domain/tg-facade';
import { CompleteStreamUc } from './complete-stream-uc';

const mockDate = '2026-06-01T10:00';

describe('CompleteStreamUc', () => {
  test('ментор завершает поток: студентам назначаются исходы, STUDENT снят, сообщения через TgFacade', async () => {
    const student1 = {
      uuid: 'student-1',
      streamId: 'stream-1',
      userId: 'user-1',
      status: 'active',
      enrolledAt: mockDate,
      currentStepId: 'step-1',
      steps: [],
      createdAt: mockDate,
    };
    const student2 = {
      uuid: 'student-2',
      streamId: 'stream-1',
      userId: 'user-2',
      status: 'active',
      enrolledAt: mockDate,
      currentStepId: 'step-2',
      steps: [],
      createdAt: mockDate,
    };
    const student3 = {
      uuid: 'student-3',
      streamId: 'stream-1',
      userId: 'user-3',
      status: 'active',
      enrolledAt: mockDate,
      currentStepId: 'step-3',
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
      uuid: 'stream-1',
      title: 'Test Stream',
      mentorId: 'mentor-1',
      moduleId: 'module-1',
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
          uuid: 'mentor-1',
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
        streamId: 'stream-1',
        studentOutcomes: [
          { studentId: 'student-1', outcome: 'advanced' },
          { studentId: 'student-2', outcome: 'not_advanced' },
          { studentId: 'student-3', outcome: 'abandoned' },
        ],
      },
      'mentor-1',
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
