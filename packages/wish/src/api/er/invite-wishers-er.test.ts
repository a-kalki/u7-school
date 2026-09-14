import { describe, expect, mock, test } from 'bun:test';
import type { StreamCreatedEvent } from '@u7-scl/stream/domain';
import type { WishApiModuleResolver } from '#domain/module';
import type { Wish } from '#domain/wish/entity';
import type { WishInvitedEvent } from '#domain/wish/events';
import { InviteWishersEr } from './invite-wishers-er';

const streamId = '11111111-1111-4111-8111-111111111111';
const moduleId = '33333333-3333-4333-8333-333333333333';
const otherModuleId = '99999999-9999-4999-8999-999999999999';
const userId = '22222222-2222-4222-8222-222222222222';
const mentorId = '66666666-6666-4666-8666-666666666666';
const courseId = '44444444-4444-4444-8444-444444444444';

const stream = {
  uuid: streamId,
  title: 'Поток JS',
  startDate: '2026-06-01T00:00:00.000Z',
  mentorId,
};

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
  /** Поток, который возвращает streamFacade (undefined — не найден). */
  stream?: typeof stream | undefined;
  /** Адресат (undefined — профиль недоступен). */
  addressee?: { uuid: string; name: string; telegramId: number } | undefined;
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
  const getStream = mock(async () => deps.stream);
  const getUserByUuid = mock(async () => deps.addressee);
  const publish = mock(async (_event: unknown) => {});
  const logger = { warn: mock(() => {}), info: mock(() => {}) };

  const er = new InviteWishersEr();
  er.init({
    wishRepo: { findAllByKind },
    courseFacade: {
      getModulePlace,
      whichCoursesIncludeModule,
      whichModulesAreSame,
    },
    streamFacade: { getStream },
    userFacade: { getUserByUuid },
    eventBus: { publish },
    appResolver: { logger },
  } as unknown as WishApiModuleResolver);

  return {
    er,
    findAllByKind,
    getModulePlace,
    whichCoursesIncludeModule,
    whichModulesAreSame,
    getStream,
    getUserByUuid,
    publish,
    logger,
  };
}

/** Ожидаемое событие приглашения course-желания. */
function expectedCourseEvent(wishUuid: string): WishInvitedEvent {
  return {
    eventId: expect.any(String),
    eventName: 'wish.invited',
    occurredAt: expect.any(String),
    aggregateName: 'Wish',
    aggregateId: wishUuid,
    payload: {
      userId,
      telegramId: 777,
      streamId,
      targetKind: 'course',
      courseId,
    },
  };
}

