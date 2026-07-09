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
          uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          streamId: '77777777-7777-4777-8777-777777777777',
          userId: '11111111-1111-4111-8111-111111111111',
          status: 'advanced',
          completionDetails: { nextPreference: 'undecided' },
          enrolledAt: mockDate,
          currentStepId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
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
          uuid: '11111111-1111-4111-8111-111111111111',
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
        streamId: '77777777-7777-4777-8777-777777777777',
        studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        preference: 'wants_next',
      },
      '11111111-1111-4111-8111-111111111111',
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
          uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          streamId: '77777777-7777-4777-8777-777777777777',
          userId: '11111111-1111-4111-8111-111111111111',
          status: 'not_advanced',
          completionDetails: { nextPreference: 'undecided' },
          enrolledAt: mockDate,
          currentStepId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
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
          uuid: '11111111-1111-4111-8111-111111111111',
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
        streamId: '77777777-7777-4777-8777-777777777777',
        studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
        preference: 'wants_repeat',
      },
      '11111111-1111-4111-8111-111111111111',
    );

    const saved = (mockStudentRepo.save as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(saved.completionDetails.nextPreference).toBe('wants_repeat');
  });

  test('не владелец → access denied', async () => {
    const mockStudentRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          streamId: '77777777-7777-4777-8777-777777777777',
          userId: '11111111-1111-4111-8111-111111111111',
          status: 'advanced',
          completionDetails: { nextPreference: 'undecided' },
          enrolledAt: mockDate,
          currentStepId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
          steps: [],
          createdAt: mockDate,
        }),
      ),
    };

    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: '22222222-2222-4222-8222-222222222222',
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
          streamId: '77777777-7777-4777-8777-777777777777',
          studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          preference: 'wants_next',
        },
        '22222222-2222-4222-8222-222222222222',
      ),
    ).rejects.toThrow();
  });

  test('нельзя изменить предпочтение для active студента', async () => {
    const mockStudentRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          streamId: '77777777-7777-4777-8777-777777777777',
          userId: '11111111-1111-4111-8111-111111111111',
          status: 'active',
          enrolledAt: mockDate,
          currentStepId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01',
          steps: [],
          createdAt: mockDate,
        }),
      ),
    };

    const mockUserFacade = {
      getUserByUuid: mock(() =>
        Promise.resolve({
          uuid: '11111111-1111-4111-8111-111111111111',
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
          streamId: '77777777-7777-4777-8777-777777777777',
          studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          preference: 'wants_next',
        },
        '11111111-1111-4111-8111-111111111111',
      ),
    ).rejects.toThrow();
  });
});
