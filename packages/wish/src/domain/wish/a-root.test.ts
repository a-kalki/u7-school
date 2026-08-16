import { describe, expect, it } from 'bun:test';
import { WishAr } from './a-root';

describe('WishAr', () => {
  const userId = crypto.randomUUID();
  const courseId = crypto.randomUUID();

  describe('express()', () => {
    it('создаёт желание в статусе expressed', () => {
      const wish = WishAr.express(userId, courseId);

      expect(wish.state.userId).toBe(userId);
      expect(wish.state.courseId).toBe(courseId);
      expect(wish.state.status).toBe('expressed');
      expect(wish.state.uuid).toBeTypeOf('string');
      expect(wish.state.createdAt).toBeTypeOf('string');
      expect(wish.state.updatedAt).toBeUndefined();
    });
  });

  describe('cancel()', () => {
    it('переводит expressed → cancelled', () => {
      const wish = WishAr.express(userId, courseId);

      wish.cancel();

      expect(wish.state.status).toBe('cancelled');
      expect(wish.state.updatedAt).toBeTypeOf('string');
    });

    it('повторная отмена выбрасывает ошибку', () => {
      const wish = WishAr.express(userId, courseId);
      wish.cancel();

      expect(() => wish.cancel()).toThrow(
        'Отменить можно только выраженное желание',
      );
    });

    it('нельзя отменить fulfilled-желание', () => {
      const wish = new WishAr({
        uuid: crypto.randomUUID(),
        userId,
        courseId,
        status: 'fulfilled',
        createdAt: '2026-08-14T10:00',
      });

      expect(() => wish.cancel()).toThrow(
        'Отменить можно только выраженное желание',
      );
    });
  });
});
