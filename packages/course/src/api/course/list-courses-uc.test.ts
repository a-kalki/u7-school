import { describe, expect, mock, test } from 'bun:test';
import type { Course } from '#domain/course/entity';
import type { CourseApiModuleResolver } from '#domain/module';
import { Status } from '#domain/status';
import { ListCoursesUc } from './list-courses-uc';

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

  const uc = new ListCoursesUc();
  uc.init({
    courseRepo: {} as never,
    courseRepository,
    courseFacade: {} as never,
    lessonRepo: {} as never,
    stepRepo: {} as never,
    userFacade: {} as never,
  } as unknown as CourseApiModuleResolver);

  return { courseRepository, uc };
}

describe('ListCoursesUc', () => {
  describe('SUCCESS', () => {
    test('возвращает список курсов', async () => {
      const { courseRepository, uc } = setupUc();
      const courses = [
        makeCourse({ title: 'Курс 1', status: Status.PUBLISHED }),
        makeCourse({ title: 'Курс 2', status: Status.PUBLISHED }),
      ];
      courseRepository.getAll.mockResolvedValueOnce(courses);

      const result = await uc.handle({});

      expect(result).toHaveLength(2);
      expect(courseRepository.getAll).toHaveBeenCalledTimes(1);
    });

    test('фильтрует по статусу published', async () => {
      const { courseRepository, uc } = setupUc();
      courseRepository.getAll.mockResolvedValueOnce([]);

      await uc.handle({ status: Status.PUBLISHED });

      expect(courseRepository.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: Status.PUBLISHED }),
      );
    });

    test('возвращает пустой список если курсов нет', async () => {
      const { courseRepository, uc } = setupUc();
      courseRepository.getAll.mockResolvedValueOnce([]);

      const result = await uc.handle({});

      expect(result).toEqual([]);
    });
  });
});
