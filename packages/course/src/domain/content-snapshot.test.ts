import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import {
  ContentSnapshotItemSchema,
  ContentSnapshotSchema,
  LessonSnapshotSchema,
} from './content-snapshot';

describe('LessonSnapshotSchema', () => {
  test('валидный урок — проходит', () => {
    const input = {
      lessonId: '123e4567-e89b-12d3-a456-426614174000',
      lessonTitle: 'Введение в JavaScript',
      stepIds: [
        '223e4567-e89b-12d3-a456-426614174001',
        '323e4567-e89b-12d3-a456-426614174002',
      ],
    };
    expect(() => v.parse(LessonSnapshotSchema, input)).not.toThrow();
  });

  test('пустой заголовок — падает', () => {
    const input = {
      lessonId: '123e4567-e89b-12d3-a456-426614174000',
      lessonTitle: '',
      stepIds: ['223e4567-e89b-12d3-a456-426614174001'],
    };
    expect(() => v.parse(LessonSnapshotSchema, input)).toThrow();
  });

  test('невалидный UUID урока — падает', () => {
    const input = {
      lessonId: 'not-a-uuid',
      lessonTitle: 'Урок',
      stepIds: [],
    };
    expect(() => v.parse(LessonSnapshotSchema, input)).toThrow();
  });
});

describe('ContentSnapshotItemSchema', () => {
  test('валидный элемент снимка — проходит', () => {
    const input = {
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      projectTitle: 'Проект 1',
      lessons: [
        {
          lessonId: '223e4567-e89b-12d3-a456-426614174001',
          lessonTitle: 'Урок 1',
          stepIds: ['323e4567-e89b-12d3-a456-426614174002'],
        },
      ],
    };
    expect(() => v.parse(ContentSnapshotItemSchema, input)).not.toThrow();
  });

  test('пустой заголовок проекта — падает', () => {
    const input = {
      projectId: '123e4567-e89b-12d3-a456-426614174000',
      projectTitle: '',
      lessons: [],
    };
    expect(() => v.parse(ContentSnapshotItemSchema, input)).toThrow();
  });

  test('невалидный UUID проекта — падает', () => {
    const input = {
      projectId: 'bad-uuid',
      projectTitle: 'Проект',
      lessons: [],
    };
    expect(() => v.parse(ContentSnapshotItemSchema, input)).toThrow();
  });
});

describe('ContentSnapshotSchema', () => {
  test('пустой массив — проходит (нет проектов)', () => {
    expect(() => v.parse(ContentSnapshotSchema, [])).not.toThrow();
  });

  test('массив с одним валидным элементом — проходит', () => {
    const input = [
      {
        projectId: '123e4567-e89b-12d3-a456-426614174000',
        projectTitle: 'Проект 1',
        lessons: [],
      },
    ];
    expect(() => v.parse(ContentSnapshotSchema, input)).not.toThrow();
  });

  test('массив с невалидным элементом — падает', () => {
    const input = [
      {
        projectId: 'bad-uuid',
        projectTitle: 'Проект 1',
        lessons: [],
      },
    ];
    expect(() => v.parse(ContentSnapshotSchema, input)).toThrow();
  });
});
