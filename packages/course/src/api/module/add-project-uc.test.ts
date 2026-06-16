import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import type { CourseApiModuleResolver } from '#domain/module';
import type { Module } from '#domain/module/entity';
import type { ModuleRepo } from '#domain/module/repo';
import { Status } from '#domain/status';
import { AddProjectUc } from './add-project-uc';

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

function makeModule(authorId: string): Module {
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
    updateUserRole: mock(),
    registerGuest: mock(async () => ({
      uuid: '',
      name: '',
      telegramId: 0,
      roles: [],
      createdAt: '',
    })),
  };
  const uc = new AddProjectUc();
  uc.init({
    courseRepo: repo,
    lessonRepo: {} as never,
    stepRepo: {} as never,
    userFacade,
  } as unknown as CourseApiModuleResolver);
  return { save, getByUuid, getUserByUuid, repo, uc };
}

describe('AddProjectUc', () => {
  describe('SUCCESS', () => {
    test('автор добавляет проект в свой курс', async () => {
      const { getByUuid, getUserByUuid, save, uc } = setupUc();
      const author = makeUser({ roles: [Role.MENTOR] });
      const course = makeModule(author.uuid);
      getByUuid.mockResolvedValueOnce(course);
      getUserByUuid.mockResolvedValueOnce(author);

      const result = await uc.handle(
        { moduleId: course.uuid, title: 'Проект 1' },
        author.uuid,
      );

      const res = result as Module & { projects: { title: string }[] };
      expect(res.projects).toHaveLength(1);
      expect(res.projects[0]?.title).toBe('Проект 1');
      expect(save).toHaveBeenCalledTimes(1);
    });
  });

  describe('FAIL', () => {
    test('отклоняет чужого редактора', async () => {
      const { getByUuid, getUserByUuid, uc } = setupUc();
      const course = makeModule('author-id');
      const other = makeUser({ roles: [Role.STUDENT] });
      getByUuid.mockResolvedValueOnce(course);
      getUserByUuid.mockResolvedValueOnce(other);

      await expect(
        uc.handle({ moduleId: course.uuid, title: 'П' }, other.uuid),
      ).rejects.toThrow('Недостаточно прав');
    });
  });
});
