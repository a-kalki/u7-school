import { describe, expect, test } from 'bun:test';
import { WishPolicy } from './policy';

describe('WishPolicy', () => {
  describe('isActive', () => {
    test('активные статусы → true', () => {
      expect(WishPolicy.isActive('expressed')).toBe(true);
      expect(WishPolicy.isActive('pending')).toBe(true);
      expect(WishPolicy.isActive('confirmed')).toBe(true);
    });

    test('завершённые статусы → false', () => {
      expect(WishPolicy.isActive('cancelled')).toBe(false);
      expect(WishPolicy.isActive('abandoned')).toBe(false);
      expect(WishPolicy.isActive('fulfilled')).toBe(false);
    });
  });
});
