import { describe, expect, it } from 'bun:test';
import { safeParse } from 'valibot';
import { CourseSchema, PhaseSchema } from './entity';

describe('CourseSchema', () => {
  const validCourse = {
    uuid: crypto.randomUUID(),
    title: 'Полный курс JS',
    description: 'Изучаем JavaScript с нуля',
    authorId: crypto.randomUUID(),
    phases: [],
    status: 'draft' as const,
    createdAt: '2026-07-08T16:00',
  };

  it('принимает валидный курс', () => {
    const result = safeParse(CourseSchema, validCourse);
    expect(result.success).toBe(true);
  });

  it('принимает курс с фазами', () => {
    const course = {
      ...validCourse,
      phases: [
        {
          title: 'Этап 1',
          track: 'tech',
          moduleIds: [],
        },
      ],
    };
    const result = safeParse(CourseSchema, course);
    expect(result.success).toBe(true);
  });

  it('отклоняет пустой заголовок', () => {
    const result = safeParse(CourseSchema, {
      ...validCourse,
      title: '',
    });
    expect(result.success).toBe(false);
  });

  it('отклоняет пустое описание', () => {
    const result = safeParse(CourseSchema, {
      ...validCourse,
      description: '',
    });
    expect(result.success).toBe(false);
  });

  it('отклоняет некорректный UUID', () => {
    const result = safeParse(CourseSchema, {
      ...validCourse,
      uuid: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('отклоняет некорректный authorId', () => {
    const result = safeParse(CourseSchema, {
      ...validCourse,
      authorId: 'bad-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('отклоняет невалидный статус', () => {
    const result = safeParse(CourseSchema, {
      ...validCourse,
      status: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('отклоняет некорректный createdAt', () => {
    const result = safeParse(CourseSchema, {
      ...validCourse,
      createdAt: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });
});

describe('PhaseSchema', () => {
  const validPhase = {
    title: 'Этап 1',
    moduleIds: [],
  };

  it('принимает валидную фазу', () => {
    const result = safeParse(PhaseSchema, validPhase);
    expect(result.success).toBe(true);
  });

  it('принимает фазу с track', () => {
    const result = safeParse(PhaseSchema, {
      ...validPhase,
      track: 'tech',
      moduleIds: [crypto.randomUUID()],
    });
    expect(result.success).toBe(true);
  });

  it('отклоняет пустой заголовок фазы', () => {
    const result = safeParse(PhaseSchema, { ...validPhase, title: '' });
    expect(result.success).toBe(false);
  });

  it('отклоняет невалидный moduleIds', () => {
    const result = safeParse(PhaseSchema, {
      ...validPhase,
      moduleIds: ['not-uuid'],
    });
    expect(result.success).toBe(false);
  });
});
