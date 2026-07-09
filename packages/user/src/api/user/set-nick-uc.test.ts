import { describe, expect, mock, test } from 'bun:test';
import type { UserApiModuleResolver } from '#domain/module';
import type { User } from '#domain/user/entity';
import type { UserRepo } from '#domain/user/repo';
import { Role } from '#domain/user/roles';
import { SetNickUc } from './set-nick-uc';

function setupUc() {
  const save = mock(async (_user: User): Promise<void> => {});
  const getByUuid = mock(
    async (_uuid: string): Promise<User | undefined> => undefined,
  );
  const getByTelegramId = mock(
    async (_id: number): Promise<User | undefined> => undefined,
  );
  const getAll = mock(async (): Promise<User[]> => []);
  const isTelegramIdTaken = mock(
    async (_id: number): Promise<boolean> => false,
  );
  const isEmpty = mock(async (): Promise<boolean> => true);
  const isNickTaken = mock(async (_nick: string): Promise<boolean> => false);

  const repo: UserRepo = {
    save,
    getByUuid,
    getByTelegramId,
    getAll,
    isTelegramIdTaken,
    isEmpty,
    isNickTaken,
  };
  const uc = new SetNickUc();
  uc.init({ userRepo: repo } as unknown as UserApiModuleResolver);

  return { save, getByUuid, repo, uc, isNickTaken };
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    uuid: crypto.randomUUID(),
    name: 'Тест',
    telegramId: 1,
    roles: [Role.STUDENT, Role.MENTOR],
    createdAt: '2026-05-01T12:00',
    ...overrides,
  };
}

describe('SetNickUc', () => {
  describe('SUCCESS', () => {
    test('пользователь устанавливает себе ник', async () => {
      const { getByUuid, save, uc } = setupUc();
      const user = makeUser();

      getByUuid.mockResolvedValueOnce(user);

      await uc.handle({ nick: 'john_doe' }, user.uuid);

      const saved = save.mock.calls[0]![0] as User;
      expect(saved.nick).toBe('john_doe');
      expect(saved.updatedAt).toBeString();
    });

    test('пользователь очищает себе ник', async () => {
      const { getByUuid, save, uc } = setupUc();
      const user = makeUser({ nick: 'old_nick' });

      getByUuid.mockResolvedValueOnce(user);

      await uc.handle({ nick: '' }, user.uuid);

      const saved = save.mock.calls[0]![0] as User;
      expect(saved.nick).toBeUndefined();
    });
  });

  describe('FAIL', () => {
    test('отклоняет ник, уже занятый другим пользователем', async () => {
      const { getByUuid, isNickTaken, uc } = setupUc();
      const user = makeUser();

      getByUuid.mockResolvedValueOnce(user);
      isNickTaken.mockResolvedValueOnce(true);

      await expect(
        uc.handle({ nick: 'taken_nick' }, user.uuid),
      ).rejects.toThrow('Ник taken_nick уже занят');
    });
  });
});
