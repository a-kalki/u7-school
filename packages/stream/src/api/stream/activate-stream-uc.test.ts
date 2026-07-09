import { describe, expect, mock, test } from 'bun:test';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModuleResolver } from '#domain/module';
import { ActivateStreamUc } from './activate-stream-uc';

const mockDate = '2026-06-01T10:00';

describe('ActivateStreamUc', () => {
  test('ментор активирует поток: enrolled студенты переходят в active', async () => {
    const student1 = {
      uuid: 'student-1',
      streamId: 'stream-1',
      userId: 'user-1',
      status: 'enrolled',
      enrolledAt: mockDate,
      currentStepId: 'step-1',
      steps: [],
      createdAt: mockDate,
    };

    const student2 = {
      uuid: 'student-2',
      streamId: 'stream-1',
      userId: 'user-2',
      status: 'enrolled',
      enrolledAt: mockDate,
      currentStepId: 'step-2',
      steps: [],
      createdAt: mockDate,
    };

    const mockStudentRepo = {
      getByStream: mock(() => Promise.resolve([student1, student2])),
      getByUuid: mock(() => Promise.resolve(undefined)),
      save: mock(() => Promise.resolve()),
      getByUser: mock(() => Promise.resolve([])),
    };

    const mockStreamRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: 'stream-1',
          title: 'Test Stream',
          mentorId: 'mentor-1',
          moduleId: 'module-1',
          startDate: mockDate,
          status: 'enrollment',
          contentSnapshot: [
            {
              projectId: 'proj-1',
              projectTitle: 'Project 1',
              lessons: [
                {
                  lessonId: 'lesson-1',
                  lessonTitle: 'Lesson 1',
                  stepIds: ['step-1'],
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
      userExists: mock(() => Promise.resolve(true)),
    };

    const uc = new ActivateStreamUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
      tgFacade: {},
    } as unknown as StreamApiModuleResolver);

    await uc.execute(
      { streamId: 'stream-1' },
      'mentor-1',
    );

    // streamActivate
    expect(mockStreamRepo.save).toHaveBeenCalled();

    // studentActivate: оба студента переведены в active
    expect(mockStudentRepo.save).toHaveBeenCalledTimes(2);
    const savedStates = (
      mockStudentRepo.save as ReturnType<typeof mock>
    ).mock.calls.map((c) => c[0] as Record<string, unknown>);
    expect(savedStates[0]!.status).toBe('active');
    expect(savedStates[1]!.status).toBe('active');
  });

  test('студенты не-enrolled не активируются', async () => {
    const student1 = {
      uuid: 'student-1',
      streamId: 'stream-1',
      userId: 'user-1',
      status: 'enrolled',
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
      steps: [{ stepId: 'step-1', completedAt: mockDate }],
      createdAt: mockDate,
    };

    const mockStudentRepo = {
      getByStream: mock(() => Promise.resolve([student1, student2])),
      getByUuid: mock(() => Promise.resolve(undefined)),
      save: mock(() => Promise.resolve()),
      getByUser: mock(() => Promise.resolve([])),
    };

    const mockStreamRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: 'stream-1',
          title: 'Test Stream',
          mentorId: 'mentor-1',
          moduleId: 'module-1',
          startDate: mockDate,
          status: 'enrollment',
          contentSnapshot: [
            {
              projectId: 'proj-1',
              projectTitle: 'Project 1',
              lessons: [
                {
                  lessonId: 'lesson-1',
                  lessonTitle: 'Lesson 1',
                  stepIds: ['step-1'],
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
      userExists: mock(() => Promise.resolve(true)),
    };

    const uc = new ActivateStreamUc();
    uc.init({
      streamRepo: mockStreamRepo,
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
      tgFacade: {},
    } as unknown as StreamApiModuleResolver);

    await uc.execute(
      { streamId: 'stream-1' },
      'mentor-1',
    );

    // Только один save (только enrolled студент активирован)
    expect(mockStudentRepo.save).toHaveBeenCalledTimes(1);
    const saved = (mockStudentRepo.save as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(saved.status).toBe('active');
  });
});
