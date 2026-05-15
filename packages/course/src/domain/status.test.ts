import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import { Status, StatusSchema } from './status';

describe('Status (перечисление)', () => {
  test('определены статусы draft, published, archived', () => {
    expect(Status.DRAFT as string).toBe('draft');
    expect(Status.PUBLISHED as string).toBe('published');
    expect(Status.ARCHIVED as string).toBe('archived');
  });

  test('StatusSchema пропускает валидные значения', () => {
    expect(v.safeParse(StatusSchema, Status.DRAFT).success).toBe(true);
    expect(v.safeParse(StatusSchema, Status.PUBLISHED).success).toBe(true);
    expect(v.safeParse(StatusSchema, Status.ARCHIVED).success).toBe(true);
  });

  test('StatusSchema отклоняет невалидные значения', () => {
    expect(v.safeParse(StatusSchema, 'deleted').success).toBe(false);
    expect(v.safeParse(StatusSchema, 'inactive').success).toBe(false);
    expect(v.safeParse(StatusSchema, '').success).toBe(false);
    expect(v.safeParse(StatusSchema, 123).success).toBe(false);
    expect(v.safeParse(StatusSchema, null).success).toBe(false);
  });
});
