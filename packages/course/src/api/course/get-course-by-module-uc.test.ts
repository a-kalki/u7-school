import { describe, expect, mock, test } from 'bun:test';
import type { Course } from '#domain/course/entity';
import type { CourseApiModuleResolver } from '#domain/module';
import { Status } from '#domain/status';
import { GetCourseByModuleUc } from './get-course-by-module-uc';

const m1 = '11111111-1111-4111-8111-111111111111';
const m2 = '22222222-2222-4222-8222-222222222222';
const c1 = '44444444-4444-4444-8444-444444444444';
const c2 = '55555555-5555-4555-8555-555555555555';

function makeCourse(
  uuid: string,
  moduleIds: string[],
  status: Course['status'] = Status.PUBLISHED,
): Course {
  return {
    uuid,
    title: `Course ${uuid}`,
    description: 'd',
    authorId: '99999999-9999-4999-8999-999999999999',
    status,
    phases: [{ title: 'P1', moduleIds }],
    createdAt: '2026-01-01T00:00',
  } as Course;
}

function setupUc(courses: Course[]) {
  const courseRepo = {
    getAll: mock(async () => courses),
  };

  const uc = new GetCourseByModuleUc();
  uc.init({ courseRepo } as unknown as CourseApiModuleResolver);

  return { uc };
}

describe('GetCourseByModuleUc', () => {
  test('возвращает курс, содержащий модуль', async () => {
    const { uc } = setupUc([makeCourse(c1, [m1]), makeCourse(c2, [m2])]);

    expect((await uc.handle({ moduleId: m2 }))?.uuid).toBe(c2);
  });

  test('курс в любом статусе (архивный тоже находится)', async () => {
    const { uc } = setupUc([makeCourse(c1, [m1], Status.ARCHIVED)]);

    expect((await uc.handle({ moduleId: m1 }))?.uuid).toBe(c1);
  });

  test('модуль вне курсов → undefined', async () => {
    const { uc } = setupUc([makeCourse(c1, [m1])]);

    expect(await uc.handle({ moduleId: m2 })).toBeUndefined();
  });
});
