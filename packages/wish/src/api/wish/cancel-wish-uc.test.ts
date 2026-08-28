import { describe, expect, mock, test } from 'bun:test';
import type { WishApiModuleResolver } from '#domain/module';
import type { Wish } from '#domain/wish/entity';
import { CancelWishUc } from './cancel-wish-uc';

function setupUc() {
  const save = mock(async (_wish: Wish): Promise<void> => {});
  const getByUserAndTarget = mock(
    async (
      _userId: string,
      _target: Wish['target'],
    ): Promise<Wish | undefined> => undefined,
  );

  const wishRepo = { save, getByUserAndTarget };

  const uc = new CancelWishUc();
  uc.init({ wishRepo } as unknown as WishApiModuleResolver);

  return { save, getByUserAndTarget, uc };
}

function makeExpressedWish(userId: string, courseId: string): Wish {
  return {
    uuid: crypto.randomUUID(),
    userId,
    target: { kind: 'course', courseId },
    status: 'expressed',
    createdAt: '2026-01-01T10:00',
  };
}

describe('CancelWishUc', () => {
  const actorId = crypto.randomUUID();
  const courseId = crypto.randomUUID();

  test('отменяет выраженное желание', async () => {
    const { save, getByUserAndTarget, uc } = setupUc();
    getByUserAndTarget.mockResolvedValueOnce(
      makeExpressedWish(actorId, courseId),
    );

    await uc.handle({ kind: 'course', courseId }, actorId);

    expect(save).toHaveBeenCalledTimes(1);
    const saved = (save as ReturnType<typeof mock>).mock.calls[0]![0] as Wish;
    expect(saved.status).toBe('cancelled');
  });

  test('отменяет подтверждённое желание', async () => {
    const { save, getByUserAndTarget, uc } = setupUc();
    getByUserAndTarget.mockResolvedValueOnce({
      ...makeExpressedWish(actorId, courseId),
      status: 'confirmed' as const,
    });

    await uc.handle({ kind: 'course', courseId }, actorId);

    expect(save).toHaveBeenCalledTimes(1);
    const saved = (save as ReturnType<typeof mock>).mock.calls[0]![0] as Wish;
    expect(saved.status).toBe('cancelled');
  });

  test('выбрасывает WISH_NOT_FOUND для pending (отмена только через abandon)', async () => {
    const { save, getByUserAndTarget, uc } = setupUc();
    getByUserAndTarget.mockResolvedValueOnce({
      ...makeExpressedWish(actorId, courseId),
      status: 'pending' as const,
    });

    await expect(
      uc.handle({ kind: 'course', courseId }, actorId),
    ).rejects.toThrow('Желание не найдено');
    expect(save).toHaveBeenCalledTimes(0);
  });

  test('выбрасывает WISH_NOT_FOUND если желания нет', async () => {
    const { uc } = setupUc();

    await expect(
      uc.handle({ kind: 'course', courseId }, actorId),
    ).rejects.toThrow('Желание не найдено');
  });

  test('выбрасывает WISH_NOT_FOUND если желание уже отменено', async () => {
    const { getByUserAndTarget, uc } = setupUc();
    getByUserAndTarget.mockResolvedValueOnce({
      ...makeExpressedWish(actorId, courseId),
      status: 'cancelled' as const,
    });

    await expect(
      uc.handle({ kind: 'course', courseId }, actorId),
    ).rejects.toThrow('Желание не найдено');
  });

  // ── Вариант команды: module ──

  test('отменяет module-желание по варианту { kind: module, moduleId }', async () => {
    const moduleId = crypto.randomUUID();
    const { save, getByUserAndTarget, uc } = setupUc();
    getByUserAndTarget.mockResolvedValueOnce({
      ...makeExpressedWish(actorId, courseId),
      target: { kind: 'module', moduleId },
    });

    await uc.handle({ kind: 'module', moduleId }, actorId);

    expect(getByUserAndTarget).toHaveBeenCalledWith(actorId, {
      kind: 'module',
      moduleId,
    });
    expect(save).toHaveBeenCalledTimes(1);
    const saved = (save as ReturnType<typeof mock>).mock.calls[0]![0] as Wish;
    expect(saved.status).toBe('cancelled');
  });

  test('module-вариант: неактивное желание — WISH_NOT_FOUND', async () => {
    const moduleId = crypto.randomUUID();
    const { save, getByUserAndTarget, uc } = setupUc();
    getByUserAndTarget.mockResolvedValueOnce({
      ...makeExpressedWish(actorId, courseId),
      target: { kind: 'module', moduleId },
      status: 'fulfilled' as const,
    });

    await expect(
      uc.handle({ kind: 'module', moduleId }, actorId),
    ).rejects.toThrow('Желание не найдено');
    expect(save).not.toHaveBeenCalled();
  });
});
