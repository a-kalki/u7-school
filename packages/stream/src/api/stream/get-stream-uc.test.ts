import { describe, expect, mock, test } from 'bun:test';
import { isoNow } from '@u7-scl/core/shared';
import type { StreamApiModuleResolver } from '#domain/module';
import { StreamStatus } from '#domain/status';
import { GetStreamUc } from './get-stream-uc';

const streamId = '55555555-5555-4555-8555-555555555555';
const mentorId = '33333333-3333-4333-8333-333333333333';
const modId = '44444444-4444-4444-8444-444444444444';

const mockStream = {
  uuid: streamId,
  title: 'Тестовый поток',
  description: 'Описание',
  mentorId,
  moduleId: modId,
  startDate: '2026-06-01T12:00',
  status: StreamStatus.ACTIVE,
  contentSnapshot: [],
  createdAt: isoNow(),
};

const baseResolve = (overrides: Record<string, unknown> = {}) =>
  ({
    streamRepo: {
      getByUuid: mock(() => Promise.resolve(mockStream)),
      save: mock(() => Promise.resolve()),
      getAll: mock(() => Promise.resolve([])),
    },
    streamStudentRepo: {
      save: mock(() => Promise.resolve()),
      getByUuid: mock(() => Promise.resolve(undefined)),
      getByStream: mock(() => Promise.resolve([])),
      getByUser: mock(() => Promise.resolve([])),
    },
    userFacade: {
      getUserByUuid: mock(() => Promise.resolve(undefined)),
      userExists: mock(() => Promise.resolve(false)),
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
  }) as unknown as StreamApiModuleResolver;

describe('GetStreamUc', () => {
  test('возвращает поток по streamId', async () => {
    const uc = new GetStreamUc();
    uc.init(baseResolve());

    const result = await uc.execute({ streamId });
    expect(result.uuid).toBe(streamId);
    expect(result.title).toBe('Тестовый поток');
  });

  test('ошибка если поток не найден', async () => {
    const resolve = baseResolve({
      streamRepo: {
        getByUuid: mock(() => Promise.resolve(undefined)),
        save: mock(() => Promise.resolve()),
        getAll: mock(() => Promise.resolve([])),
      },
    });

    const uc = new GetStreamUc();
    uc.init(resolve);

    await expect(uc.execute({ streamId })).rejects.toThrow('Поток не найден');
  });
});
