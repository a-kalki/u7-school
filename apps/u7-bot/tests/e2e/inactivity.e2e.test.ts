import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/app/domain';
import { AppController } from '@u7-scl/bot/app/app-controller';
import { StreamsController } from '@u7-scl/bot/streams/controller';
import { ConsoleLogger } from '@u7-scl/core/shared';
import { assertBotResponseValid } from '@u7-scl/core/ui';
import type {
  StudentInactivityRemoveCandidateEvent,
  StudentInactivityWarningEvent,
} from '@u7-scl/stream/domain';
import { createTestApp, type TestApp } from '@u7-scl/test-helpers/test-app';
import {
  createTestBotTransport,
  type TestBotTransport,
} from '@u7-scl/test-helpers/test-bot-transport';
import { MentorController } from '../../src/controllers/mentor/controller';
import { registerGroupHandlers } from '../../src/handlers/group-handler';
import { registerStudentKickHandler } from '../../src/handlers/student-kick-handler';

/**
 * E2E тесты трека student-inactivity_20260830:
 *   1) предупреждение → «Покинуть учёбу» → confirm → abandoned + кик
 *      из группы + уведомление ментору;
 *   2) уведомление ментору → «Снять с учёбы» → confirm → abandoned + кик
 *      + уведомление студенту;
 *   3) самостоятельный выход из TG-группы → уведомление ментору,
 *      статус студента не меняется;
 *   4) карточка студентов: дефолт — только активные, переключатель — все,
 *      сводка «Всего N, из них M активных, P выбывших».
 *
 * События job'а публикуются на общую шину (как в бою после inactivity-sweep);
 * ER кика подключается как в main.ts (botApi = RecordingBotApi).
 * Два describe — отдельные фикстуры (сценарии меняют статус одного студента).
 */

const STUDENT_TG = 1003; // «Студент» (active, поток e1e1e1e1)
const MENTOR_TG = 1004; // «Ментор» (ментор обоих потоков)
const STREAM2_ID = 'e1e1e1e1-e1e1-e1e1-e1e1-e1e1e1e1e1e1';
const STUDENT_F0 = 'f0f0f0f0-f0f0-f0f0-f0f0-f0f0f0f0f0f0';
const GROUP2_ID = '-1002222222222';

interface Stand {
  app: TestApp;
  transport: TestBotTransport;
  student: User;
  mentor: User;
  chatMemberHandlers: Record<string, (ctx: unknown) => Promise<void>>;
}

