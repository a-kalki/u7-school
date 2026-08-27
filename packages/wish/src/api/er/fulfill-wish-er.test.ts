import { describe, expect, mock, test } from 'bun:test';
import type { StudentEnrolledEvent } from '@u7-scl/stream/domain';
import type { WishApiModuleResolver } from '#domain/module';
import type { Wish } from '#domain/wish/entity';
import { FulfillWishEr } from './fulfill-wish-er';

const moduleId = '33333333-3333-4333-8333-333333333333';
const userId = '22222222-2222-4222-8222-222222222222';
const courseId = '44444444-4444-4444-8444-444444444444';

function makeEvent(userId: string): StudentEnrolledEvent {
  return {
    eventId: crypto.randomUUID(),
    eventName: 'student.enrolled',
    occurredAt: '2026-08-27T12:00',
    aggregateName: 'Student',
    aggregateId: crypto.randomUUID(),
    payload: {
      studentId: crypto.randomUUID(),
      userId,
      streamId: crypto.randomUUID(),
      moduleId,
    },
  };
}

function makeWish(
  userId: string,
  status: Wish['status'],
  cid = courseId,
): Wish {
  return {
    uuid: crypto.randomUUID(),
    userId,
    target: { kind: 'course', courseId: cid },
    status,
    createdAt: '2026-08-20T10:00',
  };
}

function makeModuleWish(
  userId: string,
  status: Wish['status'],
  mid = moduleId,
): Wish {
  return {
    uuid: crypto.randomUUID(),
    userId,
    target: { kind: 'module', moduleId: mid },
    status,
    createdAt: '2026-08-20T10:00',
  };
}

function setupEr(wishes: Wish[], matchedCourseIds: string[] = []) {
  const save = mock(async (_wish: Wish): Promise<void> => {});
  const getByUser = mock(async (_userId: string): Promise<Wish[]> => wishes);
  const whichCoursesIncludeModule = mock(
    async (_moduleId: string, _courseIds: string[]): Promise<string[]> =>
      matchedCourseIds,
  );
  const isSameModule = mock(
    async (a: string, b: string): Promise<boolean> => a === b,
  );

  const er = new FulfillWishEr();
  er.init({
    wishRepo: { save, getByUser },
    courseFacade: { whichCoursesIncludeModule, isSameModule },
  } as unknown as WishApiModuleResolver);

  return { save, getByUser, whichCoursesIncludeModule, isSameModule, er };
}

describe('FulfillWishEr', () => {
  test('реализует выраженное желание (expressed → fulfilled)', async () => {
    const event = makeEvent(userId);
    const wish = makeWish(userId, 'expressed');
    const { save, er } = setupEr([wish], [courseId]);

    await er.handle(event);

    expect(save).toHaveBeenCalledTimes(1);
    const saved = (save as any).mock.calls[0][0] as Wish;
    expect(saved.uuid).toBe(wish.uuid);
    expect(saved.status).toBe('fulfilled');
  });

  test('реализует подтверждённое желание (confirmed → fulfilled)', async () => {
    const event = makeEvent(userId);
    const wish = makeWish(userId, 'confirmed');
    const { save, er } = setupEr([wish], [courseId]);

    await er.handle(event);

    expect(save).toHaveBeenCalledTimes(1);
    const saved = (save as any).mock.calls[0][0] as Wish;
    expect(saved.status).toBe('fulfilled');
  });

  test('один батч-вызов фасада с courseIds всех активных кандидатов', async () => {
    const event = makeEvent(userId);
    const wish = makeWish(userId, 'expressed');
    const { whichCoursesIncludeModule, er } = setupEr([wish], [courseId]);

    await er.handle(event);

    expect(whichCoursesIncludeModule).toHaveBeenCalledTimes(1);
    expect(whichCoursesIncludeModule).toHaveBeenCalledWith(moduleId, [
      courseId,
    ]);
  });

  test('неактивные желания исключаются: fulfilled/cancelled — filter не вызывается, save 0', async () => {
    const event = makeEvent(userId);
    const fulfilled = makeWish(userId, 'fulfilled');
    const cancelled = makeWish(userId, 'cancelled');
    const { save, whichCoursesIncludeModule, er } = setupEr([
      fulfilled,
      cancelled,
    ]);

    await er.handle(event);

    expect(whichCoursesIncludeModule).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  test('совпадений нет — игнор без сохранения (идемпотентность)', async () => {
    const event = makeEvent(userId);
    const wish = makeWish(userId, 'expressed');
    const { save, er } = setupEr([wish], []);

    await er.handle(event);

    expect(save).not.toHaveBeenCalled();
  });

  test('желаний у пользователя нет — тихий выход', async () => {
    const { save, whichCoursesIncludeModule, er } = setupEr([]);

    await er.handle(makeEvent(userId));

    expect(whichCoursesIncludeModule).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  test('желания на курсы одной форк-семьи реализуются все', async () => {
    const event = makeEvent(userId);
    const forkCourseId = '55555555-5555-4555-8555-555555555555';
    const wish1 = makeWish(userId, 'expressed', courseId);
    const wish2 = makeWish(userId, 'confirmed', forkCourseId);
    const { save, er } = setupEr([wish1, wish2], [courseId, forkCourseId]);

    await er.handle(event);

    expect(save).toHaveBeenCalledTimes(2);
    const saved = (save as any).mock.calls.map(
      (c: unknown[]) => (c[0] as Wish).status,
    );
    expect(saved).toEqual(['fulfilled', 'fulfilled']);
  });

  // ── Ветка module-wish ──

  test('модульное желание реализуется при зачислении на тот же модуль (isSameModule)', async () => {
    const event = makeEvent(userId);
    const wish = makeModuleWish(userId, 'expressed');
    const { save, isSameModule, whichCoursesIncludeModule, er } = setupEr([
      wish,
    ]);

    await er.handle(event);

    expect(save).toHaveBeenCalledTimes(1);
    const saved = (save as any).mock.calls[0][0] as Wish;
    expect(saved.status).toBe('fulfilled');
    // матчинг — через isSameModule, а не прямое сравнение id
    expect(isSameModule).toHaveBeenCalledWith(moduleId, moduleId);
    // course-ветка не вызывается (нет course-кандидатов)
    expect(whichCoursesIncludeModule).not.toHaveBeenCalled();
  });

  test('модульное желание не реализуется при зачислении на другой модуль', async () => {
    const event = makeEvent(userId);
    const otherModuleId = '99999999-9999-4999-8999-999999999999';
    const wish = makeModuleWish(userId, 'confirmed', otherModuleId);
    const { save, er } = setupEr([wish]);

    await er.handle(event);

    expect(save).not.toHaveBeenCalled();
  });

  test('неактивное модульное желание не реализуется', async () => {
    const event = makeEvent(userId);
    const wish = makeModuleWish(userId, 'cancelled');
    const { save, er } = setupEr([wish]);

    await er.handle(event);

    expect(save).not.toHaveBeenCalled();
  });

  test('смешанные желания: course и module реализуются независимо', async () => {
    const event = makeEvent(userId);
    const courseWish = makeWish(userId, 'expressed');
    const moduleWish = makeModuleWish(userId, 'expressed');
    const { save, er } = setupEr([courseWish, moduleWish], [courseId]);

    await er.handle(event);

    expect(save).toHaveBeenCalledTimes(2);
  });
});
