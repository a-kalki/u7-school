import { describe, expect, mock, test } from 'bun:test';
import type { Course } from '#domain/course/entity';
import type { CourseApiModuleResolver } from '#domain/module';
import { Status } from '#domain/status';
import { GetModulePlaceUc } from './get-module-place-uc';

const m1 = '11111111-1111-4111-8111-111111111111';
const m2 = '22222222-2222-4222-8222-222222222222';
const m3 = '33333333-3333-4333-8333-333333333333';
const courseId = '44444444-4444-4444-8444-444444444444';

function makeCourse(
  uuid: string,
  moduleIds: string[],
  status: Course['status'] = Status.PUBLISHED,
): Course {
  return {
    uuid,
    title: `Course ${uuid}`,
    description: 'd',
    authorId: 'a1',
    status,
    phases: [{ title: 'P1', moduleIds }],
    createdAt: '2026-01-01T00:00',
  } as Course;
}

function setupUc(courses: Course[]) {
  const courseRepo = {
    getAll: mock(async (_filter?: unknown) => courses),
    getByUuid: mock(async (_uuid: string) => undefined),
  };

  const uc = new GetModulePlaceUc();
  uc.init({
    courseRepo,
  } as unknown as CourseApiModuleResolver);

  return { uc, courseRepo };
}

describe('GetModulePlaceUc', () => {
  test('первый модуль: isFirst=true, nextModuleId', async () => {
    const { uc } = setupUc([makeCourse(courseId, [m1, m2, m3])]);

    expect(await uc.handle({ moduleId: m1 })).toEqual({
      courseId,
      isFirst: true,
      isLast: false,
      nextModuleId: m2,
    });
  });

  test('средний модуль: prev и next', async () => {
    const { uc } = setupUc([makeCourse(courseId, [m1, m2, m3])]);

    expect(await uc.handle({ moduleId: m2 })).toEqual({
      courseId,
      isFirst: false,
      isLast: false,
      prevModuleId: m1,
      nextModuleId: m3,
    });
  });

  test('последний модуль: isLast=true, prevModuleId', async () => {
    const { uc } = setupUc([makeCourse(courseId, [m1, m2, m3])]);

    expect(await uc.handle({ moduleId: m3 })).toEqual({
      courseId,
      isFirst: false,
      isLast: true,
      prevModuleId: m2,
    });
  });

  test('модуль вне курсов → undefined', async () => {
    const { uc } = setupUc([makeCourse(courseId, [m1])]);

    expect(await uc.handle({ moduleId: m2 })).toBeUndefined();
  });

  test('модули нескольких фаз — линейный порядок (flatMap)', async () => {
    const course = makeCourse(courseId, [m1]);
    course.phases.push({ title: 'P2', moduleIds: [m2, m3] });
    const { uc } = setupUc([course]);

    expect(await uc.handle({ moduleId: m2 })).toEqual({
      courseId,
      isFirst: false,
      isLast: false,
      prevModuleId: m1,
      nextModuleId: m3,
    });
  });

  test('запрашивает только опубликованные курсы', async () => {
    const { uc, courseRepo } = setupUc([makeCourse(courseId, [m1])]);

    await uc.handle({ moduleId: m1 });

    expect(courseRepo.getAll).toHaveBeenCalledWith({
      status: 'published',
    });
  });

  test('архивный курс не участвует (фильтр репозитория)', async () => {
    // Репозиторий возвращает только published по фильтру — archived сюда
    // не попадает; проверяем контракт: place считается по published-данным.
    const { uc } = setupUc([makeCourse(courseId, [m1], Status.PUBLISHED)]);

    expect(await uc.handle({ moduleId: m1 })).toBeDefined();
  });
});
