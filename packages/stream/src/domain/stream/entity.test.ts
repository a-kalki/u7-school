import { describe, expect, test } from 'bun:test';
import { ContentSnapshotSchema } from '@u7-scl/course/domain';
import * as v from 'valibot';
import { StreamStatus } from '../status';
import { StreamSchema } from './entity';

const validContentSnapshot = [
  {
    projectId: '11111111-1111-4111-8111-111111111111',
    projectTitle: 'Введение',
    lessons: [
      {
        lessonId: '22222222-2222-4222-8222-222222222222',
        lessonTitle: 'Урок 1',
        stepIds: [
          '33333333-3333-4333-8333-333333333333',
          '44444444-4444-4444-8444-444444444444',
        ],
      },
    ],
  },
];

const validStream = {
  uuid: '550e8400-e29b-41d4-a716-446655440001',
  title: 'Поток JS-1',
  description: 'Основной поток курса JavaScript',
  mentorId: '660e8400-e29b-41d4-a716-446655440002',
  moduleId: '770e8400-e29b-41d4-a716-446655440003',
  startDate: '2026-06-01T12:00',
  status: StreamStatus.ENROLLMENT,
  contentSnapshot: validContentSnapshot,
  createdAt: '2026-06-01T10:00',
};

describe('ContentSnapshotSchema', () => {
  test('валидирует корректный снимок', () => {
    const result = v.safeParse(ContentSnapshotSchema, validContentSnapshot);
    expect(result.success).toBe(true);
  });

  test('отклоняет пустой заголовок проекта', () => {
    const firstSnapshot = validContentSnapshot[0];
    if (!firstSnapshot) throw new Error('Test setup error');
    const invalidSnapshot = [
      {
        ...firstSnapshot,
        projectTitle: '',
      },
    ];
    const result = v.safeParse(ContentSnapshotSchema, invalidSnapshot);
    expect(result.success).toBe(false);
  });

  test('отклоняет невалидные stepIds', () => {
    const firstSnapshot = validContentSnapshot[0];
    if (!firstSnapshot) throw new Error('Test setup error');
    const invalidSnapshot = [
      {
        ...firstSnapshot,
        lessons: [
          {
            lessonId: '22222222-2222-4222-8222-222222222222',
            lessonTitle: 'Урок 1',
            stepIds: ['bad-uuid'],
          },
        ],
      },
    ];
    const result = v.safeParse(ContentSnapshotSchema, invalidSnapshot);
    expect(result.success).toBe(false);
  });
});

describe('StreamSchema', () => {
  test('валидирует полный корректный объект потока', () => {
    const result = v.safeParse(StreamSchema, validStream);
    expect(result.success).toBe(true);
  });

  test('принимает объект со всеми опциональными полями', () => {
    const withOptionals = {
      ...validStream,
      telegramGroupId: '-100123456789',
      goal: 'Цель обучения',
      result: 'Результат обучения',
      rules: 'Правила прохождения',
      additional: 'Дополнительные материалы',
      targetAudience: 'Целевая аудитория',
      updatedAt: '2026-06-01T11:00',
    };
    const result = v.safeParse(StreamSchema, withOptionals);
    expect(result.success).toBe(true);
  });

  test('отклоняет без обязательных полей', () => {
    const { title, ...noTitle } = validStream;
    const result = v.safeParse(StreamSchema, noTitle);
    expect(result.success).toBe(false);
  });

  test('отклоняет пустой заголовок потока', () => {
    const result = v.safeParse(StreamSchema, { ...validStream, title: '' });
    expect(result.success).toBe(false);
  });

  test('отклоняет некорректный UUID для uuid', () => {
    const result = v.safeParse(StreamSchema, {
      ...validStream,
      uuid: 'bad-uuid',
    });
    expect(result.success).toBe(false);
  });

  test('отклоняет некорректный UUID для mentorId', () => {
    const result = v.safeParse(StreamSchema, {
      ...validStream,
      mentorId: 'bad-uuid',
    });
    expect(result.success).toBe(false);
  });

  test('отклоняет некорректный UUID для moduleId', () => {
    const result = v.safeParse(StreamSchema, {
      ...validStream,
      moduleId: 'bad-uuid',
    });
    expect(result.success).toBe(false);
  });
});
