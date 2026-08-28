import { describe, expect, mock, test } from 'bun:test';
import type { Course } from '#domain/course/entity';
import type { Lesson } from '#domain/lesson/entity';
import type { CourseApiModuleResolver } from '#domain/module';
import type { Module } from '#domain/module/entity';
import { Status } from '#domain/status';
import { GetCourseProgramUc } from './get-course-program-uc';

const courseId = '44444444-4444-4444-8444-444444444444';
const moduleId = '11111111-1111-4111-8111-111111111111';
const lessonId = '22222222-2222-4222-8222-222222222222';
const projectId = '33333333-3333-4333-8333-333333333333';
const authorId = '99999999-9999-4999-8999-999999999999';

const course: Course = {
  uuid: courseId,
  title: 'Course',
  description: 'Описание курса',
  authorId,
  status: Status.PUBLISHED,
  phases: [{ title: 'P1', track: 'JS', moduleIds: [moduleId] }],
  createdAt: '2026-01-01T00:00',
} as Course;

const module: Module = {
  uuid: moduleId,
  title: 'Module',
  description: 'Описание модуля',
  authorId,
  status: Status.PUBLISHED,
  projects: [
    {
      uuid: projectId,
      title: 'Проект',
      status: Status.PUBLISHED,
      lessonIds: [lessonId],
    },
  ],
  createdAt: '2026-01-01T00:00',
} as unknown as Module;

const lesson: Lesson = {
  uuid: lessonId,
  moduleId,
  title: 'Урок',
  status: Status.PUBLISHED,
  createdAt: '2026-01-01T00:00',
  stepIds: [],
  mentorStepIds: [],
} as unknown as Lesson;

function setupUc(byUuid: Record<string, unknown>) {
  const resolve = {
    courseRepo: { getByUuid: mock(async (id: string) => byUuid[id]) },
    moduleRepo: { getByUuid: mock(async (id: string) => byUuid[id]) },
    lessonRepo: { getByUuid: mock(async (id: string) => byUuid[id]) },
  };

  const uc = new GetCourseProgramUc();
  uc.init(resolve as unknown as CourseApiModuleResolver);

  return { uc };
}

describe('GetCourseProgramUc', () => {
  test('успех: курс + фазы со снимками модулей', async () => {
    const { uc } = setupUc({
      [courseId]: course,
      [moduleId]: module,
      [lessonId]: lesson,
    });

    const program = await uc.handle({ courseId });

    expect(program.course.uuid).toBe(courseId);
    expect(program.phases).toEqual([
      {
        title: 'P1',
        track: 'JS',
        modules: [
          [
            {
              projectId,
              projectTitle: 'Проект',
              lessons: [{ lessonId, lessonTitle: 'Урок', stepIds: [] }],
            },
          ],
        ],
      },
    ]);
  });

  test('несуществующий курс → COURSE_NOT_FOUND', async () => {
    const { uc } = setupUc({});

    await expect(uc.handle({ courseId })).rejects.toThrow('Курс не найден');
  });
});
