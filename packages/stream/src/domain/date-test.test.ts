import { describe, expect, test } from 'bun:test';
import * as v from 'valibot';

test('isoDateTime валидация', () => {
  const schema = v.pipe(v.string(), v.isoDateTime());
  const date = '2026-06-01T12:00'; // без секунд
  const result = v.safeParse(schema, date);
  expect(result.success).toBe(true);
});
