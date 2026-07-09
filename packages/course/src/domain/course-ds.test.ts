import { describe, expect, test } from 'bun:test';
import type { ContentSnapshot } from './content-snapshot';
import { CourseDs } from './course-ds';

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
});
