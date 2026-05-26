import { describe, expect, test } from 'bun:test';
import { CourseDs } from './course-ds';
import type { Lesson } from './lesson/entity';
import type { Module } from './module/entity';
import { Status } from './status';

function makeModule(overrides: Partial<Module> = {}): Module {
  return {
    uuid: crypto.randomUUID(),
    title: 'Модуль',
    description: 'Описание',
    authorId: crypto.randomUUID(),
    status: Status.PUBLISHED,
    createdAt: '2026-05-01T12:00',
    projects: [],
    ...overrides,
  } as Module;
}

function makeLesson(
  lessonId: string,
  title: string,
  stepIds: string[] = [],
): Lesson {
  return {
    uuid: lessonId,
    moduleId: crypto.randomUUID(),
    title,
    status: Status.PUBLISHED,
    createdAt: '2026-05-01T12:00',
    stepIds,
    mentorStepIds: [],
  } as Lesson;
}

const ds = new CourseDs();

describe('CourseDs.buildSnapshot', () => {
  test('собирает проекты с lessonIds и stepIds', () => {
    const lessonId1 = crypto.randomUUID();
    const lessonId2 = crypto.randomUUID();
    const stepId1 = crypto.randomUUID();
    const stepId2 = crypto.randomUUID();

    const module = makeModule({
      projects: [
        {
          uuid: crypto.randomUUID(),
          title: 'Проект 1',
          status: Status.PUBLISHED,
          lessonIds: [lessonId1],
        },
        {
          uuid: crypto.randomUUID(),
          title: 'Проект 2',
          status: Status.PUBLISHED,
          lessonIds: [lessonId2],
        },
      ],
    });

    const lessons: Lesson[] = [
      makeLesson(lessonId1, 'Урок 1', [stepId1]),
      makeLesson(lessonId2, 'Урок 2', [stepId2]),
    ];

    const snapshot = ds.buildSnapshot(module, lessons);

    expect(snapshot).toHaveLength(2);
    expect(snapshot[0]?.projectTitle).toBe('Проект 1');
    expect(snapshot[0]?.lessons).toHaveLength(1);
    expect(snapshot[0]?.lessons[0]?.lessonTitle).toBe('Урок 1');
    expect(snapshot[0]?.lessons[0]?.stepIds).toEqual([stepId1]);

    expect(snapshot[1]?.projectTitle).toBe('Проект 2');
    expect(snapshot[1]?.lessons[0]?.lessonTitle).toBe('Урок 2');
    expect(snapshot[1]?.lessons[0]?.stepIds).toEqual([stepId2]);
  });

  test('при пустом projects возвращает []', () => {
    const module = makeModule({ projects: [] });
    const snapshot = ds.buildSnapshot(module, []);
    expect(snapshot).toEqual([]);
  });

  test('порядок проектов сохраняется', () => {
    const module = makeModule({
      projects: [
        {
          uuid: crypto.randomUUID(),
          title: 'Первый',
          status: Status.PUBLISHED,
          lessonIds: [],
        },
        {
          uuid: crypto.randomUUID(),
          title: 'Второй',
          status: Status.PUBLISHED,
          lessonIds: [],
        },
        {
          uuid: crypto.randomUUID(),
          title: 'Третий',
          status: Status.PUBLISHED,
          lessonIds: [],
        },
      ],
    });

    const snapshot = ds.buildSnapshot(module, []);
    expect(snapshot.map((p) => p.projectTitle)).toEqual([
      'Первый',
      'Второй',
      'Третий',
    ]);
  });

  test('проект без уроков — пустой массив lessons', () => {
    const module = makeModule({
      projects: [
        {
          uuid: crypto.randomUUID(),
          title: 'Проект без уроков',
          status: Status.PUBLISHED,
          lessonIds: [],
        },
      ],
    });

    const snapshot = ds.buildSnapshot(module, []);
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]?.lessons).toEqual([]);
  });

  test('урок без шагов — пустой массив stepIds', () => {
    const lessonId = crypto.randomUUID();
    const module = makeModule({
      projects: [
        {
          uuid: crypto.randomUUID(),
          title: 'Проект',
          status: Status.PUBLISHED,
          lessonIds: [lessonId],
        },
      ],
    });

    const lessons = [makeLesson(lessonId, 'Урок без шагов', [])];
    const snapshot = ds.buildSnapshot(module, lessons);

    expect(snapshot[0]?.lessons[0]?.stepIds).toEqual([]);
  });

  test('несколько уроков в одном проекте', () => {
    const lessonId1 = crypto.randomUUID();
    const lessonId2 = crypto.randomUUID();

    const module = makeModule({
      projects: [
        {
          uuid: crypto.randomUUID(),
          title: 'Проект',
          status: Status.PUBLISHED,
          lessonIds: [lessonId1, lessonId2],
        },
      ],
    });

    const lessons = [
      makeLesson(lessonId1, 'Урок 1', []),
      makeLesson(lessonId2, 'Урок 2', []),
    ];

    const snapshot = ds.buildSnapshot(module, lessons);
    expect(snapshot[0]?.lessons).toHaveLength(2);
  });

  test('DRAFT проекты и уроки не попадают в снимок', () => {
    const pubLessonId = crypto.randomUUID();
    const draftLessonId = crypto.randomUUID();

    const module = makeModule({
      projects: [
        {
          uuid: crypto.randomUUID(),
          title: 'Опубликованный проект',
          status: Status.PUBLISHED,
          lessonIds: [pubLessonId, draftLessonId],
        },
        {
          uuid: crypto.randomUUID(),
          title: 'DRAFT проект',
          status: Status.DRAFT,
          lessonIds: [pubLessonId],
        },
      ],
    });

    const lessons = [
      makeLesson(pubLessonId, 'Опубликованный урок', []),
      {
        ...makeLesson(draftLessonId, 'DRAFT урок', []),
        status: Status.DRAFT,
      } as Lesson,
    ];

    const snapshot = ds.buildSnapshot(module, lessons);

    // Только один PUBLISHED проект
    expect(snapshot).toHaveLength(1);
    expect(snapshot[0]?.projectTitle).toBe('Опубликованный проект');
    // Только один PUBLISHED урок
    expect(snapshot[0]?.lessons).toHaveLength(1);
    expect(snapshot[0]?.lessons[0]?.lessonTitle).toBe('Опубликованный урок');
  });
});
