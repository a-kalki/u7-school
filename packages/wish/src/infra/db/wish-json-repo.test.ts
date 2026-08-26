import { afterAll, describe, expect, test } from 'bun:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import type { Wish, WishTarget } from '#domain/wish/entity';
import { WishJsonRepo } from './wish-json-repo';

const tmpDir = mkdtempSync('/tmp/wish-json-repo-test-');

function filePath(filename = 'wishes.json'): string {
  return join(tmpDir, filename);
}

function makeTarget(courseId = crypto.randomUUID()): WishTarget {
  return { kind: 'course', courseId };
}

function makeWish(overrides: Partial<Wish> = {}): Wish {
  return {
    uuid: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    target: makeTarget(),
    status: 'expressed',
    createdAt: '2026-05-01T12:00',
    ...overrides,
  };
}

describe('WishJsonRepo', () => {
  afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('save и getByUuid', () => {
    test('сохраняет и находит желание по uuid', async () => {
      const repo = new WishJsonRepo(filePath());
      const wish = makeWish();

      await repo.save(wish);
      const found = await repo.getByUuid(wish.uuid);

      expect(found?.uuid).toBe(wish.uuid);
      expect(found?.status).toBe('expressed');
    });

    test('getByUuid возвращает undefined для несуществующего', async () => {
      const repo = new WishJsonRepo(filePath());

      const found = await repo.getByUuid(
        '550e8400-e29b-41d4-a716-446655440099',
      );
      expect(found).toBeUndefined();
    });

    test('save перезаписывает существующее желание', async () => {
      const repo = new WishJsonRepo(filePath('wishes-update.json'));
      const wish = makeWish();
      await repo.save(wish);

      const updated = { ...wish, status: 'cancelled' as const };
      await repo.save(updated);

      const found = await repo.getByUuid(wish.uuid);
      expect(found?.status).toBe('cancelled');
    });
  });

  describe('getByUserAndTarget', () => {
    test('возвращает последнее желание пользователя по target', async () => {
      const repo = new WishJsonRepo(filePath('wishes-by-user-target.json'));
      const userId = crypto.randomUUID();
      const target = makeTarget();
      const older = makeWish({
        userId,
        target,
        createdAt: '2026-01-01T10:00',
      });
      const newer = makeWish({
        userId,
        target,
        createdAt: '2026-02-01T10:00',
      });

      await repo.save(older);
      await repo.save(newer);

      const found = await repo.getByUserAndTarget(userId, target);
      expect(found?.uuid).toBe(newer.uuid);
    });

    test('различает цели по courseId', async () => {
      const repo = new WishJsonRepo(filePath('wishes-diff-targets.json'));
      const userId = crypto.randomUUID();
      const targetA = makeTarget();
      const targetB = makeTarget();
      await repo.save(makeWish({ userId, target: targetA }));

      const found = await repo.getByUserAndTarget(userId, targetB);
      expect(found).toBeUndefined();
    });

    test('возвращает undefined если желания нет', async () => {
      const repo = new WishJsonRepo(filePath('wishes-none.json'));

      const found = await repo.getByUserAndTarget(
        crypto.randomUUID(),
        makeTarget(),
      );
      expect(found).toBeUndefined();
    });
  });

  describe('getByUser', () => {
    test('возвращает все желания пользователя', async () => {
      const repo = new WishJsonRepo(filePath('wishes-by-user.json'));
      const userId = crypto.randomUUID();
      const w1 = makeWish({ userId });
      const w2 = makeWish({ userId });
      const other = makeWish({ userId: crypto.randomUUID() });

      await repo.save(w1);
      await repo.save(w2);
      await repo.save(other);

      const found = await repo.getByUser(userId);
      expect(found).toHaveLength(2);
    });
  });
});
