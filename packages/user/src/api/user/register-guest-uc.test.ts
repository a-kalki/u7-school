import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { ApiApp } from '@u7/core/api';
import { BaseJsonDb } from '@u7/core/infra';
import { Role } from '#domain/user/roles';
import { UserJsonRepo } from '#infra/db/user-json-repo';
import { UserApiModule } from '../module';

describe('RegisterGuestUc', () => {
  let db: BaseJsonDb;
  let userRepo: UserJsonRepo;
  let mod: UserApiModule;
  let apiApp: ApiApp<any>;
  let tmpDir: string;
  const adminUuid = '00000000-0000-4000-a000-000000000000';

  beforeEach(async () => {
    tmpDir = mkdtempSync('/tmp/user-reg-test-');
    db = new BaseJsonDb();
    userRepo = new UserJsonRepo(join(tmpDir, 'users.json'), undefined, db);
    mod = new UserApiModule({ userRepo });
    apiApp = new ApiApp([mod]);

    // Seed admin
    db.begin();
    await userRepo.save({
      uuid: adminUuid,
      name: 'Admin',
      telegramId: 1,
      roles: [Role.ADMIN],
      createdAt: '2024-01-01T00:00',
    });
    await db.commit();
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  test('SUCCESS: регистрирует нового гостя', async () => {
    const result = (await apiApp.execute(
      'register-guest',
      { telegramId: 12345, name: 'Ivan' },
      adminUuid,
    )) as any;

    expect(result.telegramId).toBe(12345);
    expect(result.roles).toContain(Role.GUEST);
    expect(result.name).toBe('Ivan');
  });

  test('SUCCESS: возвращает существующего пользователя без изменений', async () => {
    // Предварительно создаем студента
    const userUuid = '11111111-1111-4000-a000-111111111111';
    db.begin();
    await userRepo.save({
      uuid: userUuid,
      name: 'Existing',
      telegramId: 12345,
      roles: [Role.STUDENT],
      createdAt: '2024-01-01T00:00',
    });
    await db.commit();

    const result = (await apiApp.execute(
      'register-guest',
      { telegramId: 12345, name: 'New Name' },
      adminUuid,
    )) as any;

    expect(result.uuid).toBe(userUuid);
    expect(result.name).toBe('Existing'); // Имя не изменилось
    expect(result.roles).toEqual([Role.STUDENT]); // Роли не изменились
  });

  test('FAIL: отклоняет вызов не от админа', async () => {
    const userUuid = '22222222-2222-4000-a000-222222222222';
    db.begin();
    await userRepo.save({
      uuid: userUuid,
      name: 'User',
      telegramId: 999,
      roles: [Role.GUEST],
      createdAt: '2024-01-01T00:00',
    });
    await db.commit();

    const promise = apiApp.execute(
      'register-guest',
      { telegramId: 12345, name: 'Ivan' },
      userUuid,
    );

    expect(promise).rejects.toThrow('Только администратор');
  });
});
