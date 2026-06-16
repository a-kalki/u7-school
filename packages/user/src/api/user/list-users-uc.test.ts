import { describe, expect, mock, test } from 'bun:test';
import type { UserApiModuleResolver } from '#domain/module';
import type { User } from '#domain/user/entity';
import type { UserRepo } from '#domain/user/repo';
import { Role } from '#domain/user/roles';
import { ListUsersUc } from './list-users-uc';

function setupUc() {
  const save = mock(async (): Promise<void> => {});
  const getByUuid = mock(async (): Promise<User | undefined> => undefined);
  const getByTelegramId = mock(
    async (): Promise<User | undefined> => undefined,
  );
  const getAll = mock(async (): Promise<User[]> => []);
  const isTelegramIdTaken = mock(async (): Promise<boolean> => false);
  const isEmpty = mock(async (): Promise<boolean> => true);

  const repo: UserRepo = {
    save,
    getByUuid,
    getByTelegramId,
    getAll,
    isTelegramIdTaken,
    isEmpty,
  };
  const uc = new ListUsersUc();
  uc.init({ userRepo: repo } as unknown as UserApiModuleResolver);

  return { getAll, uc };
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    uuid: crypto.randomUUID(),
    name: 'Тест',
    telegramId: 1,
    roles: [Role.ADMIN],
    createdAt: '2026-05-01T12:00',
    ...overrides,
  };
}

describe('ListUsersUc', () => {
  test('возвращает пустой список для пустого репозитория', async () => {
    const { getAll, uc } = setupUc();
    getAll.mockResolvedValueOnce([]);

    const result = await uc.handle({});
    expect(result.users).toEqual([]);
    expect(result.total).toBe(0);
    expect(getAll).toHaveBeenCalledTimes(1);
  });

  test('возвращает всех пользователей', async () => {
    const { getAll, uc } = setupUc();
    const u1 = makeUser({ name: 'Иван' });
    const u2 = makeUser({
      name: 'Мария',
      telegramId: 2,
      roles: [Role.STUDENT],
    });
    getAll.mockResolvedValueOnce([u1, u2]);

    const result = await uc.handle({});

    expect(result.users).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.users.map((u) => u.name)).toContain('Иван');
    expect(result.users.map((u) => u.name)).toContain('Мария');
    expect(getAll).toHaveBeenCalledTimes(1);
  });

  test('передаёт лимит в репозиторий (по умолчанию 20)', async () => {
    const { getAll, uc } = setupUc();
    getAll.mockResolvedValueOnce([]);

    await uc.handle({});

    expect(getAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 20 }));
  });

  test('передаёт кастомный лимит', async () => {
    const { getAll, uc } = setupUc();
    getAll.mockResolvedValueOnce([]);

    await uc.handle({ limit: 5 });

    expect(getAll).toHaveBeenCalledWith(expect.objectContaining({ limit: 5 }));
  });

  test('передаёт фильтр по роли', async () => {
    const { getAll, uc } = setupUc();
    getAll.mockResolvedValueOnce([]);

    await uc.handle({ role: Role.STUDENT });

    expect(getAll).toHaveBeenCalledWith(
      expect.objectContaining({ role: Role.STUDENT }),
    );
  });

  test('передаёт фильтр по имени (частичное совпадение)', async () => {
    const { getAll, uc } = setupUc();
    getAll.mockResolvedValueOnce([]);

    await uc.handle({ name: 'Иван' });

    expect(getAll).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Иван' }),
    );
  });

  test('передаёт фильтр по telegramId', async () => {
    const { getAll, uc } = setupUc();
    getAll.mockResolvedValueOnce([]);

    await uc.handle({ telegramId: 12345 });

    expect(getAll).toHaveBeenCalledWith(
      expect.objectContaining({ telegramId: 12345 }),
    );
  });

  test('передаёт сортировку (по умолчанию createdAt:desc)', async () => {
    const { getAll, uc } = setupUc();
    getAll.mockResolvedValueOnce([]);

    await uc.handle({});

    expect(getAll).toHaveBeenCalledWith(
      expect.objectContaining({ sort: 'createdAt:desc' }),
    );
  });

  test('передаёт кастомную сортировку', async () => {
    const { getAll, uc } = setupUc();
    getAll.mockResolvedValueOnce([]);

    await uc.handle({ sort: 'name:asc' });

    expect(getAll).toHaveBeenCalledWith(
      expect.objectContaining({ sort: 'name:asc' }),
    );
  });

  test('возвращает appliedFilters в результате', async () => {
    const { getAll, uc } = setupUc();
    getAll.mockResolvedValueOnce([]);

    const result = await uc.handle({ role: Role.MENTOR, limit: 10 });

    expect(result.appliedFilters).toEqual({
      limit: 10,
      role: Role.MENTOR,
      name: undefined,
      telegramId: undefined,
      sort: 'createdAt:desc',
    });
  });
});
