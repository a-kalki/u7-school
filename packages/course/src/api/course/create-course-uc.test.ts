import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import type { Course } from '#domain/course/entity';
import type { CourseRepo } from '#domain/index';
import type { CourseApiModuleResolver } from '#domain/module';
import { CreateCourseUc } from './create-course-uc';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    uuid: crypto.randomUUID(),
    name: 'Тест',
    telegramId: 1,
    roles: [Role.ADMIN],
    createdAt: '2026-05-01T12:00',
    ...overrides,
  } as User;
}

function makeCourseRepo() {
  const save = mock(async (_course: Course): Promise<void> => {});
  const getByUuid = mock(
    async (_uuid: string): Promise<Course | undefined> => undefined,
  );
  const getAll = mock(async (): Promise<Course[]> => []);

  return { save, getByUuid, getAll } as CourseRepo;
}

function setupUc() {
  const courseRepo = makeCourseRepo();
  const getUserByUuid = mock(
    async (_uuid: string): Promise<User | undefined> => undefined,
  );

  const uc = new CreateCourseUc();
  uc.init({
    moduleRepo: {} as never,
    courseRepo,
    courseFacade: {} as never,
    lessonRepo: {} as never,
    stepRepo: {} as never,
    userFacade: { getUserByUuid } as never,
  } as unknown as CourseApiModuleResolver);

  return { courseRepo, getUserByUuid, uc };
}

describe('CreateCourseUc', () => {
  describe('SUCCESS', () => {
    test('AUTHOR создаёт курс', async () => {
      const { getUserByUuid, courseRepo, uc } = setupUc();
      const author = makeUser({ roles: [Role.AUTHOR] });
      getUserByUuid.mockResolvedValueOnce(author);

      const result = await uc.handle(
        { title: 'Курс JS', description: 'Описание' },
        author.uuid,
      );

      expect((result as Course).title).toBe('Курс JS');
      expect((result as Course).authorId).toBe(author.uuid);
      expect(courseRepo.save).toHaveBeenCalledTimes(1);
    });

    test('AUTHOR + MENTOR создаёт курс', async () => {
      const { getUserByUuid, courseRepo, uc } = setupUc();
      const author = makeUser({ roles: [Role.AUTHOR, Role.MENTOR] });
      getUserByUuid.mockResolvedValueOnce(author);

      const result = await uc.handle(
        { title: 'Курс Python', description: 'Описание' },
        author.uuid,
      );

      expect((result as Course).title).toBe('Курс Python');
      expect(courseRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('FAIL', () => {
    test('ADMIN не может создавать курс', async () => {
      const { getUserByUuid, uc } = setupUc();
      const admin = makeUser();
      getUserByUuid.mockResolvedValueOnce(admin);

      await expect(
        uc.handle({ title: 'Курс', description: 'Описание' }, admin.uuid),
      ).rejects.toThrow('Недостаточно прав для создания курса');
    });

    test('MENTOR без AUTHOR не может создавать', async () => {
      const { getUserByUuid, uc } = setupUc();
      const mentor = makeUser({ roles: [Role.MENTOR] });
      getUserByUuid.mockResolvedValueOnce(mentor);

      await expect(
        uc.handle({ title: 'Курс', description: 'Описание' }, mentor.uuid),
      ).rejects.toThrow('Недостаточно прав для создания курса');
    });

    test('STUDENT не может создавать', async () => {
      const { getUserByUuid, uc } = setupUc();
      const student = makeUser({ roles: [Role.STUDENT] });
      getUserByUuid.mockResolvedValueOnce(student);

      await expect(
        uc.handle({ title: 'Курс', description: 'Описание' }, student.uuid),
      ).rejects.toThrow('Недостаточно прав для создания курса');
    });

    test('отклоняет невалидную команду', async () => {
      const { getUserByUuid, uc } = setupUc();
      const author = makeUser({ roles: [Role.AUTHOR] });
      getUserByUuid.mockResolvedValueOnce(author);

      await expect(
        uc.handle({ title: '', description: 'Описание' }, author.uuid),
      ).rejects.toThrow('Переданы некорректные данные');
    });
  });
});
