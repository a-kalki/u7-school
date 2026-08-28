import { describe, expect, mock, test } from 'bun:test';
import type { StreamCreatedEvent } from '@u7-scl/stream/domain';
import type { WishApiModuleResolver } from '#domain/module';
import type { Wish } from '#domain/wish/entity';
import type { WishInviteEvent } from '#domain/wish/events';
import { InviteWishersEr } from './invite-wishers-er';

const streamId = '11111111-1111-4111-8111-111111111111';
const moduleId = '33333333-3333-4333-8333-333333333333';
const otherModuleId = '99999999-9999-4999-8999-999999999999';
const userId = '22222222-2222-4222-8222-222222222222';
const courseId = '44444444-4444-4444-8444-444444444444';
const telegramId = 777;

function makeEvent(mid = moduleId): StreamCreatedEvent {
  return {
    eventId: crypto.randomUUID(),
    eventName: 'stream.created',
    occurredAt: '2026-08-27T12:00',
    aggregateName: 'Stream',
    aggregateId: streamId,
    payload: { streamId, moduleId: mid },
  };
}

function makeWish(
  overrides: Partial<Wish> = {},
  targetCourseId = courseId,
): Wish {
  return {
    uuid: crypto.randomUUID(),
    userId,
    target: { kind: 'course', courseId: targetCourseId },
    status: 'expressed',
    createdAt: '2026-08-20T10:00',
    ...overrides,
  };
}

function makeModuleWish(
  overrides: Partial<Wish> = {},
  targetModuleId = moduleId,
): Wish {
  return {
    uuid: crypto.randomUUID(),
    userId,
    target: { kind: 'module', moduleId: targetModuleId },
    status: 'expressed',
    createdAt: '2026-08-20T10:00',
    ...overrides,
  };
}

interface ErDeps {
  courseWishes: Wish[];
  moduleWishes: Wish[];
  place?: { courseId: string; isFirst: boolean; isLast: boolean };
  matchedCourseIds?: string[];
  sameModuleIds?: string[];
  user?: { uuid: string; telegramId: number; name: string } | undefined;
}

function setupEr(deps: ErDeps) {
  const findAllByKind = mock(async (kind: 'course' | 'module') =>
    kind === 'course' ? deps.courseWishes : deps.moduleWishes,
  );
  const getModulePlace = mock(async () => deps.place);
  const whichCoursesIncludeModule = mock(
    async (_m: string, _c: string[]) => deps.matchedCourseIds ?? [],
  );
  const whichModulesAreSame = mock(
    async (_m: string, _ids: string[]) => deps.sameModuleIds ?? [],
  );
  const getUserByUuid = mock(async () => deps.user);
  const publish = mock((_event: WishInviteEvent) => {});

  const er = new InviteWishersEr();
  er.init({
    wishRepo: { findAllByKind },
    courseFacade: {
      getModulePlace,
      whichCoursesIncludeModule,
      whichModulesAreSame,
    },
    userFacade: { getUserByUuid },
    eventBus: { publish },
  } as unknown as WishApiModuleResolver);

  return {
    er,
    findAllByKind,
    getModulePlace,
    whichCoursesIncludeModule,
    whichModulesAreSame,
    getUserByUuid,
    publish,
  };
}

