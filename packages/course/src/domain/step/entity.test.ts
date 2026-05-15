import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import { Status } from '../status';
import { StepSchema } from './entity';

const base = {
  uuid: '550e8400-e29b-41d4-a716-446655440000',
  courseId: '660e8400-e29b-41d4-a716-446655440001',
  description: 'Описание шага',
  status: Status.DRAFT,
  createdAt: '2026-05-01T12:00',
};

const validFile = {
  uuid: '770e8400-e29b-41d4-a716-446655440000',
  name: 'файл.pdf',
  mimeType: 'application/pdf',
  size: 1024,
  description: 'Описание файла',
};

describe('StepSchema', () => {
  test('принимает text-шаг', () => {
    const result = v.safeParse(StepSchema, { ...base, kind: 'text' });
    expect(result.success).toBe(true);
  });

  test('принимает code-шаг', () => {
    const result = v.safeParse(StepSchema, {
      ...base,
      kind: 'code',
      code: 'console.log(1)',
    });
    expect(result.success).toBe(true);
  });

  test('принимает code-шаг без language', () => {
    const result = v.safeParse(StepSchema, {
      ...base,
      kind: 'code',
      code: 'x',
    });
    expect(result.success).toBe(true);
  });

  test('принимает file-шаг', () => {
    const result = v.safeParse(StepSchema, {
      ...base,
      kind: 'file',
      file: validFile,
    });
    expect(result.success).toBe(true);
  });

  test('принимает file-шаг без description', () => {
    const { description: _d, ...fm } = validFile;
    const result = v.safeParse(StepSchema, { ...base, kind: 'file', file: fm });
    expect(result.success).toBe(true);
  });

  test('принимает text-шаг без опциональных content, updatedAt', () => {
    const result = v.safeParse(StepSchema, { ...base, kind: 'text' });
    expect(result.success).toBe(true);
  });

  test('отклоняет code-шаг без code', () => {
    const result = v.safeParse(StepSchema, { ...base, kind: 'code' });
    expect(result.success).toBe(false);
  });

  test('отклоняет file-шаг без file', () => {
    const result = v.safeParse(StepSchema, { ...base, kind: 'file' });
    expect(result.success).toBe(false);
  });

  test('отклоняет невалидный kind', () => {
    const result = v.safeParse(StepSchema, { ...base, kind: 'video' });
    expect(result.success).toBe(false);
  });

  test('отклоняет пустое описание', () => {
    const result = v.safeParse(StepSchema, {
      ...base,
      kind: 'text',
      description: '',
    });
    expect(result.success).toBe(false);
  });
});
