import { describe, expect, mock, test } from 'bun:test';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModuleResolver } from '#domain/module';
import { ActivateStreamUc } from './activate-stream-uc';

const mockDate = '2026-06-01T10:00';

describe('ActivateStreamUc', () => {
  test('ментор активирует поток: enrolled студенты переходят в active', async () => {
    const student1 = {
      uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      streamId: '77777777-7777-4777-8777-777777777777',
      userId: '11111111-1111-4111-8111-111111111111',
      status: 'enrolled',
      enrolledAt: mockDate,
      currentStepId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
      steps: [],
      createdAt: mockDate,
    };

    const student2 = {
      uuid: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      streamId: '77777777-7777-4777-8777-777777777777',
      userId: '22222222-2222-4222-8222-222222222222',
      status: 'enrolled',
      enrolledAt: mockDate,
      currentStepId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02',
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
          uuid: '77777777-7777-4777-8777-777777777777',
          title: 'Test Stream',
          description: 'Test Description',
          mentorId: '66666666-6666-4666-8666-666666666666',
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
                  stepIds: ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01'],
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
          uuid: '66666666-6666-4666-8666-666666666666',
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
      { streamId: '77777777-7777-4777-8777-777777777777' },
      '66666666-6666-4666-8666-666666666666',
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
      uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      streamId: '77777777-7777-4777-8777-777777777777',
      userId: '11111111-1111-4111-8111-111111111111',
      status: 'enrolled',
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
      steps: [
        {
          stepId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
          status: 'completed' as const,
          issuedAt: mockDate,
          completedAt: mockDate,
        },
      ],
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
          uuid: '77777777-7777-4777-8777-777777777777',
          title: 'Test Stream',
          description: 'Test Description',
          mentorId: '66666666-6666-4666-8666-666666666666',
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
                  stepIds: ['aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01'],
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
          uuid: '66666666-6666-4666-8666-666666666666',
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
      { streamId: '77777777-7777-4777-8777-777777777777' },
      '66666666-6666-4666-8666-666666666666',
    );

    // Только один save (только enrolled студент активирован)
    expect(mockStudentRepo.save).toHaveBeenCalledTimes(1);
    const saved = (mockStudentRepo.save as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(saved.status).toBe('active');
  });
});
