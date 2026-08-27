import { describe, expect, it } from 'bun:test';
import { WishAr } from './a-root';
import type { Wish, WishTarget } from './entity';

describe('WishAr', () => {
  const userId = crypto.randomUUID();
  const courseTarget: WishTarget = {
    kind: 'course',
    courseId: crypto.randomUUID(),
  };

  /** Собирает желание в заданном статусе (для тестов переходов). */
  function makeWish(status: Wish['status']): WishAr {
    return new WishAr({
      uuid: crypto.randomUUID(),
      userId,
      target: courseTarget,
      status,
      createdAt: '2026-08-26T10:00',
    });
  }

  describe('express()', () => {
    it('создаёт желание в статусе expressed с target', () => {
      const wish = WishAr.express(userId, courseTarget);

      expect(wish.state.userId).toBe(userId);
      expect(wish.state.target).toEqual(courseTarget);
      expect(wish.state.status).toBe('expressed');
      expect(wish.state.uuid).toBeTypeOf('string');
      expect(wish.state.createdAt).toBeTypeOf('string');
      expect(wish.state.updatedAt).toBeUndefined();
    });
  });

  describe('pending()', () => {
    it('создаёт желание в статусе pending с target', () => {
      const wish = WishAr.pending(userId, courseTarget);

      expect(wish.state.userId).toBe(userId);
      expect(wish.state.target).toEqual(courseTarget);
      expect(wish.state.status).toBe('pending');
    });
  });

  describe('confirm()', () => {
    it('переводит pending → confirmed', () => {
      const wish = WishAr.pending(userId, courseTarget);

      wish.confirm();

      expect(wish.state.status).toBe('confirmed');
      expect(wish.state.updatedAt).toBeTypeOf('string');
    });

    it('ошибка при confirm из expressed (мгновенная ветка)', () => {
      const wish = makeWish('expressed');

      expect(() => wish.confirm()).toThrow(
        'Подтвердить можно только ожидающее анкету желание',
      );
    });

    it('повторный confirm выбрасывает ошибку', () => {
      const wish = makeWish('confirmed');

      expect(() => wish.confirm()).toThrow(
        'Подтвердить можно только ожидающее анкету желание',
      );
    });
  });

  describe('abandon()', () => {
    it('переводит pending → abandoned', () => {
      const wish = WishAr.pending(userId, courseTarget);

      wish.abandon();

      expect(wish.state.status).toBe('abandoned');
      expect(wish.state.updatedAt).toBeTypeOf('string');
    });

    it('ошибка при abandon из confirmed', () => {
      const wish = makeWish('confirmed');

      expect(() => wish.abandon()).toThrow(
        'Бросить можно только ожидающее анкету желание',
      );
    });
  });

  describe('cancel()', () => {
    it('переводит expressed → cancelled', () => {
      const wish = WishAr.express(userId, courseTarget);

      wish.cancel();

      expect(wish.state.status).toBe('cancelled');
      expect(wish.state.updatedAt).toBeTypeOf('string');
    });

    it('переводит confirmed → cancelled', () => {
      const wish = makeWish('confirmed');

      wish.cancel();

      expect(wish.state.status).toBe('cancelled');
    });

    it('ошибка при cancel из pending (для pending — только abandon)', () => {
      const wish = makeWish('pending');

      expect(() => wish.cancel()).toThrow(
        'Отменить можно только выраженное или подтверждённое желание',
      );
    });

    it('нельзя отменить fulfilled-желание', () => {
      const wish = makeWish('fulfilled');

      expect(() => wish.cancel()).toThrow(
        'Отменить можно только выраженное или подтверждённое желание',
      );
    });

    it('повторная отмена выбрасывает ошибку', () => {
      const wish = makeWish('cancelled');

      expect(() => wish.cancel()).toThrow(
        'Отменить можно только выраженное или подтверждённое желание',
      );
    });
  });

  describe('fulfill()', () => {
    it('реализует выраженное желание: expressed → fulfilled', () => {
      const wish = makeWish('expressed');

      wish.fulfill();

      expect(wish.state.status).toBe('fulfilled');
      expect(wish.state.updatedAt).toBeTypeOf('string');
    });

    it('реализует подтверждённое желание: confirmed → fulfilled', () => {
      const wish = makeWish('confirmed');

      wish.fulfill();

      expect(wish.state.status).toBe('fulfilled');
    });

    it('ошибка при fulfill из pending (для pending — только confirm/abandon)', () => {
      const wish = makeWish('pending');

      expect(() => wish.fulfill()).toThrow(
        'Реализовать можно только выраженное или подтверждённое желание',
      );
    });

    it('повторный fulfill выбрасывает ошибку (идемпотентность на уровне агрегата)', () => {
      const wish = makeWish('fulfilled');

      expect(() => wish.fulfill()).toThrow(
        'Реализовать можно только выраженное или подтверждённое желание',
      );
    });

    it('нельзя реализовать отменённое желание', () => {
      const wish = makeWish('cancelled');

      expect(() => wish.fulfill()).toThrow(
        'Реализовать можно только выраженное или подтверждённое желание',
      );
    });
  });
});
