import { describe, expect, mock, test } from 'bun:test';
import type { UserApiModuleResolver } from '#domain/module';
import type { User } from '#domain/user/entity';
import type { UserRepo } from '#domain/user/repo';
import { Role } from '#domain/user/roles';
import { GetUsersByIdsUc } from './get-users-by-ids-uc';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    uuid: crypto.randomUUID(),
    name: 'Тест',
    telegramId: 1,
    roles: [Role.STUDENT],
    createdAt: '2026-05-01T12:00',
    ...overrides,
  };
}

function setupUc() {
  const getByUuids = mock(async (_uuids: string[]): Promise<User[]> => []);
  const warn = mock((_source: string, _message: string) => {});
  const info = mock((_source: string, _message: string) => {});

  const repo = {
    getByUuids,
  } as unknown as UserRepo;
  const uc = new GetUsersByIdsUc();
  uc.init({
    userRepo: repo,
    appResolver: {
      logger: { warn, info },
      mode: 'test',
      eventBus: { publish() {}, subscribe() {} },
    },
  } as unknown as UserApiModuleResolver);

  return { getByUuids, uc, warn };
}

describe('GetUsersByIdsUc', () => {
  test('возвращает карточки всех запрошенных пользователей', async () => {
    const { getByUuids, uc } = setupUc();
    const actor = makeUser();
    const ivan = makeUser({ name: 'Иван', telegramId: 11 });
    const maria = makeUser({ name: 'Мария', telegramId: 22 });
    getByUuids.mockResolvedValueOnce([ivan, maria]);

    const result = await uc.handle({ userIds: [ivan.uuid, maria.uuid] }, actor);

    expect(result).toEqual([ivan, maria]);
    expect(getByUuids).toHaveBeenCalledWith([ivan.uuid, maria.uuid]);
  });

  test('пустой список — пустой результат без похода в репозиторий', async () => {
    const { getByUuids, uc } = setupUc();
    const actor = makeUser();

    const result = await uc.handle({ userIds: [] }, actor);

    expect(result).toEqual([]);
    expect(getByUuids).not.toHaveBeenCalled();
  });

  test('отклоняет больше 100 идентификаторов', async () => {
    const { getByUuids, uc } = setupUc();
    const actor = makeUser();
    const userIds = Array.from({ length: 101 }, () => crypto.randomUUID());

    await expect(uc.handle({ userIds }, actor)).rejects.toThrow(
      'Переданы некорректные данные',
    );
    expect(getByUuids).not.toHaveBeenCalled();
  });

  test('дедуплицирует повторяющиеся идентификаторы', async () => {
    const { getByUuids, uc } = setupUc();
    const actor = makeUser();
    const ivan = makeUser({ name: 'Иван' });
    const maria = makeUser({ name: 'Мария' });
    getByUuids.mockResolvedValueOnce([ivan, maria]);

    const result = await uc.handle(
      { userIds: [ivan.uuid, maria.uuid, ivan.uuid] },
      actor,
    );

    expect(getByUuids).toHaveBeenCalledWith([ivan.uuid, maria.uuid]);
    expect(result).toHaveLength(2);
  });

  test('частично не найдены: возвращает найденных и пишет warn', async () => {
    const { getByUuids, uc, warn } = setupUc();
    const actor = makeUser();
    const ivan = makeUser({ name: 'Иван' });
    const missingUuid = crypto.randomUUID();
    getByUuids.mockResolvedValueOnce([ivan]);

    const result = await uc.handle(
      { userIds: [ivan.uuid, missingUuid] },
      actor,
    );

    expect(result).toEqual([ivan]);
    expect(warn).toHaveBeenCalledTimes(1);
  });

  test('требует авторизацию', async () => {
    const { uc } = setupUc();

    await expect(uc.handle({ userIds: [] })).rejects.toThrow(
      'Требуется авторизация',
    );
  });
});
