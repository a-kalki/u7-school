import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { StreamsController } from '@u7-scl/bot/streams/controller';
import { ConsoleLogger } from '@u7-scl/core/shared';
import type {
  StudentAbandonedEvent,
  StudentInactivityRemoveCandidateEvent,
  StudentInactivityWarningEvent,
} from '@u7-scl/stream/domain';
import { createTestApp, type TestApp } from '@u7-scl/test-helpers/test-app';
import {
  createTestBotTransport,
  type TestBotTransport,
} from '@u7-scl/test-helpers/test-bot-transport';
import { UserController } from '../../src/controllers/user/controller';
import { registerGroupHandlers } from '../../src/handlers/group-handler';

/**
 * E2E проактивов бездействия и ухода из учёбы (И3, контрак «Диалог и Экран»):
 *   1) предупреждение студенту (5+ дней) — notify-текст без кнопок
 *      с подсказкой /start;
 *   2) кандидат ментору (7+ дней, wasWarned) — notify-текст без кнопок;
 *   3) student.abandoned → мягкий кик из TG-группы потока (FR-6);
 *   4) легаси-кнопка самовыхода → «Неизвестная команда» (callback-тупик);
 *   5) chat_member left активного студента → ментору «покинул группу»,
 *      статус студента не меняется (FR-7);
 *   6) mark-abandoned (UC) → abandoned + мягкий кик (FR-6);
 *   7) chat_member left выбывшего студента → уведомления нет (FR-7).
 *
 * Кнопочные сцены confirm (drop-student / mark-abandoned) удалены из
 * проактивов осознанно (И3): самовыход — через меню (трек learning),
 * снятие ментором — через monitor (трек mentor). Здесь они не
 * восстанавливаются; проактив — чистый notify-текст, сессию не трогает.
 * Текстовые уведомления UC (drop-student / mark-abandoned) доставляются
 * через userFacade.notify — механизм покрыт user-notify e2e.
 *
 * События job'а публикуются на общую шину (как в бою после inactivity-sweep);
 * кик выполняет InactivityStory через transport.kickFromGroup (ban + unban).
 * Два describe — отдельные фикстуры (сценарии 5–7 меняют статус студента).
 */

const STUDENT_TG = 1003; // «Студент» (active, поток e1e1e1e1)
const MENTOR_TG = 1004; // «Ментор» (ментор обоих потоков)
const BOT_ADMIN_UUID = 'ae00f3f6-1392-4b98-b178-41c27e794b7f'; // «Бот-админ» из фикстур
const STREAM2_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';
const STUDENT_F0 = 'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0';
const STUDENT_USER_ID = '33333333-3333-3333-3333-333333333333';
const GROUP2_ID = '-1002222222222';
const SCHOOL_GROUP_ID = -1003964284604; // ≠ группы потока: выход из неё роль не снимает

interface Stand {
  app: TestApp;
  transport: TestBotTransport;
  student: User;
  mentor: User;
  chatMemberHandlers: Record<string, (ctx: unknown) => Promise<void>>;
}

/** Стенд e2e: TestApp + TestBotTransport + chat_member-обработчики. */
async function createInactivityStand(tag: string): Promise<Stand> {
  const app = await createTestApp(tag);
  const transport = createTestBotTransport(app, [
    new StreamsController(),
    // Доставка user.notified (уведомления UC mark-abandoned)
    new UserController(),
  ]);
  const student = (await app.userFacade.getUserByTelegramId(STUDENT_TG))!;
  const mentor = (await app.userFacade.getUserByTelegramId(MENTOR_TG))!;

  // chat_member-обработчики — как в main.ts (мок grammy Bot)
  const chatMemberHandlers: Record<string, (ctx: unknown) => Promise<void>> =
    {};
  registerGroupHandlers(
    {
      on: (e: string, cb: (ctx: unknown) => Promise<void>) => {
        chatMemberHandlers[e] = cb;
      },
    } as never,
    app.userFacade,
    new ConsoleLogger(),
    {
      apiApp: app.apiApp,
      transport: transport.transport,
      actorId: BOT_ADMIN_UUID,
      schoolGroupId: SCHOOL_GROUP_ID,
    },
  );

  return { app, transport, student, mentor, chatMemberHandlers };
}

/** Ждёт появления проактивного сообщения адресату (poll sentMessages). */
async function waitMessageFor(
  transport: TestBotTransport,
  telegramId: number,
  timeoutMs = 3000,
): Promise<string | undefined> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const found = transport.api.sentMessages.find(
      (m) => m.telegramId === telegramId,
    );
    if (found) return found.text;
    await new Promise((r) => setTimeout(r, 20));
  }
  return undefined;
}

