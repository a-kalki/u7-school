import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import type { Module } from '#domain/module/entity';
import type { ModuleRepo } from '#domain/module/repo';
import { Status } from '#domain/status';
import { EnrichModuleUc } from './enrich-module-uc';

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

function makeModule(authorId: string, overrides: Partial<Module> = {}): Module {
  return {
    uuid: crypto.randomUUID(),
    title: 'Курс',
    description: 'Описание',
    authorId,
    targetAudience: undefined,
    goal: undefined,
    result: undefined,
    rules: undefined,
    additional: undefined,
    tags: [],
    status: Status.DRAFT,
    createdAt: '2026-05-01T12:00',
    projects: [],
    ...overrides,
  } as Module;
}

function setupUc() {
  const save = mock(async (_module: Module): Promise<void> => {});
  const getByUuid = mock(
    async (_uuid: string): Promise<Module | undefined> => undefined,
  );
  const getAll = mock(async (): Promise<Module[]> => []);
  const repo: ModuleRepo = { save, getByUuid, getAll };

  const getUserByUuid = mock(
    async (_uuid: string): Promise<User | undefined> => undefined,
  );
  const userExists = mock(async (_uuid: string): Promise<boolean> => false);
  const userFacade = {
    getUserByUuid,
    userExists,
    addRoleToUser: mock(),
    getUserByTelegramId: mock(async () => undefined),
    removeRoleFromUser: mock(),
    registerGuest: mock(async () => ({
      uuid: '',
      name: '',
      telegramId: 0,
      roles: [],
      createdAt: '',
    })),
  };

  const uc = new EnrichModuleUc();
  uc.init({
    courseRepo: repo,
    lessonRepo: {} as never,
    stepRepo: {} as never,
    userFacade,
  });

  return { save, getByUuid, getUserByUuid, repo, uc };
}

describe('EnrichModuleUc', () => {
  describe('SUCCESS', () => {
    test('автор обогащает свой курс', async () => {
      const { getByUuid, getUserByUuid, save, uc } = setupUc();
      const author = makeUser({ roles: [Role.MENTOR] });
      const course = makeModule(author.uuid);
      getByUuid.mockResolvedValueOnce(course);
      getUserByUuid.mockResolvedValueOnce(author);

      const result = await uc.handle(
        { moduleId: course.uuid, targetAudience: 'Новички', goal: 'Научиться' },
        author.uuid,
      );

      const res = result as Module;
      expect(res.targetAudience).toBe('Новички');
      expect(res.goal).toBe('Научиться');
      expect(save).toHaveBeenCalledTimes(1);
    });

    test('ADMIN обогащает чужой курс', async () => {
      const { getByUuid, getUserByUuid, uc } = setupUc();
      const author = makeUser({ roles: [Role.MENTOR] });
      const admin = makeUser({ roles: [Role.ADMIN] });
      const course = makeModule(author.uuid);
      getByUuid.mockResolvedValueOnce(course);
      getUserByUuid.mockResolvedValueOnce(admin);

      const result = await uc.handle(
        { moduleId: course.uuid, tags: ['js'] },
        admin.uuid,
      );

      expect((result as Module).tags).toEqual(['js']);
    });
  });

  describe('FAIL', () => {
    test('отклоняет не-автора без прав ADMIN', async () => {
      const { getByUuid, getUserByUuid, uc } = setupUc();
      const author = makeUser({ roles: [Role.MENTOR] });
      const other = makeUser({ roles: [Role.STUDENT] });
      const course = makeModule(author.uuid);
      getByUuid.mockResolvedValueOnce(course);
      getUserByUuid.mockResolvedValueOnce(other);

      await expect(
        uc.handle({ moduleId: course.uuid, targetAudience: 'X' }, other.uuid),
      ).rejects.toThrow('Недостаточно прав для редактирования модуля');
    });

    test('отклоняет несуществующий курс', async () => {
      const { getByUuid, getUserByUuid, uc } = setupUc();
      const admin = makeUser();
      const missingId = crypto.randomUUID();
      getByUuid.mockResolvedValueOnce(undefined);
      getUserByUuid.mockResolvedValueOnce(admin);

      await expect(
        uc.handle({ moduleId: missingId, targetAudience: 'X' }, admin.uuid),
      ).rejects.toThrow('Модуль не найден');
    });

    test('отклоняет несуществующего пользователя', async () => {
      const { getByUuid, getUserByUuid, uc } = setupUc();
      const course = makeModule('author-id');
      getByUuid.mockResolvedValueOnce(course);
      getUserByUuid.mockResolvedValueOnce(undefined);

      await expect(
        uc.handle(
          { moduleId: course.uuid, targetAudience: 'X' },
          'nonexistent',
        ),
      ).rejects.toThrow('Пользователь не найден');
    });
  });
});
