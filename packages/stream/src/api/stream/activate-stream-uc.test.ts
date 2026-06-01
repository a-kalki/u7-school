import { describe, expect, mock, test } from 'bun:test';
import { isoNow } from '@u7-scl/core/shared';
import { Role } from '@u7-scl/user/domain';
import { StreamStatus } from '#domain/status';
import { ActivateStreamUc } from './activate-stream-uc';

/** UUID-шаблонные ID для тестов */
const mentorId = '33333333-3333-4333-8333-333333333333';
const modId = '44444444-4444-4444-8444-444444444444';
const streamId = '55555555-5555-4555-8555-555555555555';
const userId1 = '66666666-6666-4666-8666-666666666666';
const userId2 = '77777777-7777-4777-8777-777777777777';
const firstStepId = '88888888-8888-4888-8888-888888888888';

/** Поток в статусе enrollment с первым шагом */
const enrollmentStream = {
  uuid: streamId,
  title: 'Поток',
  description: 'Описание',
  mentorId,
  moduleId: modId,
  startDate: '2026-06-01T12:00',
  status: StreamStatus.ENROLLMENT,
  contentSnapshot: [
    {
      projectId: '11111111-1111-4111-8111-111111111111',
      projectTitle: 'П1',
      lessons: [
        {
          lessonId: '22222222-2222-4222-8222-222222222222',
          lessonTitle: 'У1',
          stepIds: [firstStepId],
        },
      ],
    },
  ],
  createdAt: isoNow(),
};

/** Студент без выданных шагов (только зачислен) */
const enrolledStudentNoSteps = {
  uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  streamId,
  userId: userId1,
  enrolledAt: isoNow(),
  status: 'active' as const,
  currentStepId: firstStepId,
  steps: [],
  createdAt: isoNow(),
};

/** Студент с уже выданным шагом */
const enrolledStudentWithStep = {
  uuid: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  streamId,
  userId: userId2,
  enrolledAt: isoNow(),
  status: 'active' as const,
  currentStepId: firstStepId,
  steps: [
    {
      stepId: firstStepId,
      status: 'issued' as const,
      issuedAt: isoNow(),
    },
  ],
  createdAt: isoNow(),
};

/** Ментор — актор с ролью MENTOR */
const mentorActor = {
  uuid: mentorId,
  name: 'Test Mentor',
  telegramId: 1,
  roles: [Role.MENTOR],
  createdAt: isoNow(),
};

const baseResolve = (overrides: Record<string, unknown> = {}) =>
  ({
    streamRepo: {
      getByUuid: mock(() => Promise.resolve(enrollmentStream)),
      save: mock(() => Promise.resolve()),
      getAll: mock(() => Promise.resolve([])),
    },
    streamStudentRepo: {
      getByStream: mock(() =>
        Promise.resolve([enrolledStudentNoSteps, enrolledStudentWithStep]),
      ),
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(undefined)),
      getByUser: mock(() => Promise.resolve([])),
    },
    userFacade: {
      getUserByUuid: mock(() => Promise.resolve(mentorActor)),
      userExists: mock(() => Promise.resolve(true)),
      addRoleToUser: mock(() => Promise.resolve()),
      updateUserRole: mock(() => Promise.resolve()),
      getUserByTelegramId: mock(() => Promise.resolve(undefined)),
      removeRoleFromUser: mock(() => Promise.resolve()),
      registerGuest: mock(() => Promise.resolve({} as any)),
    },
    courseFacade: {
      getModuleSnapshot: mock(() => Promise.resolve([])),
    },
    ...overrides,
  }) as any;

describe('ActivateStreamUc', () => {
  test('успешная активация — поток active, студентам без шагов выдан первый шаг', async () => {
    const savedStudents: any[] = [];
    const resolve = baseResolve({
      streamStudentRepo: {
        getByStream: mock(() =>
          Promise.resolve([enrolledStudentNoSteps, enrolledStudentWithStep]),
        ),
        save: mock(async (s: any) => {
          savedStudents.push(s);
        }),
        getByUuid: mock(() => Promise.resolve(undefined)),
        getByUser: mock(() => Promise.resolve([])),
      },
    });

    const uc = new ActivateStreamUc();
    uc.init(resolve);

    await uc.execute({ streamId }, mentorId);

    // Поток сохранён в active
    const savedStream = (resolve.streamRepo.save as any).mock.calls[0]?.[0];
    expect(savedStream.status).toBe(StreamStatus.ACTIVE);

    // Студент без шагов получил первый шаг
    const noStepsStudent = savedStudents.find(
      (s: any) => s.uuid === 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );
    expect(noStepsStudent.steps).toHaveLength(1);
    expect(noStepsStudent.steps[0].stepId).toBe(firstStepId);
    expect(noStepsStudent.steps[0].status).toBe('issued');
    expect(noStepsStudent.currentStepId).toBe(firstStepId);

    // Студент с шагом не сохранялся (пропущен)
    const withStepStudent = savedStudents.find(
      (s: any) => s.uuid === 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    );
    expect(withStepStudent).toBeUndefined();
  });

  test('пропуск студентов, у которых уже есть выданные шаги', async () => {
    let saveCalledForPreIssued = false;
    const resolve = baseResolve({
      streamStudentRepo: {
        getByStream: mock(() => Promise.resolve([enrolledStudentWithStep])),
        save: mock(async (s: any) => {
          if (s.uuid === 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb') {
            saveCalledForPreIssued = true;
          }
        }),
        getByUuid: mock(() => Promise.resolve(undefined)),
        getByUser: mock(() => Promise.resolve([])),
      },
    });

    const uc = new ActivateStreamUc();
    uc.init(resolve);

    await uc.execute({ streamId }, mentorId);

    // Студент с уже выданными шагами не был сохранён (нет изменений)
    expect(saveCalledForPreIssued).toBe(false);
  });

  test('поток без зачисленных студентов — активируется без ошибок', async () => {
    const resolve = baseResolve({
      streamStudentRepo: {
        getByStream: mock(() => Promise.resolve([])),
        save: mock(() => Promise.resolve()),
        getByUuid: mock(() => Promise.resolve(undefined)),
        getByUser: mock(() => Promise.resolve([])),
      },
    });

    const uc = new ActivateStreamUc();
    uc.init(resolve);

    // Не должно бросать ошибку
    await uc.execute({ streamId }, mentorId);

    const savedStream = (resolve.streamRepo.save as any).mock.calls[0]?.[0];
    expect(savedStream.status).toBe(StreamStatus.ACTIVE);
  });

  test('ошибка если поток не в статусе enrollment', async () => {
    const resolve = baseResolve({
      streamRepo: {
        getByUuid: mock(() =>
          Promise.resolve({ ...enrollmentStream, status: StreamStatus.ACTIVE }),
        ),
        save: mock(() => Promise.resolve()),
        getAll: mock(() => Promise.resolve([])),
      },
    });

    const uc = new ActivateStreamUc();
    uc.init(resolve);

    await expect(uc.execute({ streamId }, mentorId)).rejects.toThrow();
  });
});
