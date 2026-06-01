import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';
import { StreamStatus, StreamStatusSchema } from './status';

describe('StreamStatus (перечисление)', () => {
  test('определены все необходимые статусы', () => {
    expect(StreamStatus.ENROLLMENT as string).toBe('enrollment');
    expect(StreamStatus.ACTIVE as string).toBe('active');
    expect(StreamStatus.COMPLETED as string).toBe('completed');
    expect(StreamStatus.ARCHIVED as string).toBe('archived');
  });

  test('StreamStatusSchema пропускает валидные значения', () => {
    expect(
      v.safeParse(StreamStatusSchema, StreamStatus.ENROLLMENT).success,
    ).toBe(true);
    expect(v.safeParse(StreamStatusSchema, StreamStatus.ACTIVE).success).toBe(
      true,
    );
    expect(
      v.safeParse(StreamStatusSchema, StreamStatus.COMPLETED).success,
    ).toBe(true);
    expect(v.safeParse(StreamStatusSchema, StreamStatus.ARCHIVED).success).toBe(
      true,
    );
  });

  test('StreamStatusSchema отклоняет невалидные значения', () => {
    expect(v.safeParse(StreamStatusSchema, 'deleted').success).toBe(false);
    expect(v.safeParse(StreamStatusSchema, 'draft').success).toBe(false);
    expect(v.safeParse(StreamStatusSchema, '').success).toBe(false);
    expect(v.safeParse(StreamStatusSchema, 123).success).toBe(false);
    expect(v.safeParse(StreamStatusSchema, null).success).toBe(false);
  });
});