/** Стенд e2e: TestApp + TestBotTransport + ER кика + chat_member-обработчики. */
async function createInactivityStand(tag: string): Promise<Stand> {
  const app = await createTestApp(tag);
  const transport = createTestBotTransport(app, [
    new AppController('https://t.me/u7_school_group'),
    new StreamsController(),
    new MentorController(),
  ]);
  const student = (await app.userFacade.getUserByTelegramId(STUDENT_TG))!;
  const mentor = (await app.userFacade.getUserByTelegramId(MENTOR_TG))!;

  // ER кика — как в main.ts (ботApi = recording api)
  registerStudentKickHandler({
    eventBus: app.eventBus,
    getStream: async (streamId) =>
      app.apiApp.execute('get-stream', { streamId }),
    userFacade: app.userFacade,
    botApi: transport.api as never,
    logger: new ConsoleLogger(),
  });

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
    { apiApp: app.apiApp, transport: transport.transport },
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

/** Находит кнопку в последнем сообщении адресата. */
function findButtonFor(
  transport: TestBotTransport,
  telegramId: number,
  textContains: string,
): { text: string; code: string } {
  const messages = transport.api.sentMessages.filter(
    (m) => m.telegramId === telegramId,
  );
  const last = messages[messages.length - 1];
  const btn = last?.keyboard?.rows
    .flat()
    .find((b) => b.text.includes(textContains));
  if (!btn) {
    throw new Error(
      `Кнопка «${textContains}» не найдена для tg=${telegramId}. Сообщения: ${messages.map((m) => m.text).join(' || ')}`,
    );
  }
  return btn;
}

// ═══ Контур A: самовыход студента (FR-1 предупреждение + FR-4) ═══

describe('E2E: самовыход «Покинуть учёбу» (трек student-inactivity)', () => {
  let stand: Stand;

  beforeAll(async () => {
    stand = await createInactivityStand('inactivity-self-drop');
  });

  afterAll(async () => {
    await stand.app.cleanup();
  });

  test('предупреждение студенту → «Покинуть учёбу» → abandoned + кик + уведомление ментору', async () => {
    const { app, transport, student, mentor } = stand;
    transport.reset();

    // Job публикует предупреждение (день 5)
    app.eventBus.publish({
      eventId: crypto.randomUUID(),
      eventName: 'student.inactivity-warning',
      occurredAt: '2026-08-30T19:00',
      aggregateName: 'Student',
      aggregateId: STUDENT_F0,
      payload: {
        studentId: STUDENT_F0,
        userId: student.uuid,
        streamId: STREAM2_ID,
        telegramId: STUDENT_TG,
        daysInactive: 5,
      },
    } satisfies StudentInactivityWarningEvent);

    const warningText = await waitMessageFor(transport, STUDENT_TG);
    expect(warningText).toContain('5 дней');
    expect(warningText).toContain('снять тебя с учёбы');

    // Студент нажимает «Покинуть учёбу» → confirm
    const dropBtn = findButtonFor(transport, STUDENT_TG, 'Покинуть учёбу');
    const confirmResp = await transport.handleCallback(
      transport.makeBotContext(STUDENT_TG, { callbackData: dropBtn.code }),
    );
    assertBotResponseValid(confirmResp);
    expect(confirmResp.sendMessage?.text).toContain('Покинуть учёбу');

    // Подтверждение → drop-student
    const yesBtn = confirmResp.sendMessage?.keyboard?.rows
      .flat()
      .find((b) => b.text.includes('Да, покинуть'))!;
    const resultResp = await transport.handleCallback(
      transport.makeBotContext(STUDENT_TG, { callbackData: yesBtn.code }),
    );
    assertBotResponseValid(resultResp);
    expect(resultResp.sendMessage?.text).toContain('покинул учёбу');

    // Студент abandoned в репозитории
    const record = (await app.apiApp.execute(
      'get-student-progress',
      { studentId: STUDENT_F0 },
      mentor.uuid,
    )) as unknown as { status: string };
    expect(record.status).toBe('abandoned');

    // Кик из группы потока (мягкий: ban + unban)
    await new Promise((r) => setTimeout(r, 100));
    const kick = transport.api.kickedMembers.find(
      (k) => k.telegramId === STUDENT_TG,
    );
    expect(kick).toBeDefined();
    expect(String(kick?.chatId)).toBe(GROUP2_ID);
    expect(kick?.unbanned).toBe(true);

    // Ментор уведомлён о самовыходе
    const mentorNotice = await waitMessageFor(transport, MENTOR_TG);
    expect(mentorNotice).toContain('покинул учёбу');
  });
});

// ═══ Контур B: снятие ментором + выход из группы + карточка (FR-1/5/6/7/8) ═══

describe('E2E: снятие ментором, выход из группы, карточка (трек student-inactivity)', () => {
  let stand: Stand;

  beforeAll(async () => {
    stand = await createInactivityStand('inactivity-mentor-flow');
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
    expect(notice).toContain('покинул группу');

    // Статус студента не изменился
    const after = (await app.apiApp.execute(
      'get-student-progress',
      { studentId: STUDENT_F0 },
      mentor.uuid,
    )) as unknown as { status: string };
    expect(after.status).toBe('active');
  });

  test('кандидат ментору → «Снять с учёбы» → abandoned + кик + уведомление студенту', async () => {
    const { app, transport, student } = stand;
    transport.reset();

    app.eventBus.publish({
      eventId: crypto.randomUUID(),
      eventName: 'student.inactivity-remove-candidate',
      occurredAt: '2026-08-30T19:00',
      aggregateName: 'Student',
      aggregateId: STUDENT_F0,
      payload: {
        studentId: STUDENT_F0,
        userId: student.uuid,
        streamId: STREAM2_ID,
        mentorTelegramId: MENTOR_TG,
        daysInactive: 7,
        wasWarned: true,
      },
    } satisfies StudentInactivityRemoveCandidateEvent);

    const candidateText = await waitMessageFor(transport, MENTOR_TG);
    expect(candidateText).toContain('не занимался 7 дней');
    expect(candidateText).toContain('Уведомления были ранее отправлены');

    // Ментор: «Снять с учёбы» → confirm
    const markBtn = findButtonFor(transport, MENTOR_TG, 'Снять с учёбы');
    const confirmResp = await transport.handleCallback(
      transport.makeBotContext(MENTOR_TG, { callbackData: markBtn.code }),
    );
    assertBotResponseValid(confirmResp);
    expect(confirmResp.sendMessage?.text).toContain('Снять студента');

    // Подтверждение → mark-abandoned (cause=inactivity)
    const yesBtn = confirmResp.sendMessage?.keyboard?.rows
      .flat()
      .find((b) => b.text.includes('Да, снять'))!;
    const resultResp = await transport.handleCallback(
      transport.makeBotContext(MENTOR_TG, { callbackData: yesBtn.code }),
    );
    assertBotResponseValid(resultResp);
    expect(resultResp.sendMessage?.text).toContain('снят с учёбы');

    // Студент abandoned
    const record = (await app.apiApp.execute(
      'get-student-progress',
      { studentId: STUDENT_F0 },
      stand.mentor.uuid,
    )) as unknown as { status: string };
    expect(record.status).toBe('abandoned');

    // Студент уведомлён мягкой формулировкой
    const studentNotice = await waitMessageFor(transport, STUDENT_TG);
    expect(studentNotice).toContain('снят с учёбы');

    // Кик из группы
    await new Promise((r) => setTimeout(r, 100));
    const kick = transport.api.kickedMembers.find(
      (k) => k.telegramId === STUDENT_TG,
    );
    expect(kick).toBeDefined();
    expect(kick?.unbanned).toBe(true);
  });

  test('chat_member left выбывшего студента → ментору уведомления нет, ошибок нет (FR-7)', async () => {
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
    await new Promise((r) => setTimeout(r, 100));

    const noticed = transport.api.sentMessages.find(
      (m) => m.telegramId === MENTOR_TG,
    );
    // Студент уже abandoned — ментору «покинул группу» не приходит
    expect(noticed?.text ?? '').not.toContain('покинул группу');
  });

  test('monitor: дефолт — только активные; переключатель показывает всех + сводка', async () => {
    const { transport } = stand;
    transport.reset();

    const studentsResp = await transport.handleCallback(
      transport.makeBotContext(MENTOR_TG, {
        callbackData: `mentor:monitor:students:${STREAM2_ID}`,
      }),
    );
    assertBotResponseValid(studentsResp);

    const text = studentsResp.sendMessage?.text ?? '';
    // Сводка всегда: 3 записи, активных 0 (студент снят), выбывших 3
    expect(text).toMatch(/Всего: 3 студент(а|ов), из них 0 активных/);
    // Дефолт: метрики только по активным — пустых метрик нет
    expect(text).not.toContain('Прошли:');

    // Переключатель
    const showAllBtn = studentsResp.sendMessage?.keyboard?.rows
      .flat()
      .find((b) => b.text.includes('Показать выбывших'))!;
    expect(showAllBtn).toBeDefined();

    const allResp = await transport.handleCallback(
      transport.makeBotContext(MENTOR_TG, {
        callbackData: showAllBtn.code,
      }),
    );
    assertBotResponseValid(allResp);

    const allText = allResp.sendMessage?.text ?? '';
    expect(allText).toContain('Прошли:');
    expect(allText).toContain('Не прошли:');
    expect(allText).toContain('Выбыли:');
    // Обратный переключатель
    expect(
      allResp.sendMessage?.keyboard?.rows
        .flat()
        .some((b) => b.text.includes('Скрыть выбывших')),
    ).toBe(true);
  });
});