/** Ждёт мягкого кика адресата (poll kickedMembers). */
async function waitKick(
  transport: TestBotTransport,
  telegramId: number,
  timeoutMs = 3000,
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const found = transport.api.kickedMembers.find(
      (k) => k.telegramId === telegramId,
    );
    if (found) return found;
    await new Promise((r) => setTimeout(r, 20));
  }
  return undefined;
}

/** Публикует событие-предупреждение job'а (ступень 5+ дней). */
function publishWarning(app: TestApp, daysInactive: number): void {
  app.eventBus.publish({
    eventId: crypto.randomUUID(),
    eventName: 'student.inactivity-warning',
    occurredAt: '2026-09-09T12:00',
    aggregateName: 'Student',
    aggregateId: STUDENT_F0,
    payload: {
      studentId: STUDENT_F0,
      userId: STUDENT_USER_ID,
      streamId: STREAM2_ID,
      telegramId: STUDENT_TG,
      daysInactive,
    },
  } satisfies StudentInactivityWarningEvent);
}

/** Публикует событие-кандидата на снятие (ступень 7+ дней). */
function publishCandidate(
  app: TestApp,
  daysInactive: number,
  wasWarned: boolean,
): void {
  app.eventBus.publish({
    eventId: crypto.randomUUID(),
    eventName: 'student.inactivity-remove-candidate',
    occurredAt: '2026-09-09T12:00',
    aggregateName: 'Student',
    aggregateId: STUDENT_F0,
    payload: {
      studentId: STUDENT_F0,
      userId: STUDENT_USER_ID,
      streamId: STREAM2_ID,
      mentorTelegramId: MENTOR_TG,
      daysInactive,
      wasWarned,
    },
  } satisfies StudentInactivityRemoveCandidateEvent);
}

/** Публикует событие ухода из учёбы (подписчик — мягкий кик, FR-6). */
function publishAbandoned(app: TestApp): void {
  app.eventBus.publish({
    eventId: crypto.randomUUID(),
    eventName: 'student.abandoned',
    occurredAt: '2026-09-09T12:00',
    aggregateName: 'Student',
    aggregateId: STUDENT_F0,
    payload: {
      studentId: STUDENT_F0,
      userId: STUDENT_USER_ID,
      streamId: STREAM2_ID,
      who: 'self',
      cause: 'voluntary',
    },
  } satisfies StudentAbandonedEvent);
}

// ═══ Контур A: проактивы бездействия (FR-1) + callback-тупик (И3) ═══

describe('E2E: проактивы бездействия (трек student-inactivity)', () => {
  let stand: Stand;

  beforeAll(async () => {
    stand = await createInactivityStand('inactivity-proactive');
  });

  afterAll(async () => {
    await stand.app.cleanup();
  });

  test('warning (5 дней) → студенту notify-текст без кнопок, подсказка /start', async () => {
    const { app, transport } = stand;
    transport.reset();

    publishWarning(app, 5);

    const text = await waitMessageFor(transport, STUDENT_TG);
    expect(text).toBeDefined();
    expect(text).toContain('Учёба стоит');
    expect(text).toContain('5 дней');
    expect(text).toContain('снять тебя с учёбы');
    // И3: получателю без открытого диалога подсказан /start
    expect(text).toContain('/start');
    // Проактив — реплика без клавиатуры: экран и сессию не трогает
    const msg = transport.api.sentMessages.find(
      (m) => m.telegramId === STUDENT_TG,
    );
    expect(msg?.keyboard).toBeUndefined();
  });

  test('candidate (7 дней, wasWarned) → ментору notify без кнопок', async () => {
    const { app, transport } = stand;
    transport.reset();

    publishCandidate(app, 7, true);

    const text = await waitMessageFor(transport, MENTOR_TG);
    expect(text).toBeDefined();
    expect(text).toContain('Кандидат на снятие с учёбы');
    // Имя студента и группа резолвятся из профиля/потока
    expect(text).toContain('Студент');
    expect(text).toContain('JS Core — Поток 2');
    expect(text).toContain('не занимался 7 дней');
    expect(text).toContain('Уведомления были ранее отправлены');
    expect(text).toContain('/start');
    // Без кнопок: confirm-сцена снятия ушла в monitor (долг трека mentor)
    const msg = transport.api.sentMessages.find(
      (m) => m.telegramId === MENTOR_TG,
    );
    expect(msg?.keyboard).toBeUndefined();
  });

  test('student.abandoned → мягкий кик из группы потока (FR-6)', async () => {
    const { app, transport } = stand;
    transport.reset();

    publishAbandoned(app);

    const kick = await waitKick(transport, STUDENT_TG);
    expect(kick).toBeDefined();
    expect(String(kick?.chatId)).toBe(GROUP2_ID);
    // Мягкость: ban на 60 секунд + мгновенный unban (можно вернуться)
    expect(kick?.unbanned).toBe(true);
  });

  test('легаси-кнопка самовыхода → «Неизвестная команда», без падений (И3)', async () => {
    const { transport } = stand;
    transport.reset();

    // /start: диалог seq=1 — косвенно подтверждает, что проактивы выше
    // сессию студента не трогали (иначе штамп не совпал бы)
    const startResp = await transport.handleStart(
      transport.makeBotContext(STUDENT_TG),
    );
    expect(startResp.screen?.text).toContain('Привет');

    // Кнопка «Покинуть учёбу» из истории чата: код по форме валиден,
    // штамп совпадает с seq, но действия drop-student больше нет —
    // тупик без падений, экраном «Неизвестная команда»
    const legacyResp = await transport.handleCallback(
      transport.makeBotContext(STUDENT_TG, {
        callbackData: 'stream:inactivity:drop-student:~1',
      }),
    );
    expect(legacyResp.screen?.text).toContain('Неизвестная команда');
  });
});

