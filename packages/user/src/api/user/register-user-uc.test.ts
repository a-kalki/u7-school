import { describe, expect, mock, test } from 'bun:test';
import type { User } from '#domain/user/entity';
import type { UserRepo } from '#domain/user/repo';
import { Role } from '#domain/user/roles';
import { RegisterUserUc } from './register-user-uc';

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

  const repo: UserRepo = {
    save,
    getByUuid,
    getByTelegramId,
    getAll,
    isTelegramIdTaken,
    isEmpty,
  };
  const uc = new RegisterUserUc();
  uc.init({ userRepo: repo });

  return { save, isTelegramIdTaken, uc };
}

describe('RegisterUserUc', () => {
  describe('SUCCESS', () => {
    test('создаёт пользователя с ролью GUEST', async () => {
      const { save, uc } = setupUc();

      const user = await uc.handle({ name: 'Анна', telegramId: 789 });

      expect(user.name).toBe('Анна');
      expect(user.telegramId).toBe(789);
      expect(user.roles).toEqual([Role.GUEST]);
      expect(save).toHaveBeenCalledTimes(1);
    });

    test('не требует авторизации', async () => {
      const { uc } = setupUc();

      const user = await uc.handle({ name: 'Борис', telegramId: 999 });

      expect(user).toBeDefined();
      expect(user.roles).toEqual([Role.GUEST]);
    });
  });

  describe('FAIL', () => {
    test('отклоняет дубликат telegramId', async () => {
      const { isTelegramIdTaken, uc } = setupUc();
      isTelegramIdTaken.mockResolvedValueOnce(true);

      await expect(uc.handle({ name: 'Б', telegramId: 1 })).rejects.toThrow(
        'Пользователь с таким telegramId уже существует',
      );
    });

    test('отклоняет невалидную команду', async () => {
      const { uc } = setupUc();

      await expect(uc.handle({ name: '', telegramId: -1 })).rejects.toThrow(
        'Переданы некорректные данные',
      );
    });
  });
});
