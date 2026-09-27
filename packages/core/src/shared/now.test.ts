import { expect, spyOn, test } from 'bun:test';
import * as Shared from './index';

test('spyOn(Shared, now) замораживает и now(), и isoNow()', () => {
  const frozen = new Date('2026-01-02T03:04:05.678Z');
  const spy = spyOn(Shared, 'now').mockReturnValue(frozen);

  expect(Shared.now().toISOString()).toBe(frozen.toISOString());
  // isoNow — другой модуль, но обязан ходить через now()
  expect(Shared.isoNow()).toBe('2026-01-02T03:04');

  spy.mockRestore();
  expect(Shared.now().getTime()).toBeGreaterThan(frozen.getTime());
});
