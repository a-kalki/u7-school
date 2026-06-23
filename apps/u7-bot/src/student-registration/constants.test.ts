import { describe, expect, test } from 'bun:test';
import { findFirstStepId, findStudentByTelegramId, parseLessonLabel } from './constants';
import type { ContentSnapshot } from '@u7-scl/course/domain';

// Тестовый снимок контента для проверки findFirstStepId
const testSnapshot: ContentSnapshot = [
  {
    projectId: 'p1-uuid',
    projectTitle: 'Проект 1',
    lessons: [
      { lessonId: 'l1-uuid', lessonTitle: 'Урок 1.1', stepIds: ['s1-1', 's1-2'] },
      { lessonId: 'l2-uuid', lessonTitle: 'Урок 1.2', stepIds: ['s1-3'] },
    ],
  },
  {
    projectId: 'p2-uuid',
    projectTitle: 'Проект 2',
    lessons: [
      { lessonId: 'l3-uuid', lessonTitle: 'Урок 2.1', stepIds: ['s2-1', 's2-2', 's2-3'] },
    ],
  },
];

describe('parseLessonLabel', () => {
  test('p4-l1 → projectIndex=3, lessonIndex=0', () => {
    expect(parseLessonLabel('p4-l1')).toEqual({ projectIndex: 3, lessonIndex: 0 });
  });

  test('p1-l5 → projectIndex=0, lessonIndex=4', () => {
    expect(parseLessonLabel('p1-l5')).toEqual({ projectIndex: 0, lessonIndex: 4 });
  });

  test('p10-l3 → projectIndex=9, lessonIndex=2', () => {
    expect(parseLessonLabel('p10-l3')).toEqual({ projectIndex: 9, lessonIndex: 2 });
  });

  test('пустая строка → null', () => {
    expect(parseLessonLabel('')).toBeNull();
  });

  test('неверный формат: abc → null', () => {
    expect(parseLessonLabel('abc')).toBeNull();
  });

  test('неверный формат: p-l1 → null', () => {
    expect(parseLessonLabel('p-l1')).toBeNull();
  });

  test('неверный формат: p1-l → null', () => {
    expect(parseLessonLabel('p1-l')).toBeNull();
  });

  test('p0-l1 → null (индексы должны быть положительными)', () => {
    expect(parseLessonLabel('p0-l1')).toBeNull();
  });

  test('пробелы вокруг → ошибка формата', () => {
    expect(parseLessonLabel(' p4-l1 ')).toEqual({ projectIndex: 3, lessonIndex: 0 });
  });
});

describe('findFirstStepId', () => {
  test('p1-l1 → первый шаг первого урока первого проекта', () => {
    expect(findFirstStepId(testSnapshot, 0, 0)).toBe('s1-1');
  });

  test('p1-l2 → первый шаг второго урока первого проекта', () => {
    expect(findFirstStepId(testSnapshot, 0, 1)).toBe('s1-3');
  });

  test('p2-l1 → первый шаг первого урока второго проекта', () => {
    expect(findFirstStepId(testSnapshot, 1, 0)).toBe('s2-1');
  });

  test('p1-l3 — урок не существует → null', () => {
    expect(findFirstStepId(testSnapshot, 0, 2)).toBeNull();
  });

  test('p3-l1 — проект не существует → null', () => {
    expect(findFirstStepId(testSnapshot, 2, 0)).toBeNull();
  });

  test('пустой snapshot → null', () => {
    expect(findFirstStepId([], 0, 0)).toBeNull();
  });
});

describe('findStudentByTelegramId', () => {
  test('находит Алекса по telegramId', () => {
    const alex = findStudentByTelegramId(5167204720);
    expect(alex).not.toBeUndefined();
    expect(alex!.name).toBe('Alex');
    expect(alex!.uuid).toBe('b39a00a8-af8b-4f43-a270-176fc3b4ac7b');
  });

  test('возвращает undefined для неизвестного telegramId', () => {
    expect(findStudentByTelegramId(9999999999)).toBeUndefined();
  });

  test('не находит админа Nur (его нет в STUDENT_LIST)', () => {
    expect(findStudentByTelegramId(773084180)).toBeUndefined();
  });
});
