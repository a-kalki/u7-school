import { describe, expect, mock, test } from 'bun:test';
import { Role } from '@u7-scl/user/domain';
import type { StreamApiModuleResolver } from '#domain/module';
import type { TgFacade } from '#domain/tg-facade';
import { DropStudentUc } from './drop-student-uc';

const mockDate = '2026-06-01T10:00';

describe('DropStudentUc', () => {
  test('студент выходит из потока: active→abandoned(voluntary), STUDENT снят', async () => {
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
          roles: [Role.STUDENT],
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

    const uc = new DropStudentUc();
    uc.init({
      streamRepo: {},
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
      tgFacade: mockTgFacade,
    } as unknown as StreamApiModuleResolver);

    await uc.execute(
      { streamId: '77777777-7777-4777-8777-777777777777', studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
      '11111111-1111-4111-8111-111111111111',
    );

    // studentRepo.save был вызван
    expect(mockStudentRepo.save).toHaveBeenCalled();
    const saved = (mockStudentRepo.save as ReturnType<typeof mock>).mock
      .calls[0]![0];
    expect(saved.status).toBe('abandoned');
    expect(saved.abandonDetails).toEqual({
      who: 'self',
      cause: 'voluntary',
    });

    // STUDENT роль снята
    expect(mockUserFacade.removeRoleFromUser).toHaveBeenCalledWith(
      '11111111-1111-4111-8111-111111111111',
      Role.STUDENT,
    );
  });

  test('не-владелец не может выйти (access denied)', async () => {
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
          uuid: '22222222-2222-4222-8222-222222222222',
          name: 'Other',
          telegramId: 2,
          roles: [Role.GUEST],
          createdAt: mockDate,
        }),
      ),
    };

    const uc = new DropStudentUc();
    uc.init({
      streamRepo: {},
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
      tgFacade: {},
    } as unknown as StreamApiModuleResolver);

    await expect(
      uc.execute({ streamId: '77777777-7777-4777-8777-777777777777', studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }, '22222222-2222-4222-8222-222222222222'),
    ).rejects.toThrow();
  });

  test('нельзя выйти из не-active статуса', async () => {
    const mockStudentRepo = {
      getByUuid: mock(() =>
        Promise.resolve({
          uuid: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          streamId: '77777777-7777-4777-8777-777777777777',
          userId: '11111111-1111-4111-8111-111111111111',
          status: 'enrolled',
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

    const uc = new DropStudentUc();
    uc.init({
      streamRepo: {},
      streamStudentRepo: mockStudentRepo,
      userFacade: mockUserFacade,
      courseFacade: {},
      tgFacade: {},
    } as unknown as StreamApiModuleResolver);

    await expect(
      uc.execute({ streamId: '77777777-7777-4777-8777-777777777777', studentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }, '11111111-1111-4111-8111-111111111111'),
    ).rejects.toThrow();
  });
});
