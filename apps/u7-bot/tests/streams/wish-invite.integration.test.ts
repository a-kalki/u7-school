import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import type { Stream } from '@u7-scl/stream/domain';
import { createTestApp, type TestApp } from '@u7-scl/test-helpers/test-app';
import type { Wish, WishInviteEvent, WishStatus } from '@u7-scl/wish/domain';

/**
 * Интеграционный тест приглашения желающим при открытии набора (трек wish-invite):
 *   create-stream (UC) → stream.created → ER invite-wishers → wish:invite
 *
 * Реальный ApiApp (stream + wish + course на общей шине). Публикация wish:invite
 * ловится подпиской на шину — проверяется payload события (kind, исторические id,
 * telegramId) и полнота/пустота рассылки. UI-доставка приглашения — в e2e-тесте.
 */

// Фикстурные идентификаторы (см. fixtures/templates):
//   a0a0a0a0 — «Синтаксис» (первый модуль курсов fafafafa/29adc3be/ddddddddd/eeeeeeee)
//   a1a1a1a1 — «Алгоритмика» (второй модуль fafafafa, единственный cccccccc)
const FIRST_MODULE_ID = 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0';
const SECOND_MODULE_ID = 'a1a1a1a1-b1b1-4b1b-8b1b-b1b1b1b1b1b1';
// Published instant-курсы (без пула анкеты):
const INSTANT_COURSE_FIRST = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'; // модуль a0a0a0a0
const INSTANT_COURSE_SECOND = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'; // модуль a1a1a1a1
const INSTANT_COURSE_TWO = 'fafafafa-baba-4aba-8aba-babababababa'; // [a0a0a0a0, a1a1a1a1]