describe('InviteWishersEr', () => {
  // ── Course-ветка ──

  test('поток на первый модуль курса: желающему публикуется wish.invited', async () => {
    const wish = makeWish();
    const { publish, er } = setupEr({
      courseWishes: [wish],
      moduleWishes: [],
      place: { courseId, isFirst: true, isLast: false },
      matchedCourseIds: [courseId],
      stream,
      addressee: { uuid: userId, name: 'Гость', telegramId: 777 },
    });

    await er.handle(makeEvent());

    expect(publish).toHaveBeenCalledTimes(1);
    expect(publish).toHaveBeenCalledWith(expectedCourseEvent(wish.uuid));
  });

  test('поток не на первом модуле: course-желающие не зовутся', async () => {
    const { publish, whichCoursesIncludeModule, er } = setupEr({
      courseWishes: [makeWish()],
      moduleWishes: [],
      place: { courseId, isFirst: false, isLast: false },
      stream,
      addressee: { uuid: userId, name: 'Гость', telegramId: 777 },
    });

    await er.handle(makeEvent());

    expect(publish).not.toHaveBeenCalled();
    expect(whichCoursesIncludeModule).not.toHaveBeenCalled();
  });

  test('модуль вне опубликованных курсов: course-ветка молчит, module-ветка работает', async () => {
    const moduleWish = makeModuleWish();
    const { publish, er } = setupEr({
      courseWishes: [makeWish()],
      moduleWishes: [moduleWish],
      place: undefined,
      sameModuleIds: [moduleId],
      stream,
      addressee: { uuid: userId, name: 'Гость', telegramId: 777 },
    });

    await er.handle(makeEvent());

    expect(publish).toHaveBeenCalledTimes(1);
    const event = publish.mock.calls[0]?.[0] as WishInvitedEvent;
    expect(event.payload.targetKind).toBe('module');
    expect(event.payload.moduleId).toBe(moduleId);
    expect(event.payload.courseId).toBeUndefined();
  });

  test('исторический матчинг: желание на форк курса получает приглашение', async () => {
    const forkCourseId = '55555555-5555-4555-8555-555555555555';
    const forkWish = makeWish({}, forkCourseId);
    const { publish, er } = setupEr({
      courseWishes: [forkWish],
      moduleWishes: [],
      place: { courseId, isFirst: true, isLast: false },
      matchedCourseIds: [forkCourseId],
      stream,
      addressee: { uuid: userId, name: 'Гость', telegramId: 777 },
    });

    await er.handle(makeEvent());

    expect(publish).toHaveBeenCalledTimes(1);
    const event = publish.mock.calls[0]?.[0] as WishInvitedEvent;
    expect(event.payload.courseId).toBe(forkCourseId);
  });

  test('не совпавшее с программой курса желание не зовётся', async () => {
    const { publish, er } = setupEr({
      courseWishes: [makeWish()],
      moduleWishes: [],
      place: { courseId, isFirst: true, isLast: false },
      matchedCourseIds: [],
      stream,
      addressee: { uuid: userId, name: 'Гость', telegramId: 777 },
    });

    await er.handle(makeEvent());

    expect(publish).not.toHaveBeenCalled();
  });

  test('module-желающие зовутся на поток любого модуля (историческая идентичность через фасад)', async () => {
    const forkModuleId = '88888888-8888-4888-8888-888888888888';
    const forkWish = makeModuleWish({}, forkModuleId);
    const { publish, er } = setupEr({
      courseWishes: [],
      moduleWishes: [forkWish],
      sameModuleIds: [forkModuleId],
      stream,
      addressee: { uuid: userId, name: 'Гость', telegramId: 777 },
    });

    await er.handle(makeEvent());

    expect(publish).toHaveBeenCalledTimes(1);
    const event = publish.mock.calls[0]?.[0] as WishInvitedEvent;
    expect(event.payload.moduleId).toBe(forkModuleId);
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

  test('желаний нет — событий нет, ошибок нет', async () => {
    const { publish, er } = setupEr({ courseWishes: [], moduleWishes: [] });

    await er.handle(makeEvent());

    expect(publish).not.toHaveBeenCalled();
  });

  test('несколько совпавших желаний — событие каждому желающему', async () => {
    const otherUserId = '77777777-7777-4777-8777-777777777777';
    const wishA = makeWish();
    const wishB = makeWish({ userId: otherUserId });
    const { publish, er } = setupEr({
      courseWishes: [wishA, wishB],
      moduleWishes: [],
      place: { courseId, isFirst: true, isLast: false },
      matchedCourseIds: [courseId],
      stream,
      addressee: { uuid: userId, name: 'Гость', telegramId: 777 },
    });

    await er.handle(makeEvent());

    expect(publish).toHaveBeenCalledTimes(2);
  });

  test('поток не найден → событие не публикуется, ошибки нет', async () => {
    const { publish, er } = setupEr({
      courseWishes: [makeWish()],
      moduleWishes: [],
      place: { courseId, isFirst: true, isLast: false },
      matchedCourseIds: [courseId],
      stream: undefined,
      addressee: { uuid: userId, name: 'Гость', telegramId: 777 },
    });

    await er.handle(makeEvent());

    expect(publish).not.toHaveBeenCalled();
  });

  test('у адресата нет telegramId → пропуск с лог-предупреждением', async () => {
    const { publish, getUserByUuid, logger, er } = setupEr({
      courseWishes: [makeWish()],
      moduleWishes: [],
      place: { courseId, isFirst: true, isLast: false },
      matchedCourseIds: [courseId],
      stream,
      addressee: { uuid: userId, name: 'Гость', telegramId: 777 },
    });
    // Профиль есть, но без telegramId
    (getUserByUuid as ReturnType<typeof mock>).mockImplementation(
      async () =>
        ({ uuid: userId, name: 'Гость' }) as unknown as {
          uuid: string;
          name: string;
          telegramId: number;
        },
    );

    await er.handle(makeEvent());

    expect(publish).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });

  test('профиль адресата недоступен → пропуск с лог-предупреждением', async () => {
    const { publish, logger, er } = setupEr({
      courseWishes: [makeWish()],
      moduleWishes: [],
      place: { courseId, isFirst: true, isLast: false },
      matchedCourseIds: [courseId],
      stream,
      addressee: undefined,
    });

    await er.handle(makeEvent());

    expect(publish).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });
});
