import { describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import type { Module } from '../module/entity';
import { Status } from '../status';
import type { Step } from './entity';
import { StepPolicy } from './policy';

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

function makeCourse(overrides: Partial<Course> = {}): Module {
  return {
    uuid: 'course-uuid',
    title: 'Курс',
    description: 'Описание',
    authorId,
    status: Status.DRAFT,
    createdAt: '2026-05-01T12:00',
    projects: [],
    ...overrides,
  } as Course;
}

const step: Step = {
  uuid: 'step-uuid',
  courseId: 'course-uuid',
  description: 'Шаг',
  status: Status.DRAFT,
  createdAt: '2026-05-01T12:00',
} as Step;

describe('StepPolicy', () => {
  describe('canCreate', () => {
    test('ADMIN может создавать', () => {
      expect(StepPolicy.canCreate(makeActor([Role.ADMIN]))).toBe(true);
    });
    test('MENTOR может создавать', () => {
      expect(StepPolicy.canCreate(makeActor([Role.MENTOR]))).toBe(true);
    });
    test('STUDENT не может создавать', () => {
      expect(StepPolicy.canCreate(makeActor([Role.STUDENT]))).toBe(false);
    });
  });

  describe('canRead', () => {
    const course = makeCourse();

    test('автор может читать DRAFT', () => {
      expect(
        StepPolicy.canRead(makeActor([Role.MENTOR], authorId), step, course),
      ).toBe(true);
    });

    test('ADMIN может читать DRAFT', () => {
      expect(StepPolicy.canRead(makeActor([Role.ADMIN]), step, course)).toBe(
        true,
      );
    });

    test('студент может читать PUBLISHED шаг', () => {
      expect(
        StepPolicy.canRead(
          makeActor([Role.STUDENT]),
          { ...step, status: Status.PUBLISHED },
          course,
        ),
      ).toBe(true);
    });

    test('студент НЕ может читать DRAFT шаг', () => {
      expect(StepPolicy.canRead(makeActor([Role.STUDENT]), step, course)).toBe(
        false,
      );
    });
  });

  describe('canEdit', () => {
    const course = makeCourse();

    test('автор может редактировать', () => {
      expect(
        StepPolicy.canEdit(makeActor([Role.MENTOR], authorId), step, course),
      ).toBe(true);
    });

    test('ADMIN может редактировать', () => {
      expect(StepPolicy.canEdit(makeActor([Role.ADMIN]), step, course)).toBe(
        true,
      );
    });

    test('MENTOR не автор не может редактировать', () => {
      expect(
        StepPolicy.canEdit(makeActor([Role.MENTOR], 'other'), step, course),
      ).toBe(false);
    });

    test('STUDENT не может редактировать', () => {
      expect(StepPolicy.canEdit(makeActor([Role.STUDENT]), step, course)).toBe(
        false,
      );
    });
  });
});