describe('Wish: приглашение желающих при открытии набора (интеграционный)', () => {
  let app: TestApp;
  let mentor: User;
  let admin: User;

  /** Все wish:invite с момента старта приложения (фильтруются по userId). */
  const invites: WishInviteEvent[] = [];
  let unsubscribe: (() => void) | undefined;

  beforeAll(async () => {
    app = await createTestApp('wish-invite-int');
    // Подписка на шину: ER invite-wishers подписан раньше (при init модуля),
    // ловим исходящие wish:invite — доменный контур без UI.
    unsubscribe = app.eventBus.subscribe<WishInviteEvent>(
      'wish:invite',
      async (event) => {
        invites.push(event);
      },
    );
    mentor = (await app.userFacade.getUserByTelegramId(1004))!;
    admin = (await app.userFacade.getUserByTelegramId(1005))!;
  });

  afterAll(async () => {
    unsubscribe?.();
    await app.cleanup();
  });

  // ── Хелперы ──

  /**
   * Даёт асинхронной цепочке (publish → ER → publish → подписчики) время
   * разлететься. Нужна только для проверки ОТСУТСТВИЯ событий: наличие
   * ловится poll-ом (waitFor).
   */
  async function settle(): Promise<void> {
    await Bun.sleep(300);
  }

  /** Ожидает событие приглашения для пользователя (poll с таймаутом). */
  async function waitForInvite(userId: string): Promise<WishInviteEvent> {
    const deadline = Date.now() + 3000;
    for (;;) {
      const found = invites.find((e) => e.payload.userId === userId);
      if (found) return found;
      if (Date.now() > deadline) {
        throw new Error(`Таймаут ожидания wish:invite для ${userId}`);
      }
      await Bun.sleep(25);
    }
  }

  function invitesFor(userId: string): WishInviteEvent[] {
    return invites.filter((e) => e.payload.userId === userId);
  }

  /** Создаёт поток от ментора (publish stream.created → ER). */
  async function createStream(
    moduleId: string,
    title: string,
  ): Promise<Stream> {
    return app.apiApp.execute(
      'create-stream',
      {
        title,
        description: 'Поток для интеграционного теста приглашения',
        mentorId: mentor.uuid,
        moduleId,
        startDate: '2026-10-01T10:00',
        enrollmentKey: 'invite-key-123',
      },
      mentor.uuid,
    );
  }

  /** Фиксирует instant-желание пройти курс (публичный UC wish-модуля). */
  async function expressCourseWish(
    user: User,
    courseId: string,
  ): Promise<void> {
    await app.apiApp.execute('create-course-wish', { courseId }, user.uuid);
  }

  /** Фиксирует желание пройти модуль (публичный UC wish-модуля). */
  async function expressModuleWish(
    user: User,
    moduleId: string,
  ): Promise<void> {
    await app.apiApp.execute('create-module-wish', { moduleId }, user.uuid);
  }

  /** Прямая запись желания в репо — для статусов, недостижимых через UC. */
  async function saveWish(
    user: User,
    target: Wish['target'],
    status: WishStatus,
  ): Promise<Wish> {
    const wish: Wish = {
      uuid: crypto.randomUUID(),
      userId: user.uuid,
      target,
      status,
      createdAt: new Date().toISOString(),
    };
    await app.wishRepo.save(wish);
    return wish;
  }

  // ── Course-ветка: набор на стартовый модуль ──

  test('поток на первый модуль: course-желающий получает ровно одно wish:invite', async () => {
    const candidate = (await app.userFacade.getUserByTelegramId(1002))!;
    await expressCourseWish(candidate, INSTANT_COURSE_FIRST);

    const stream = await createStream(
      FIRST_MODULE_ID,
      'Приглашение: первый модуль',
    );

    const invite = await waitForInvite(candidate.uuid);
    expect(invite.eventName).toBe('wish:invite');
    expect(invite.aggregateName).toBe('Wish');
    expect(invite.payload).toEqual({
      wishId: (await app.wishRepo.getByUserAndTarget(candidate.uuid, {
        kind: 'course',
        courseId: INSTANT_COURSE_FIRST,
      }))!.uuid,
      streamId: stream.uuid,
      userId: candidate.uuid,
      telegramId: candidate.telegramId,
      wishKind: 'course',
      // id курса из желания — cancel-маршрут работает по нему
      courseId: INSTANT_COURSE_FIRST,
    });

    // Одноразовость: повторной рассылки для того же потока нет
    await settle();
    expect(invitesFor(candidate.uuid)).toHaveLength(1);
  });

  test('поток не на первом модуле: course-желающие не зовутся', async () => {
    const student = (await app.userFacade.getUserByTelegramId(1003))!;
    // «Продвинутый JavaScript» — единственный модуль a1a1a1a1, но place
    // резолвится по fafafafa (первый содержащий published-курс): isFirst=false
    await expressCourseWish(student, INSTANT_COURSE_SECOND);

    await createStream(SECOND_MODULE_ID, 'Приглашение: второй модуль');

    await settle();
    expect(invitesFor(student.uuid)).toHaveLength(0);
  });

  // ── Module-ветка: поток на любой модуль ──

  test('module-желающий зовётся на поток любого модуля (в т.ч. не первого)', async () => {
    const advanced = (await app.userFacade.getUserByTelegramId(1007))!;
    await expressModuleWish(advanced, SECOND_MODULE_ID);

    const stream = await createStream(
      SECOND_MODULE_ID,
      'Приглашение: module-желание',
    );

    const invite = await waitForInvite(advanced.uuid);
    expect(invite.payload).toEqual({
      wishId: (await app.wishRepo.getByUserAndTarget(advanced.uuid, {
        kind: 'module',
        moduleId: SECOND_MODULE_ID,
      }))!.uuid,
      streamId: stream.uuid,
      userId: advanced.uuid,
      telegramId: advanced.telegramId,
      wishKind: 'module',
      moduleId: SECOND_MODULE_ID,
    });
  });

  // ── Только активные статусы ──

  test('fulfilled/cancelled/abandoned/pending не зовутся (course и module)', async () => {
    const outsider = (await app.userFacade.getUserByTelegramId(1008))!;
    const statuses: WishStatus[] = [
      'fulfilled',
      'cancelled',
      'abandoned',
      'pending',
    ];
    for (const status of statuses) {
      await saveWish(
        outsider,
        { kind: 'course', courseId: INSTANT_COURSE_TWO },
        status,
      );
      await saveWish(
        outsider,
        { kind: 'module', moduleId: FIRST_MODULE_ID },
        status,
      );
    }

    // Поток на стартовый модуль: course-ветка открыта (isFirst=true),
    // module-ветка работает всегда — но статусы неактивны: тишина.
    await createStream(FIRST_MODULE_ID, 'Приглашение: неактивные статусы');

    await settle();
    expect(invitesFor(outsider.uuid)).toHaveLength(0);
  });

  // ── Пустая рассылка ──

  test('активных желаний нет — ни одного wish:invite, ошибок нет', async () => {
    // Гасим все активные желания из предыдущих тестов (оба вида цели;
    // cancelled не мешает созданию нового желания — активных статуса три)
    for (const kind of ['course', 'module'] as const) {
      for (const wish of await app.wishRepo.findAllByKind(kind)) {
        if (wish.status !== 'cancelled' && wish.status !== 'fulfilled') {
          await app.wishRepo.save({ ...wish, status: 'cancelled' });
        }
      }
    }
    const before = invites.length;

    await createStream(FIRST_MODULE_ID, 'Приглашение: пустая рассылка');

    await settle();
    expect(invites.length).toBe(before);
  });
});
