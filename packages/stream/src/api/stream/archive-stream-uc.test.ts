import { describe, expect, mock, test } from 'bun:test';
import { isoNow } from '@u7-scl/core/shared';
import { Role } from '@u7-scl/user/domain';
import { StreamStatus } from '#domain/status';
import { ArchiveStreamUc } from './archive-stream-uc';

const streamId = '55555555-5555-4555-8555-555555555555';
const mentorId = '33333333-3333-4333-8333-333333333333';
const modId = '44444444-4444-4444-8444-444444444444';

const mockStream = {
  uuid: streamId, title: 'T', description: 'D', mentorId, moduleId: modId,
  startDate: '2026-06-01T12:00', status: StreamStatus.ACTIVE,
  contentSnapshot: [], createdAt: isoNow(),
};

const mentor = { uuid: mentorId, name: 'M', telegramId: 1, roles: [Role.MENTOR], createdAt: isoNow() };
const guest = { uuid: 'gggggggg-gggg-4ggg-8ggg-gggggggggggg', name: 'G', telegramId: 2, roles: [Role.GUEST], createdAt: isoNow() };

const baseResolve = (u: any = mentor) => ({
  streamRepo: { getByUuid: mock(() => Promise.resolve(mockStream)), save: mock(() => Promise.resolve()), getAll: mock(() => Promise.resolve([])) },
  streamStudentRepo: { save: mock(() => Promise.resolve()), getByUuid: mock(() => Promise.resolve(undefined)), getByStream: mock(() => Promise.resolve([])), getByUser: mock(() => Promise.resolve([])) },
  userFacade: { getUserByUuid: mock(() => Promise.resolve(u)), userExists: mock(() => Promise.resolve(true)), addRoleToUser: mock(() => Promise.resolve()), updateUserRole: mock(() => Promise.resolve()), getUserByTelegramId: mock(() => Promise.resolve(undefined)), removeRoleFromUser: mock(() => Promise.resolve()), registerGuest: mock(() => Promise.resolve({})) },
  courseFacade: { getModuleSnapshot: mock(() => Promise.resolve([])) },
}) as any;

describe('ArchiveStreamUc', () => {
  test('ментор архивирует поток', async () => {
    const uc = new ArchiveStreamUc();
    uc.init(baseResolve());
    await uc.execute({ streamId }, mentorId);
  });

  test('запрет для не-ментора', async () => {
    const uc = new ArchiveStreamUc();
    uc.init(baseResolve(guest));
    await expect(uc.execute({ streamId }, guest.uuid)).rejects.toThrow('Недостаточно прав');
  });
});
