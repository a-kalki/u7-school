import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import type { Course } from '#domain/course/entity';
import type { CourseApiModuleResolver } from '#domain/module';
import { Status } from '#domain/status';
import { AddModuleToCourseUc } from './add-module-to-course-uc';

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

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    uuid: crypto.randomUUID(),
    title: 'Курс JS',
    description: 'Описание',
    authorId: crypto.randomUUID(),
    phases: [{ title: 'Этап 1', moduleIds: [] }],
    status: Status.DRAFT,
    createdAt: '2026-07-08T16:00',
    ...overrides,
  };
}

function makeCourseRepo() {
  const save = mock(async (_course: Course): Promise<void> => {});
  const getByUuid = mock(
    async (_uuid: string): Promise<Course | undefined> => undefined,
  );
  const getAll = mock(async (): Promise<Course[]> => []);

  return { save, getByUuid, getAll };
}

function setupUc() {
  const courseRepository = makeCourseRepo();
  const getUserByUuid = mock(
    async (_uuid: string): Promise<User | undefined> => undefined,
  );

  const uc = new AddModuleToCourseUc();
  uc.init({
    courseRepo: {} as never,
    courseRepository,
    courseFacade: {} as never,
    lessonRepo: {} as never,
    stepRepo: {} as never,
    userFacade: { getUserByUuid } as never,
  } as unknown as CourseApiModuleResolver);

  return { courseRepository, getUserByUuid, uc };
}

describe('AddModuleToCourseUc', () => {
  describe('SUCCESS', () => {
    test('ADMIN добавляет модуль в фазу', async () => {
      const { courseRepository, getUserByUuid, uc } = setupUc();
      const admin = makeUser();
      const course = makeCourse({ authorId: crypto.randomUUID() });
      const moduleId = crypto.randomUUID();
      getUserByUuid.mockResolvedValueOnce(admin);
      courseRepository.getByUuid.mockResolvedValueOnce(course);

      const result = await uc.handle(
        {
          courseId: course.uuid,
          phaseTitle: 'Этап 1',
          moduleId,
        },
        admin.uuid,
      );

      expect((result as Course).phases[0]!.moduleIds).toContain(moduleId);
      expect(courseRepository.save).toHaveBeenCalledTimes(1);
    });

    test('автор добавляет модуль в свой курс', async () => {
      const { courseRepository, getUserByUuid, uc } = setupUc();
      const author = makeUser({ roles: [Role.AUTHOR] });
      const course = makeCourse({ authorId: author.uuid });
      const moduleId = crypto.randomUUID();
      getUserByUuid.mockResolvedValueOnce(author);
      courseRepository.getByUuid.mockResolvedValueOnce(course);

      const result = await uc.handle(
        {
          courseId: course.uuid,
          phaseTitle: 'Этап 1',
          moduleId,
        },
        author.uuid,
      );

      expect((result as Course).phases[0]!.moduleIds).toContain(moduleId);
    });
  });

  describe('FAIL', () => {
    test('MENTOR не может добавить модуль', async () => {
      const { courseRepository, getUserByUuid, uc } = setupUc();
      const mentor = makeUser({ roles: [Role.MENTOR] });
      const course = makeCourse();
      getUserByUuid.mockResolvedValueOnce(mentor);
      courseRepository.getByUuid.mockResolvedValueOnce(course);

      await expect(
        uc.handle(
          {
            courseId: course.uuid,
            phaseTitle: 'Этап 1',
            moduleId: crypto.randomUUID(),
          },
          mentor.uuid,
        ),
      ).rejects.toThrow('Недостаточно прав для редактирования курса');
    });

    test('выбрасывает ошибку если курс не найден', async () => {
      const { courseRepository, getUserByUuid, uc } = setupUc();
      const admin = makeUser();
      getUserByUuid.mockResolvedValueOnce(admin);
      courseRepository.getByUuid.mockResolvedValueOnce(undefined);

      await expect(
        uc.handle(
          {
            courseId: crypto.randomUUID(),
            phaseTitle: 'Этап 1',
            moduleId: crypto.randomUUID(),
          },
          admin.uuid,
        ),
      ).rejects.toThrow('Курс не найден');
    });
  });
});
