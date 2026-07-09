import { describe, expect, mock, test } from 'bun:test';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModuleResolver } from '#domain/module';
import { SetNextPreferenceUc } from './set-next-preference-uc';

const mockDate = '2026-06-01T10:00';

describe('SetNextPreferenceUc', () => {
  test('студент со статусом advanced меняет предпочтение на wants_next', async () => {
    const mockStudentRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: 'student-1',
          streamId: 'stream-1',
          userId: 'user-1',
          status: 'advanced',
          completionDetails: { nextPreference: 'undecided' },
          enrolledAt: mockDate,
          currentStepId: 'step-1',
          steps: [],
          createdAt: mockDate,
        }),
      ),
      save: mock(() => Promise.resolve()),
      getByUser: mock(() => Promise.resolve([])),
      getByStream: mock(() => Promise.resolve([])),
    };

    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: 'user-1',
          name: 'Student',
          telegramId: 1,
          roles: [],
          createdAt: mockDate,
        }),
      ),
      userExists: mock(() => Promise.resolve(true)),
    };

    const uc = new SetNextPreferenceUc();
    uc.init({
      streamRepo: {},
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
      tgFacade: {},
    } as unknown as StreamApiModuleResolver);

    await uc.execute(
      {
        streamId: 'stream-1',
        studentId: 'student-1',
        preference: 'wants_next',
      },
      'user-1',
    );

    expect(mockStudentRepo.save).toHaveBeenCalled();
    const saved = (mockStudentRepo.save as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(saved.completionDetails.nextPreference).toBe('wants_next');
  });

  test('not_advanced → wants_repeat', async () => {
    const mockStudentRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: 'student-1',
          streamId: 'stream-1',
          userId: 'user-1',
          status: 'not_advanced',
          completionDetails: { nextPreference: 'undecided' },
          enrolledAt: mockDate,
          currentStepId: 'step-1',
          steps: [],
          createdAt: mockDate,
        }),
      ),
      save: mock(() => Promise.resolve()),
      getByUser: mock(() => Promise.resolve([])),
      getByStream: mock(() => Promise.resolve([])),
    };

    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: 'user-1',
          name: 'Student',
          telegramId: 1,
          roles: [],
          createdAt: mockDate,
        }),
      ),
      userExists: mock(() => Promise.resolve(true)),
    };

    const uc = new SetNextPreferenceUc();
    uc.init({
      streamRepo: {},
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
      tgFacade: {},
    } as unknown as StreamApiModuleResolver);

    await uc.execute(
      {
        streamId: 'stream-1',
        studentId: 'student-1',
        preference: 'wants_repeat',
      },
      'user-1',
    );

    const saved = (mockStudentRepo.save as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(saved.completionDetails.nextPreference).toBe('wants_repeat');
  });

  test('не владелец → access denied', async () => {
    const mockStudentRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: 'student-1',
          streamId: 'stream-1',
          userId: 'user-1',
          status: 'advanced',
          completionDetails: { nextPreference: 'undecided' },
          enrolledAt: mockDate,
          currentStepId: 'step-1',
          steps: [],
          createdAt: mockDate,
        }),
      ),
    };

    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: 'user-2',
          name: 'Other',
          telegramId: 2,
          roles: [],
          createdAt: mockDate,
        }),
      ),
    };

    const uc = new SetNextPreferenceUc();
    uc.init({
      streamRepo: {},
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
      tgFacade: {},
    } as unknown as StreamApiModuleResolver);

    await expect(
      uc.execute(
        {
          streamId: 'stream-1',
          studentId: 'student-1',
          preference: 'wants_next',
        },
        'user-2',
      ),
    ).rejects.toThrow();
  });

  test('нельзя изменить предпочтение для active студента', async () => {
    const mockStudentRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: 'student-1',
          streamId: 'stream-1',
          userId: 'user-1',
          status: 'active',
          enrolledAt: mockDate,
          currentStepId: 'step-1',
          steps: [],
          createdAt: mockDate,
        }),
      ),
    };

    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: 'user-1',
          name: 'Student',
          telegramId: 1,
          roles: [Role.STUDENT],
          createdAt: mockDate,
        }),
      ),
    };

    const uc = new SetNextPreferenceUc();
    uc.init({
      streamRepo: {},
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
      tgFacade: {},
    } as unknown as StreamApiModuleResolver);

    await expect(
      uc.execute(
        {
          streamId: 'stream-1',
          studentId: 'student-1',
          preference: 'wants_next',
        },
        'user-1',
      ),
    ).rejects.toThrow();
  });
});