describe('InviteWishersEr', () => {
  // ── Course-ветка ──

  test('поток на первый модуль курса: активные course-желающие получают приглашение', async () => {
    const wish = makeWish();
    const { publish, er } = setupEr({
      courseWishes: [wish],
      moduleWishes: [],
      place: { courseId, isFirst: true, isLast: false },
      matchedCourseIds: [courseId],
      user: { uuid: userId, telegramId, name: 'Иван' },
    });

    await er.handle(makeEvent());

    expect(publish).toHaveBeenCalledTimes(1);
    const event = (publish as ReturnType<typeof mock>).mock.calls[0]![0];
    expect(event.eventName).toBe('wish:invite');
    expect(event.aggregateName).toBe('Wish');
    expect(event.payload).toEqual({
      wishId: wish.uuid,
      streamId,
      userId,
      telegramId,
      wishKind: 'course',
      courseId,
    });
  });

  test('поток не на первом модуле: course-желающие не зовутся', async () => {
    const { publish, whichCoursesIncludeModule, er } = setupEr({
      courseWishes: [makeWish()],
      moduleWishes: [],
      place: { courseId, isFirst: false, isLast: false },
      matchedCourseIds: [courseId],
      user: { uuid: userId, telegramId, name: 'Иван' },
    });

    await er.handle(makeEvent());

    expect(publish).not.toHaveBeenCalled();
    expect(whichCoursesIncludeModule).not.toHaveBeenCalled();
  });

  test('модуль вне опубликованных курсов: course-ветка молчит, module-ветка работает', async () => {
    const courseWish = makeWish();
    const moduleWish = makeModuleWish();
    const { publish, er } = setupEr({
      courseWishes: [courseWish],
      moduleWishes: [moduleWish],
      place: undefined,
      sameModuleIds: [moduleId],
      user: { uuid: userId, telegramId, name: 'Иван' },
    });

    await er.handle(makeEvent());

    expect(publish).toHaveBeenCalledTimes(1);
    const event = (publish as ReturnType<typeof mock>).mock.calls[0]![0];
    expect(event.payload.wishKind).toBe('module');
  });

  test('исторический матчинг: courseId берётся из желания (форк-семья)', async () => {
    const forkCourseId = '55555555-5555-4555-8555-555555555555';
    const wish = makeWish({}, forkCourseId);
    const { publish, er } = setupEr({
      courseWishes: [wish],
      moduleWishes: [],
      place: { courseId, isFirst: true, isLast: false },
      matchedCourseIds: [forkCourseId],
      user: { uuid: userId, telegramId, name: 'Иван' },
    });

    await er.handle(makeEvent());

    expect(publish).toHaveBeenCalledTimes(1);
    const event = (publish as ReturnType<typeof mock>).mock.calls[0]![0];
    // В событии — courseId из желания (cancel-маршрут работает по нему)
    expect(event.payload.courseId).toBe(forkCourseId);
  });

  test('не совпавшее с программой курса желание не зовётся', async () => {
    const { publish, er } = setupEr({
      courseWishes: [makeWish()],
      moduleWishes: [],
      place: { courseId, isFirst: true, isLast: false },
      matchedCourseIds: [],
      user: { uuid: userId, telegramId, name: 'Иван' },
    });

    await er.handle(makeEvent());

    expect(publish).not.toHaveBeenCalled();
  });

  // ── Module-ветка ──

  test('module-желающие зовутся на поток любого модуля (историческая идентичность через фасад)', async () => {
    const wish = makeModuleWish({}, otherModuleId);
    const { publish, er } = setupEr({
      courseWishes: [],
      moduleWishes: [wish],
      place: { courseId, isFirst: false, isLast: false },
      sameModuleIds: [otherModuleId],
      user: { uuid: userId, telegramId, name: 'Иван' },
    });

    await er.handle(makeEvent());

    expect(publish).toHaveBeenCalledTimes(1);
    const event = (publish as ReturnType<typeof mock>).mock.calls[0]![0];
    expect(event.payload).toEqual({
      wishId: wish.uuid,
      streamId,
      userId,
      telegramId,
      wishKind: 'module',
      moduleId: otherModuleId,
    });
  });

  test('только активные статусы: findAllByKind вызывается с expressed|confirmed', async () => {
    const { findAllByKind, er } = setupEr({
      courseWishes: [],
      moduleWishes: [],
      place: { courseId, isFirst: true, isLast: false },
    });

    await er.handle(makeEvent());

    expect(findAllByKind).toHaveBeenCalledWith('course', [
      'expressed',
      'confirmed',
    ]);
    expect(findAllByKind).toHaveBeenCalledWith('module', [
      'expressed',
      'confirmed',
    ]);
  });

  test('желаний нет — пустая рассылка, ошибок нет', async () => {
    const { publish, er } = setupEr({
      courseWishes: [],
      moduleWishes: [],
      place: { courseId, isFirst: true, isLast: false },
    });

    await er.handle(makeEvent());

    expect(publish).not.toHaveBeenCalled();
  });

  test('пользователь без профиля — пропуск без публикации и без ошибки', async () => {
    const { publish, getUserByUuid, er } = setupEr({
      courseWishes: [makeWish()],
      moduleWishes: [],
      place: { courseId, isFirst: true, isLast: false },
      matchedCourseIds: [courseId],
      user: undefined,
    });

    await er.handle(makeEvent());

    expect(getUserByUuid).toHaveBeenCalledWith(userId);
    expect(publish).not.toHaveBeenCalled();
  });

  test('несколько совпавших желаний — по событию на каждое', async () => {
    const wish1 = makeWish();
    const wish2 = makeWish({ status: 'confirmed' });
    const moduleWish = makeModuleWish();
    const { publish, er } = setupEr({
      courseWishes: [wish1, wish2],
      moduleWishes: [moduleWish],
      place: { courseId, isFirst: true, isLast: false },
      matchedCourseIds: [courseId],
      sameModuleIds: [moduleId],
      user: { uuid: userId, telegramId, name: 'Иван' },
    });

    await er.handle(makeEvent());

    expect(publish).toHaveBeenCalledTimes(3);
  });
});
