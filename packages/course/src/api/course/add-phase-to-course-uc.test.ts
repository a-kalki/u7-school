import { describe, expect, mock, test } from 'bun:test';
import type { User } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import type { Course } from '#domain/course/entity';
import type { CourseApiModuleResolver } from '#domain/module';
import { Status } from '#domain/status';
import { AddPhaseToCourseUc } from './add-phase-to-course-uc';

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
    phases: [],
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

  const uc = new AddPhaseToCourseUc();
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

describe('AddPhaseToCourseUc', () => {
  describe('SUCCESS', () => {
    test('ADMIN добавляет фазу в курс', async () => {
      const { courseRepository, getUserByUuid, uc } = setupUc();
      const admin = makeUser();
      const course = makeCourse({ authorId: crypto.randomUUID() });
      getUserByUuid.mockResolvedValueOnce(admin);
      courseRepository.getByUuid.mockResolvedValueOnce(course);

      const result = await uc.handle(
        { courseId: course.uuid, title: 'Этап 1', track: 'tech' },
        admin.uuid,
      );

      expect((result as Course).phases).toHaveLength(1);
      expect((result as Course).phases[0]!.title).toBe('Этап 1');
      expect(courseRepository.save).toHaveBeenCalledTimes(1);
    });

    test('автор добавляет фазу в свой курс', async () => {
      const { courseRepository, getUserByUuid, uc } = setupUc();
      const author = makeUser({ roles: [Role.AUTHOR] });
      const course = makeCourse({ authorId: author.uuid });
      getUserByUuid.mockResolvedValueOnce(author);
      courseRepository.getByUuid.mockResolvedValueOnce(course);

      const result = await uc.handle(
        { courseId: course.uuid, title: 'Этап 2' },
        author.uuid,
      );

      expect((result as Course).phases).toHaveLength(1);
    });
  });

  describe('FAIL', () => {
    test('MENTOR не может добавить фазу', async () => {
      const { courseRepository, getUserByUuid, uc } = setupUc();
      const mentor = makeUser({ roles: [Role.MENTOR] });
      const course = makeCourse();
      getUserByUuid.mockResolvedValueOnce(mentor);
      courseRepository.getByUuid.mockResolvedValueOnce(course);

      await expect(
        uc.handle({ courseId: course.uuid, title: 'Этап 1' }, mentor.uuid),
      ).rejects.toThrow('Недостаточно прав для редактирования курса');
    });

    test('выбрасывает ошибку если курс не найден', async () => {
      const { courseRepository, getUserByUuid, uc } = setupUc();
      const admin = makeUser();
      getUserByUuid.mockResolvedValueOnce(admin);
      courseRepository.getByUuid.mockResolvedValueOnce(undefined);

      await expect(
        uc.handle(
          { courseId: crypto.randomUUID(), title: 'Этап 1' },
          admin.uuid,
        ),
      ).rejects.toThrow('Курс не найден');
    });
  });
});
