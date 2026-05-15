import { describe, expect, test } from 'bun:test';
import type { User } from '@u7/user/domain';
import { Role } from '@u7/user/domain';
import type { Course } from '../course/entity';
import { Status } from '../status';
import type { Lesson } from './entity';
import { LessonPolicy } from './policy';

function makeActor(roles: Role[], uuid = 'actor-uuid'): User {
  return {
    uuid,
    name: 'Тест',
    telegramId: 1,
    roles,
    createdAt: '2026-05-01T12:00',
  };
}

const authorId = '550e8400-e29b-41d4-a716-446655440000';

function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    uuid: 'course-uuid',
    kind: 'modules' as const,
    title: 'Курс',
    description: 'Описание',
    authorId,
    status: Status.DRAFT,
    createdAt: '2026-05-01T12:00',
    modules: [],
    ...overrides,
  } as Course;
}

const lesson: Lesson = {
  uuid: 'lesson-uuid',
  courseId: 'course-uuid',
  title: 'Урок',
  status: Status.DRAFT,
  createdAt: '2026-05-01T12:00',
  stepIds: [],
  mentorStepIds: [],
};

describe('LessonPolicy', () => {
  describe('canCreate', () => {
    test('ADMIN не может создавать', () => {
      expect(LessonPolicy.canCreate(makeActor([Role.ADMIN]))).toBe(false);
    });
    test('MENTOR может создавать', () => {
      expect(LessonPolicy.canCreate(makeActor([Role.MENTOR]))).toBe(true);
    });
    test('STUDENT не может создавать', () => {
      expect(LessonPolicy.canCreate(makeActor([Role.STUDENT]))).toBe(false);
    });
  });

  describe('canRead', () => {
    const course = makeCourse();

    test('автор может читать DRAFT', () => {
      expect(
        LessonPolicy.canRead(
          makeActor([Role.MENTOR], authorId),
          lesson,
          course,
        ),
      ).toBe(true);
    });

    test('ADMIN может читать DRAFT', () => {
      expect(
        LessonPolicy.canRead(
          makeActor([Role.ADMIN], 'not-author'),
          lesson,
          course,
        ),
      ).toBe(true);
    });

    test('студент (не автор) может читать PUBLISHED урок', () => {
      expect(
        LessonPolicy.canRead(
          makeActor([Role.STUDENT]),
          { ...lesson, status: Status.PUBLISHED },
          course,
        ),
      ).toBe(true);
    });

    test('студент (не автор) НЕ может читать DRAFT урок', () => {
      expect(
        LessonPolicy.canRead(makeActor([Role.STUDENT]), lesson, course),
      ).toBe(false);
    });
  });

  describe('canEdit', () => {
    const course = makeCourse();

    test('автор может редактировать', () => {
      expect(
        LessonPolicy.canEdit(
          makeActor([Role.MENTOR], authorId),
          lesson,
          course,
        ),
      ).toBe(true);
    });

    test('ADMIN может редактировать', () => {
      expect(
        LessonPolicy.canEdit(makeActor([Role.ADMIN]), lesson, course),
      ).toBe(true);
    });

    test('MENTOR (не автор) не может редактировать', () => {
      expect(
        LessonPolicy.canEdit(makeActor([Role.MENTOR], 'other'), lesson, course),
      ).toBe(false);
    });

    test('STUDENT не может редактировать', () => {
      expect(
        LessonPolicy.canEdit(makeActor([Role.STUDENT]), lesson, course),
      ).toBe(false);
    });
  });
});
