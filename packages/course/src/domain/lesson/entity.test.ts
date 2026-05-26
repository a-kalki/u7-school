import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import { Status } from '../status';
import { LessonSchema } from './entity';

const validLesson = {
  uuid: '550e8400-e29b-41d4-a716-446655440000',
  moduleId: '660e8400-e29b-41d4-a716-446655440001',
  title: 'Введение',
  additional: 'Дополнительно',
  status: Status.DRAFT,
  createdAt: '2026-05-01T12:00',
  updatedAt: '2026-05-01T13:00',
  estimatedMinutes: 45,
  stepIds: ['770e8400-e29b-41d4-a716-446655440002'],
  mentorStepIds: ['770e8400-e29b-41d4-a716-446655440003'],
};

describe('LessonSchema', () => {
  test('принимает валидный урок', () => {
    const result = v.safeParse(LessonSchema, validLesson);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.output).toMatchObject(validLesson);
    }
  });

  test('принимает минимальный урок без опциональных полей', () => {
    const minimal = {
      uuid: validLesson.uuid,
      moduleId: validLesson.moduleId,
      title: 'Минимум',
      status: Status.DRAFT,
      createdAt: validLesson.createdAt,
      stepIds: [],
      mentorStepIds: [],
    };
    const result = v.safeParse(LessonSchema, minimal);
    expect(result.success).toBe(true);
  });

  test('отклоняет пустой заголовок', () => {
    const result = v.safeParse(LessonSchema, { ...validLesson, title: '' });
    expect(result.success).toBe(false);
  });

  test('отклоняет отрицательный estimatedMinutes', () => {
    const result = v.safeParse(LessonSchema, {
      ...validLesson,
      estimatedMinutes: -1,
    });
    expect(result.success).toBe(false);
  });

  test('отклоняет невалидный UUID в stepIds', () => {
    const result = v.safeParse(LessonSchema, {
      ...validLesson,
      stepIds: ['bad'],
    });
    expect(result.success).toBe(false);
  });

  test('отклоняет невалидный UUID в mentorStepIds', () => {
    const result = v.safeParse(LessonSchema, {
      ...validLesson,
      mentorStepIds: ['bad'],
    });
    expect(result.success).toBe(false);
  });
});
