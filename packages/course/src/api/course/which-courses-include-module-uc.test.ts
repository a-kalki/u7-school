import { describe, expect, mock, test } from 'bun:test';
import type { Course } from '#domain/course/entity';
import type { CourseApiModuleResolver } from '#domain/module';
import { Status } from '#domain/status';
import { WhichCoursesIncludeModuleUc } from './which-courses-include-module-uc';

const moduleId = '33333333-3333-4333-8333-333333333333';
const c1 = '44444444-4444-4444-8444-444444444444';
const c2 = '55555555-5555-4555-8555-555555555555';
const cArch = '66666666-6666-4666-8666-666666666666';
const missing = '77777777-7777-4777-8777-777777777777';

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

function setupUc(byUuid: Record<string, Course | undefined>) {
  const courseRepo = {
    getByUuid: mock(async (uuid: string) => byUuid[uuid]),
  };

  const uc = new WhichCoursesIncludeModuleUc();
  uc.init({ courseRepo } as unknown as CourseApiModuleResolver);

  return { uc, courseRepo };
}

describe('WhichCoursesIncludeModuleUc', () => {
  test('возвращает uuid курсов, чья программа содержит модуль', async () => {
    const { uc } = setupUc({
      [c1]: makeCourse(c1, [moduleId]),
      [c2]: makeCourse(c2, ['11111111-1111-4111-8111-111111111111']),
    });

    expect(await uc.handle({ moduleId, courseIds: [c1, c2] })).toEqual([c1]);
  });

  test('архивный курс тоже учитывается (историческая принадлежность)', async () => {
    const { uc } = setupUc({
      [cArch]: makeCourse(cArch, [moduleId], Status.ARCHIVED),
    });

    expect(await uc.handle({ moduleId, courseIds: [cArch] })).toEqual([cArch]);
  });

  test('несуществующий курс — пропускается без ошибки', async () => {
    const { uc } = setupUc({});

    expect(await uc.handle({ moduleId, courseIds: [missing] })).toEqual([]);
  });

  test('пустой список courseIds — пустой результат без обращения к репо', async () => {
    const { uc, courseRepo } = setupUc({
      [c1]: makeCourse(c1, [moduleId]),
    });

    expect(await uc.handle({ moduleId, courseIds: [] })).toEqual([]);
    expect(courseRepo.getByUuid).not.toHaveBeenCalled();
  });

  test('порядок результата — порядок courseIds', async () => {
    const { uc } = setupUc({
      [c1]: makeCourse(c1, [moduleId]),
      [c2]: makeCourse(c2, [moduleId]),
    });

    expect(await uc.handle({ moduleId, courseIds: [c2, c1] })).toEqual([
      c2,
      c1,
    ]);
  });
});
