import { describe, expect, mock, test } from 'bun:test';
import type { UserFacade } from '@u7-scl/user/domain';
import type { User } from '@u7-scl/user/domain';
import { resolveUser } from './dispatcher';

function makeMockUserFacade(overrides: Partial<UserFacade> = {}): UserFacade {
  return {
    getUserByUuid: mock(async () => undefined),
    userExists: mock(async () => false),
    addRoleToUser: mock(async () => undefined),
    updateUserRole: mock(async () => undefined),
    getUserByTelegramId: mock(async () => undefined),
    removeRoleFromUser: mock(async () => undefined),
    registerGuest: mock(async () => {
      throw new Error('Не должен вызываться');
    }),
    ...overrides,
  } as unknown as UserFacade;
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    uuid: 'test-uuid',
    name: 'Тест',
    telegramId: 123,
    roles: ['GUEST'],
    createdAt: new Date().toISOString(),
    ...overrides,
  } as User;
}

describe('resolveUser', () => {
  test('возвращает существующего пользователя по telegramId', async () => {
    const existingUser = makeUser({ uuid: 'existing-uuid', telegramId: 999 });
    const userFacade = makeMockUserFacade({
      getUserByTelegramId: mock(async () => existingUser),
    });

    const user = await resolveUser(userFacade, 999, 'admin-uuid');

    expect(user).toEqual(existingUser);
    expect(userFacade.getUserByTelegramId).toHaveBeenCalledWith(999);
  });

  test('регистрирует гостя, если пользователь не найден', async () => {
    const newGuest = makeUser({ uuid: 'new-guest', telegramId: 888, name: 'Гость' });
    const registerGuestMock = mock(async () => newGuest);
    const userFacade = makeMockUserFacade({
      getUserByTelegramId: mock(async () => undefined),
      registerGuest: registerGuestMock,
    });

    const user = await resolveUser(userFacade, 888, 'admin-uuid', 'Гость');

    expect(user).toEqual(newGuest);
    expect(userFacade.getUserByTelegramId).toHaveBeenCalledWith(888);
    expect(registerGuestMock).toHaveBeenCalledWith(888, 'Гость', 'admin-uuid');
  });

  test('использует имя "Гость" по умолчанию, если name не передан', async () => {
    const newGuest = makeUser({ uuid: 'default-guest', name: 'Гость' });
    const registerGuestMock = mock(async () => newGuest);
    const userFacade = makeMockUserFacade({
      getUserByTelegramId: mock(async () => undefined),
      registerGuest: registerGuestMock,
    });

    const user = await resolveUser(userFacade, 777, 'admin-uuid');

    expect(user).toEqual(newGuest);
    expect(registerGuestMock).toHaveBeenCalledWith(777, 'Гость', 'admin-uuid');
  });

  test('пробрасывает ошибку registerGuest', async () => {
    const userFacade = makeMockUserFacade({
      getUserByTelegramId: mock(async () => undefined),
      registerGuest: mock(async () => {
        throw new Error('DB Down');
      }),
    });

    await expect(resolveUser(userFacade, 666, 'admin-uuid')).rejects.toThrow('DB Down');
  });
});