// ═══ Контур B: выход из группы + снятие ментором (FR-6/7) ═══

describe('E2E: выход из группы и снятие ментором (трек student-inactivity)', () => {
  let stand: Stand;

  beforeAll(async () => {
    stand = await createInactivityStand('inactivity-group-left');
  });

  afterAll(async () => {
    await stand.app.cleanup();
  });

  test('chat_member left активного студента → ментору «покинул группу», статус не меняется (FR-7)', async () => {
    const { app, transport, mentor, chatMemberHandlers } = stand;
    transport.reset();

    await chatMemberHandlers.chat_member?.({
      chatMember: {
        chat: { id: Number(GROUP2_ID) },
        from: { id: 999 },
        old_chat_member: { status: 'member' },
        new_chat_member: { status: 'left', user: { id: STUDENT_TG } },
      },
    });

    const notice = await waitMessageFor(transport, MENTOR_TG);
    expect(notice).toBeDefined();
    expect(notice).toContain('покинул группу');

    // Статус студента не изменился — решение об уходе принимают люди
    const record = (await app.apiApp.execute(
      'get-student-progress',
      { studentId: STUDENT_F0 },
      mentor.uuid,
    )) as unknown as { status: string };
    expect(record.status).toBe('active');
  });

  test('mark-abandoned (UC) → abandoned + мягкий кик (FR-6)', async () => {
    const { app, transport, mentor } = stand;
    transport.reset();

    // UC напрямую (в бою — кнопка в monitor, долг трека mentor):
    // снимает студента, публикует student.abandoned и уведомляет студента
    await app.apiApp.execute(
      'mark-abandoned',
      { studentId: STUDENT_F0, streamId: STREAM2_ID, cause: 'inactivity' },
      mentor.uuid,
    );

    // Студент abandoned в репозитории
    const record = (await app.apiApp.execute(
      'get-student-progress',
      { studentId: STUDENT_F0 },
      mentor.uuid,
    )) as unknown as { status: string };
    expect(record.status).toBe('abandoned');

    // Мягкий кик из группы потока
    const kick = await waitKick(transport, STUDENT_TG);
    expect(kick).toBeDefined();
    expect(String(kick?.chatId)).toBe(GROUP2_ID);
    expect(kick?.unbanned).toBe(true);

    // Студенту доставлено уведомление UC (полный механизм — user-notify e2e)
    const studentNotice = await waitMessageFor(transport, STUDENT_TG);
    expect(studentNotice).toContain('снят с учёбы');
  });

  test('chat_member left выбывшего студента → ментору уведомления нет (FR-7)', async () => {
    const { transport, chatMemberHandlers } = stand;
    transport.reset();

    await chatMemberHandlers.chat_member?.({
      chatMember: {
        chat: { id: Number(GROUP2_ID) },
        from: { id: 999 },
        old_chat_member: { status: 'member' },
        new_chat_member: { status: 'left', user: { id: STUDENT_TG } },
      },
    });
    await new Promise((r) => setTimeout(r, 200));

    const noticed = transport.api.sentMessages.find(
      (m) => m.telegramId === MENTOR_TG,
    );
    // Студент уже abandoned — ментору «покинул группу» не приходит
    expect(noticed?.text ?? '').not.toContain('покинул группу');
  });
});
