import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import type { Module } from '#domain/module/entity';
import { Status } from '#domain/status';
import { GetModuleUc } from './get-module-uc';

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

function makeModule(overrides: Partial<Module> = {}): Module {
  return {
    uuid: crypto.randomUUID(),
    title: 'Курс',
    description: 'Описание',
    authorId: crypto.randomUUID(),
    status: Status.PUBLISHED,
    createdAt: '2026-05-01T12:00',
    projects: [],
    ...overrides,
  } as Module;
}

function setupUc() {
  const getByUuid = mock(
    async (_uuid: string): Promise<Module | undefined> => undefined,
  );
  const getUserByUuid = mock(
    async (_userId: string, _actorId?: string): Promise<User | undefined> =>
      undefined,
  );
  const uc = new GetModuleUc();
  uc.init({
    courseRepo: { getByUuid, getAll: mock(async () => []) } as never,
    lessonRepo: {} as never,
    stepRepo: {} as never,
    userFacade: { getUserByUuid } as never,
  });
  return { getByUuid, getUserByUuid, uc };
}

describe('GetModuleUc', () => {
  describe('SUCCESS', () => {
    test('возвращает PUBLISHED курс без актора', async () => {
      const { getByUuid, uc } = setupUc();
      const course = makeModule();
      getByUuid.mockResolvedValueOnce(course);
      const result = await uc.handle({ uuid: course.uuid });
      expect((result as Module).title).toBe('Курс');
    });

    test('автор видит свой DRAFT курс с actorId', async () => {
      const { getByUuid, getUserByUuid, uc } = setupUc();
      const author = makeUser({ roles: [Role.MENTOR] });
      const course = makeModule({
        authorId: author.uuid,
        status: Status.DRAFT,
      });
      getByUuid.mockResolvedValueOnce(course);
      getUserByUuid.mockResolvedValueOnce(author);
      const result = await uc.handle({ uuid: course.uuid }, author.uuid);
      expect((result as Module).title).toBe('Курс');
    });

    test('ADMIN видит чужой DRAFT курс', async () => {
      const { getByUuid, getUserByUuid, uc } = setupUc();
      const admin = makeUser({ roles: [Role.ADMIN] });
      const course = makeModule({
        authorId: crypto.randomUUID(),
        status: Status.DRAFT,
      });
      getByUuid.mockResolvedValueOnce(course);
      getUserByUuid.mockResolvedValueOnce(admin);
      const result = await uc.handle({ uuid: course.uuid }, admin.uuid);
      expect((result as Module).title).toBe('Курс');
    });

    test('студент видит PUBLISHED курс с актором', async () => {
      const { getByUuid, getUserByUuid, uc } = setupUc();
      const student = makeUser({ roles: [Role.STUDENT] });
      const course = makeModule({ status: Status.PUBLISHED });
      getByUuid.mockResolvedValueOnce(course);
      getUserByUuid.mockResolvedValueOnce(student);
      const result = await uc.handle({ uuid: course.uuid }, student.uuid);
      expect((result as Module).title).toBe('Курс');
    });
  });

  describe('FAIL', () => {
    test('выбрасывает ошибку если курс не найден', async () => {
      const { getByUuid, uc } = setupUc();
      getByUuid.mockResolvedValueOnce(undefined);
      await expect(uc.handle({ uuid: crypto.randomUUID() })).rejects.toThrow(
        'Модуль не найден',
      );
    });

    test('DRAFT курс недоступен без актора (ACCESS_DENIED)', async () => {
      const { getByUuid, uc } = setupUc();
      getByUuid.mockResolvedValueOnce(makeModule({ status: Status.DRAFT }));
      await expect(uc.handle({ uuid: crypto.randomUUID() })).rejects.toThrow(
        'Нет доступа к модулю',
      );
    });

    test('студент (не автор) не видит DRAFT курс даже с актором (ACCESS_DENIED)', async () => {
      const { getByUuid, getUserByUuid, uc } = setupUc();
      const student = makeUser({ roles: [Role.STUDENT] });
      const course = makeModule({
        authorId: crypto.randomUUID(),
        status: Status.DRAFT,
      });
      getByUuid.mockResolvedValueOnce(course);
      getUserByUuid.mockResolvedValueOnce(student);
      await expect(
        uc.handle({ uuid: course.uuid }, student.uuid),
      ).rejects.toThrow('Нет доступа к модулю');
    });
  });
});
