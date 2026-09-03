import { describe, expect, mock, test } from 'bun:test';
import type { StreamCreatedEvent } from '@u7-scl/stream/domain';
import type { WishApiModuleResolver } from '#domain/module';
import type { Wish } from '#domain/wish/entity';
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
  /** Имя ментора (undefined — профиль недоступен). */
  mentorName?: string;
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
  const getUserByUuid = mock(async (uuid: string) =>
    uuid === mentorId && deps.mentorName !== undefined
      ? { uuid, name: deps.mentorName, telegramId: 1 }
      : undefined,
  );
  const notify = mock(async (_userId: string, _text: string) => {});

  const er = new InviteWishersEr();
  er.init({
    wishRepo: { findAllByKind },
    courseFacade: {
      getModulePlace,
      whichCoursesIncludeModule,
      whichModulesAreSame,
    },
    streamFacade: { getStream },
    userFacade: { getUserByUuid, notify },
    eventBus: { publish: mock(() => {}) },
  } as unknown as WishApiModuleResolver);

  return {
    er,
    findAllByKind,
    getModulePlace,
    whichCoursesIncludeModule,
    whichModulesAreSame,
    getStream,
    notify,
  };
}

/** Полный ожидаемый текст FR-6 #8 (с сегментом ментора). */
function expectedText(title: string, date: string, mentor: string): string {
  return `📣 Открылся набор на «${title}», который ты хотел пройти! Старт: ${date}. Ментор: ${mentor}. Подробности: /start → 📚 Потоки курсов. Для записи нужен ключ — его выдаёт ментор. Не актуально — отмени желание: 📖 Программы курсов → карточка курса → 🗑️.`;
}

describe('InviteWishersEr', () => {
  // ── Course-ветка ──

  test('поток на первый модуль курса: желающему уходит notify с текстом FR-6 #8', async () => {
    const wish = makeWish();
    const { notify, er } = setupEr({
      courseWishes: [wish],
      moduleWishes: [],
      place: { courseId, isFirst: true, isLast: false },
      matchedCourseIds: [courseId],
      stream,
      mentorName: 'Мария',
    });

    await er.handle(makeEvent());

    expect(notify).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith(
      userId,
      expectedText('Поток JS', '01.06.2026', 'Мария'),
    );
  });

  test('поток не на первом модуле: course-желающие не зовутся', async () => {
    const { notify, whichCoursesIncludeModule, er } = setupEr({
      courseWishes: [makeWish()],
      moduleWishes: [],
      place: { courseId, isFirst: false, isLast: false },
      matchedCourseIds: [courseId],
      stream,
      mentorName: 'Мария',
    });

    await er.handle(makeEvent());

    expect(notify).not.toHaveBeenCalled();
    expect(whichCoursesIncludeModule).not.toHaveBeenCalled();
  });

  test('модуль вне опубликованных курсов: course-ветка молчит, module-ветка работает', async () => {
    const moduleWish = makeModuleWish();
    const { notify, er } = setupEr({
      courseWishes: [makeWish()],
      moduleWishes: [moduleWish],
      place: undefined,
      sameModuleIds: [moduleId],
      stream,
      mentorName: 'Мария',
    });

    await er.handle(makeEvent());

    expect(notify).toHaveBeenCalledTimes(1);
  });

  test('исторический матчинг: желание на форк курса получает приглашение', async () => {
    const forkCourseId = '55555555-5555-4555-8555-555555555555';
    const wish = makeWish({}, forkCourseId);
    const { notify, er } = setupEr({
      courseWishes: [wish],
      moduleWishes: [],
      place: { courseId, isFirst: true, isLast: false },
      matchedCourseIds: [forkCourseId],
      stream,
      mentorName: 'Мария',
    });

    await er.handle(makeEvent());

    expect(notify).toHaveBeenCalledTimes(1);
  });

  test('не совпавшее с программой курса желание не зовётся', async () => {
    const { notify, er } = setupEr({
      courseWishes: [makeWish()],
      moduleWishes: [],
      place: { courseId, isFirst: true, isLast: false },
      matchedCourseIds: [],
      stream,
      mentorName: 'Мария',
    });

    await er.handle(makeEvent());

    expect(notify).not.toHaveBeenCalled();
  });

  // ── Module-ветка ──

  test('module-желающие зовутся на поток любого модуля (историческая идентичность через фасад)', async () => {
    const wish = makeModuleWish({}, otherModuleId);
    const { notify, er } = setupEr({
      courseWishes: [],
      moduleWishes: [wish],
      place: { courseId, isFirst: false, isLast: false },
      sameModuleIds: [otherModuleId],
      stream,
      mentorName: 'Мария',
    });

    await er.handle(makeEvent());

    expect(notify).toHaveBeenCalledTimes(1);
  });

  test('только активные статусы: findAllByKind вызывается с expressed|confirmed', async () => {
    const { findAllByKind, er } = setupEr({
      courseWishes: [],
      moduleWishes: [],
      place: { courseId, isFirst: true, isLast: false },
      stream,
      mentorName: 'Мария',
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
    const { notify, er } = setupEr({
      courseWishes: [],
      moduleWishes: [],
      place: { courseId, isFirst: true, isLast: false },
      stream,
      mentorName: 'Мария',
    });

    await er.handle(makeEvent());

    expect(notify).not.toHaveBeenCalled();
  });

  test('несколько совпавших желаний — notify каждому желающему', async () => {
    const wish1 = makeWish();
    const wish2 = makeWish({ status: 'confirmed' });
    const moduleWish = makeModuleWish();
    const { notify, er } = setupEr({
      courseWishes: [wish1, wish2],
      moduleWishes: [moduleWish],
      place: { courseId, isFirst: true, isLast: false },
      matchedCourseIds: [courseId],
      sameModuleIds: [moduleId],
      stream,
      mentorName: 'Мария',
    });

    await er.handle(makeEvent());

    expect(notify).toHaveBeenCalledTimes(3);
  });

  // ── Деградация данных ──

  test('поток не найден → notify не шлётся, ошибки нет', async () => {
    const { notify, er } = setupEr({
      courseWishes: [makeWish()],
      moduleWishes: [],
      place: { courseId, isFirst: true, isLast: false },
      matchedCourseIds: [courseId],
      stream: undefined,
      mentorName: 'Мария',
    });

    await expect(er.handle(makeEvent())).resolves.toBeUndefined();
    expect(notify).not.toHaveBeenCalled();
  });

  test('профиль ментора недоступен → notify уходит без сегмента «Ментор:»', async () => {
    const { notify, er } = setupEr({
      courseWishes: [makeWish()],
      moduleWishes: [],
      place: { courseId, isFirst: true, isLast: false },
      matchedCourseIds: [courseId],
      stream,
      mentorName: undefined,
    });

    await er.handle(makeEvent());

    expect(notify).toHaveBeenCalledTimes(1);
    const [, text] = (notify as ReturnType<typeof mock>).mock.calls[0] as [
      string,
      string,
    ];
    expect(text).toContain('Открылся набор на «Поток JS»');
    expect(text).not.toContain('Ментор:');
  });
});
