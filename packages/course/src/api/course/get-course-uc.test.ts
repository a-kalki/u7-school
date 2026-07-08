import { describe, expect, mock, test } from 'bun:test';
import type { Course } from '#domain/course/entity';
import type { CourseApiModuleResolver } from '#domain/module';
import { Status } from '#domain/status';
import { GetCourseUc } from './get-course-uc';

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
  const courseRepo = makeCourseRepo();

  const uc = new GetCourseUc();
  uc.init({
    moduleRepo: {} as never,
    courseRepo,
    courseFacade: {} as never,
    lessonRepo: {} as never,
    stepRepo: {} as never,
    userFacade: {} as never,
  } as unknown as CourseApiModuleResolver);

  return { courseRepo, uc };
}

describe('GetCourseUc', () => {
  describe('SUCCESS', () => {
    test('возвращает курс по uuid', async () => {
      const { courseRepo, uc } = setupUc();
      const course = makeCourse();
      courseRepo.getByUuid.mockResolvedValueOnce(course);

      const result = await uc.handle({ uuid: course.uuid });

      expect((result as Course).uuid).toBe(course.uuid);
      expect((result as Course).title).toBe('Курс JS');
      expect(courseRepo.getByUuid).toHaveBeenCalledTimes(1);
    });

    test('возвращает опубликованный курс без авторизации', async () => {
      const { courseRepo, uc } = setupUc();
      const course = makeCourse({ status: Status.PUBLISHED });
      courseRepo.getByUuid.mockResolvedValueOnce(course);

      const result = await uc.handle({ uuid: course.uuid });

      expect((result as Course).uuid).toBe(course.uuid);
    });
  });

  describe('FAIL', () => {
    test('выбрасывает ошибку если курс не найден', async () => {
      const { courseRepo, uc } = setupUc();
      courseRepo.getByUuid.mockResolvedValueOnce(undefined);

      await expect(uc.handle({ uuid: crypto.randomUUID() })).rejects.toThrow(
        'Курс не найден',
      );
    });
  });
});
