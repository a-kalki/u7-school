import { describe, expect, test } from 'bun:test';
import type { ContentSnapshot } from './content-snapshot';
import { CourseDs } from './course-ds';
import type { Lesson } from './lesson/entity';
import type { Module } from './module/entity';
import { Status } from './status';

/** Тестовый ContentSnapshot: 2 проекта, 2 урока в первом, 1 во втором */
function makeSnapshot(): ContentSnapshot {
  return [
    {
      projectId: 'pid-1',
      projectTitle: 'Проект 1',
      lessons: [
        {
          lessonId: 'lid-1a',
          lessonTitle: 'Урок 1A',
          stepIds: ['sid-1a-1', 'sid-1a-2', 'sid-1a-3'],
        },
        {
          lessonId: 'lid-1b',
          lessonTitle: 'Урок 1B',
          stepIds: ['sid-1b-1'],
        },
      ],
    },
    {
      projectId: 'pid-2',
      projectTitle: 'Проект 2',
      lessons: [
        {
          lessonId: 'lid-2a',
          lessonTitle: 'Урок 2A',
          stepIds: ['sid-2a-1', 'sid-2a-2'],
        },
      ],
    },
  ];
}

const ds = new CourseDs();

describe('CourseDs', () => {
  describe('findStepPosition', () => {
    test('находит первый шаг первого урока', () => {
      const pos = ds.findStepPosition(makeSnapshot(), 'sid-1a-1');
      expect(pos).not.toBeNull();
      expect(pos!.projectIndex).toBe(1);
      expect(pos!.projectTitle).toBe('Проект 1');
      expect(pos!.lessonIndex).toBe(1);
      expect(pos!.lessonTitle).toBe('Урок 1A');
      expect(pos!.stepIndex).toBe(1);
      expect(pos!.totalSteps).toBe(3);
    });

    test('находит третий шаг первого урока', () => {
      const pos = ds.findStepPosition(makeSnapshot(), 'sid-1a-3');
      expect(pos).not.toBeNull();
      expect(pos!.stepIndex).toBe(3);
    });

    test('находит шаг во втором проекте', () => {
      const pos = ds.findStepPosition(makeSnapshot(), 'sid-2a-2');
      expect(pos).not.toBeNull();
      expect(pos!.projectIndex).toBe(2);
      expect(pos!.projectTitle).toBe('Проект 2');
      expect(pos!.lessonTitle).toBe('Урок 2A');
      expect(pos!.stepIndex).toBe(2);
    });

    test('возвращает null для несуществующего stepId', () => {
      const pos = ds.findStepPosition(makeSnapshot(), 'nonexistent');
      expect(pos).toBeNull();
    });

    test('возвращает null для пустого снапшота', () => {
      const pos = ds.findStepPosition([], 'sid-1a-1');
      expect(pos).toBeNull();
    });
  });

  describe('findLessonTitle', () => {
    test('находит название урока по UUID', () => {
      expect(ds.findLessonTitle(makeSnapshot(), 'lid-1a')).toBe('Урок 1A');
      expect(ds.findLessonTitle(makeSnapshot(), 'lid-2a')).toBe('Урок 2A');
    });

    test('возвращает "урок" для несуществующего UUID', () => {
      expect(ds.findLessonTitle(makeSnapshot(), 'nonexistent')).toBe('урок');
    });
  });

  describe('findProjectTitle', () => {
    test('находит название проекта по UUID', () => {
      expect(ds.findProjectTitle(makeSnapshot(), 'pid-1')).toBe('Проект 1');
      expect(ds.findProjectTitle(makeSnapshot(), 'pid-2')).toBe('Проект 2');
    });

    test('возвращает "проект" для несуществующего UUID', () => {
      expect(ds.findProjectTitle(makeSnapshot(), 'nonexistent')).toBe('проект');
    });
  });

  describe('countTotalSteps', () => {
    test('считает общее число шагов', () => {
      expect(ds.countTotalSteps(makeSnapshot())).toBe(6);
    });

    test('возвращает 0 для пустого снапшота', () => {
      expect(ds.countTotalSteps([])).toBe(0);
    });
  });

  describe('buildSnapshot', () => {
    // Снимок контента собирается только из published-контента: archived-проект
    // (например, выведенный из модуля П12) не попадает в снапшоты новых потоков
    // и не ломает обратную совместимость старых.
    function makeModule(projects: Module['projects']): Module {
      return {
        uuid: 'module-uuid',
        title: 'Модуль',
        description: 'Описание',
        authorId: 'author-uuid',
        status: 'published',
        projects,
        createdAt: '2026-01-01T00:00',
      } as unknown as Module;
    }

    function makeLesson(uuid: string, status: Status): Lesson {
      return {
        uuid,
        moduleId: 'module-uuid',
        title: `Урок ${uuid}`,
        status,
        stepIds: [`${uuid}-s1`],
        mentorStepIds: [],
        createdAt: '2026-01-01T00:00',
      } as unknown as Lesson;
    }

    test('исключает archived-проект', () => {
      const module = makeModule([
        {
          uuid: 'p1',
          title: 'П1',
          status: Status.PUBLISHED,
          lessonIds: ['l1'],
        },
        {
          uuid: 'p2',
          title: 'П2',
          status: Status.ARCHIVED,
          lessonIds: ['l2'],
        },
      ]);
      const snapshot = ds.buildSnapshot(module, [
        makeLesson('l1', Status.PUBLISHED),
        makeLesson('l2', Status.PUBLISHED),
      ]);

      expect(snapshot.map((p) => p.projectId)).toEqual(['p1']);
      expect(snapshot[0]?.lessons.map((l) => l.lessonId)).toEqual(['l1']);
    });

    test('исключает archived-урок опубликованного проекта', () => {
      const module = makeModule([
        {
          uuid: 'p1',
          title: 'П1',
          status: Status.PUBLISHED,
          lessonIds: ['l1', 'l2'],
        },
      ]);
      const snapshot = ds.buildSnapshot(module, [
        makeLesson('l1', Status.PUBLISHED),
        makeLesson('l2', Status.ARCHIVED),
      ]);

      expect(snapshot).toHaveLength(1);
      expect(snapshot[0]?.lessons.map((l) => l.lessonId)).toEqual(['l1']);
    });
  });
});
