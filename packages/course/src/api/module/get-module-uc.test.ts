import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import type { Course } from '#domain/module/entity';
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

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    uuid: crypto.randomUUID(),
    title: 'Курс',
    description: 'Описание',
    authorId: crypto.randomUUID(),
    status: Status.PUBLISHED,
    createdAt: '2026-05-01T12:00',
    projects: [],
    ...overrides,
  } as Course;
}

function setupUc() {
  const getByUuid = mock(
    async (_uuid: string): Promise<Course | undefined> => undefined,
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
      const course = makeCourse();
      getByUuid.mockResolvedValueOnce(course);
      const result = await uc.handle({ uuid: course.uuid });
      expect((result as Course).title).toBe('Курс');
    });

    test('автор видит свой DRAFT курс с actorId', async () => {
      const { getByUuid, getUserByUuid, uc } = setupUc();
      const author = makeUser({ roles: [Role.MENTOR] });
      const course = makeCourse({
        authorId: author.uuid,
        status: Status.DRAFT,
      });
      getByUuid.mockResolvedValueOnce(course);
      getUserByUuid.mockResolvedValueOnce(author);
      const result = await uc.handle({ uuid: course.uuid }, author.uuid);
      expect((result as Course).title).toBe('Курс');
    });

    test('ADMIN видит чужой DRAFT курс', async () => {
      const { getByUuid, getUserByUuid, uc } = setupUc();
      const admin = makeUser({ roles: [Role.ADMIN] });
      const course = makeCourse({
        authorId: crypto.randomUUID(),
        status: Status.DRAFT,
      });
      getByUuid.mockResolvedValueOnce(course);
      getUserByUuid.mockResolvedValueOnce(admin);
      const result = await uc.handle({ uuid: course.uuid }, admin.uuid);
      expect((result as Course).title).toBe('Курс');
    });

    test('студент видит PUBLISHED курс с актором', async () => {
      const { getByUuid, getUserByUuid, uc } = setupUc();
      const student = makeUser({ roles: [Role.STUDENT] });
      const course = makeCourse({ status: Status.PUBLISHED });
      getByUuid.mockResolvedValueOnce(course);
      getUserByUuid.mockResolvedValueOnce(student);
      const result = await uc.handle({ uuid: course.uuid }, student.uuid);
      expect((result as Course).title).toBe('Курс');
    });
  });

  describe('FAIL', () => {
    test('выбрасывает ошибку если курс не найден', async () => {
      const { getByUuid, uc } = setupUc();
      getByUuid.mockResolvedValueOnce(undefined);
      await expect(uc.handle({ uuid: crypto.randomUUID() })).rejects.toThrow(
        'Курс не найден',
      );
    });

    test('DRAFT курс недоступен без актора (ACCESS_DENIED)', async () => {
      const { getByUuid, uc } = setupUc();
      getByUuid.mockResolvedValueOnce(makeCourse({ status: Status.DRAFT }));
      await expect(uc.handle({ uuid: crypto.randomUUID() })).rejects.toThrow(
        'Нет доступа к курсу',
      );
    });

    test('студент (не автор) не видит DRAFT курс даже с актором (ACCESS_DENIED)', async () => {
      const { getByUuid, getUserByUuid, uc } = setupUc();
      const student = makeUser({ roles: [Role.STUDENT] });
      const course = makeCourse({
        authorId: crypto.randomUUID(),
        status: Status.DRAFT,
      });
      getByUuid.mockResolvedValueOnce(course);
      getUserByUuid.mockResolvedValueOnce(student);
      await expect(
        uc.handle({ uuid: course.uuid }, student.uuid),
      ).rejects.toThrow('Нет доступа к курсу');
    });
  });
});
