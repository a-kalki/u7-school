import { describe, expect, mock, test } from 'bun:test';
import type { Course } from '#domain/course/entity';
import type { CourseRepo } from '#domain/course/repo';
import { Status } from '#domain/status';
import { ListCoursesUc } from './list-modules-uc';

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    uuid: crypto.randomUUID(),
    title: 'Курс',
    description: 'Описание',
    authorId: crypto.randomUUID(),
    targetAudience: undefined,
    goal: undefined,
    result: undefined,
    rules: undefined,
    additional: undefined,
    tags: [],
    status: Status.PUBLISHED,
    createdAt: '2026-05-01T12:00',
    projects: [],
    ...overrides,
  } as Course;
}

function setupUc() {
  const getAll = mock(async (): Promise<Course[]> => []);
  const repo: CourseRepo = {
    save: mock(async () => {}),
    getByUuid: mock(async () => undefined),
    getAll,
  };
  const uc = new ListCoursesUc();
  uc.init({
    courseRepo: repo,
    lessonRepo: {} as never,
    stepRepo: {} as never,
    userFacade: {} as never,
  });
  return { getAll, uc };
}

describe('ListCoursesUc', () => {
  describe('SUCCESS', () => {
    test('возвращает список PUBLISHED курсов', async () => {
      const { getAll, uc } = setupUc();
      getAll.mockResolvedValueOnce([makeCourse(), makeCourse()]);
      const result = await uc.handle({});
      expect(result).toHaveLength(2);
    });

    test('фильтрует DRAFT курсы без актора', async () => {
      const { getAll, uc } = setupUc();
      getAll.mockResolvedValueOnce([
        makeCourse({ status: Status.PUBLISHED }),
        makeCourse({ status: Status.DRAFT }),
      ]);
      const result = await uc.handle({});
      expect(result).toHaveLength(1);
      expect(result[0]?.status).toBe(Status.PUBLISHED);
    });

    test('возвращает пустой список', async () => {
      const { getAll, uc } = setupUc();
      getAll.mockResolvedValueOnce([]);
      const result = await uc.handle({});
      expect(result).toEqual([]);
    });
  });
});
