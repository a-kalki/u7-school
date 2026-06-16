import { describe, expect, test } from 'bun:test';
import type { AppResolver } from '@u7-scl/core/domain';
import type { User } from '#domain/user/entity';
import { Role } from '#domain/user/roles';
import { UserJsonRepo } from '#infra/db/user-json-repo';
import { UserApiModule } from './module';

const NO_SEED = '/nonexistent-seed.json';
const appResolver = {
  logger: console,
  mode: 'test' as const,
} as unknown as AppResolver;

describe('UserApiModule + UserJsonRepo', () => {
  test('user.create: создаёт пользователя если есть права ADMIN', async () => {
    const jsonFile = '/tmp/user-module-test-2.json';
    await Bun.$`rm -f ${jsonFile}`;

    const repo = new UserJsonRepo(jsonFile, NO_SEED);
    const mod = new UserApiModule({ userRepo: repo, appResolver });

    const admin: User = {
      uuid: crypto.randomUUID(),
      name: 'Админ',
      telegramId: 1,
      roles: [Role.ADMIN],
      createdAt: '2026-05-01T12:00',
    };
    await repo.save(admin);

    const result = await mod.execute(
      'create-user',
      { name: 'Студент', telegramId: 2, roles: [Role.STUDENT] },
      admin.uuid,
    );
    expect((result as User).roles).toEqual([Role.STUDENT]);

    await Bun.$`rm -f ${jsonFile}`;
  });

  test('user.get: возвращает пользователя', async () => {
    const jsonFile = '/tmp/user-module-test-3.json';
    await Bun.$`rm -f ${jsonFile}`;

    const repo = new UserJsonRepo(jsonFile, NO_SEED);
    const user: User = {
      uuid: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Иван',
      telegramId: 1,
      roles: [Role.ADMIN],
      createdAt: '2026-05-01T12:00',
    };
    await repo.save(user);

    const mod = new UserApiModule({ userRepo: repo, appResolver });

    const result = await mod.execute('get-user', { uuid: user.uuid });
    expect((result as User).name).toBe('Иван');

    await Bun.$`rm -f ${jsonFile}`;
  });

  test('user.list: возвращает список', async () => {
    const jsonFile = '/tmp/user-module-test-4.json';
    await Bun.$`rm -f ${jsonFile}`;

    const repo = new UserJsonRepo(jsonFile, NO_SEED);
    const user: User = {
      uuid: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Иван',
      telegramId: 1,
      roles: [Role.ADMIN],
      createdAt: '2026-05-01T12:00',
    };
    await repo.save(user);

    const mod = new UserApiModule({ userRepo: repo, appResolver });

    const result = await mod.execute('list-users', {});
    expect((result as { users: User[] }).users).toHaveLength(1);

    await Bun.$`rm -f ${jsonFile}`;
  });

  test('user.get-by-telegram-id: находит пользователя', async () => {
    const jsonFile = '/tmp/user-module-test-5.json';
    await Bun.$`rm -f ${jsonFile}`;

    const repo = new UserJsonRepo(jsonFile, NO_SEED);
    const user: User = {
      uuid: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Иван',
      telegramId: 12345,
      roles: [Role.ADMIN],
      createdAt: '2026-05-01T12:00',
    };
    await repo.save(user);

    const mod = new UserApiModule({ userRepo: repo, appResolver });

    const result = await mod.execute('get-user-by-telegram-id', {
      telegramId: 12345,
    });
    expect((result as User).name).toBe('Иван');

    await Bun.$`rm -f ${jsonFile}`;
  });

  test('неизвестная команда — ошибка', async () => {
    const jsonFile = '/tmp/user-module-test-6.json';
    await Bun.$`rm -f ${jsonFile}`;

    const mod = new UserApiModule({
      userRepo: new UserJsonRepo(jsonFile, NO_SEED),
      appResolver,
    });

    await expect(mod.execute('unknown' as any, {} as any)).rejects.toThrow(
      "Команда 'unknown' не найдена",
    );

    await Bun.$`rm -f ${jsonFile}`;
  });
});
